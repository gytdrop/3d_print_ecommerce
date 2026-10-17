package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"techazsure-3dprint/backend/internal/db"
	"techazsure-3dprint/backend/internal/lithophane"
	"techazsure-3dprint/backend/internal/service"
)

// maxPhotoBytes limits lamp photo uploads to 15 MB (photo-lamp-spec.md P0-2).
const maxPhotoBytes = 15 << 20

// uploadRoot resolves the local file storage directory. Replaced by S3/GCS
// presigned uploads in Phase 2.
func uploadRoot() string {
	if dir := os.Getenv("UPLOAD_DIR"); dir != "" {
		return dir
	}
	return "./uploads"
}

// HandlePhotoUpload handles POST /api/uploads/photo (multipart field "photo").
// Accepts JPEG/PNG — the frontend crop step always exports JPEG, and these are
// the formats the lithophane generator can decode.
func HandlePhotoUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxPhotoBytes+(1<<20))
	if err := r.ParseMultipartForm(maxPhotoBytes); err != nil {
		writeJSONError(w, http.StatusRequestEntityTooLarge, "Photo must be 15MB or smaller")
		return
	}

	file, header, err := r.FormFile("photo")
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "Missing multipart field 'photo'")
		return
	}
	defer file.Close()

	sniff := make([]byte, 512)
	n, _ := io.ReadFull(file, sniff)
	contentType := http.DetectContentType(sniff[:n])
	var ext string
	switch contentType {
	case "image/jpeg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	default:
		writeJSONError(w, http.StatusUnsupportedMediaType, "Photo must be a JPEG or PNG image")
		return
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	photoDir := filepath.Join(uploadRoot(), "photos")
	if err := os.MkdirAll(photoDir, 0o755); err != nil {
		log.Printf("[API] Failed to create upload dir: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	name := randomHex(16) + ext
	dstPath := filepath.Join(photoDir, name)
	dst, err := os.Create(dstPath)
	if err != nil {
		log.Printf("[API] Failed to create photo file: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	size, err := io.Copy(dst, file)
	if err != nil {
		os.Remove(dstPath)
		log.Printf("[API] Failed to store photo: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"photo_url": "/uploads/photos/" + name,
		"file_name": header.Filename,
		"file_size": size,
	})
}

// validateLampOrder checks the lamp-specific fields of an order request and
// resolves the stored photo's absolute path.
func validateLampOrder(req *OrderRequest) (photoPath string, errMsg string) {
	if _, ok := service.LampSizes[req.LampSize]; !ok {
		return "", "lamp_size must be small, medium, or large"
	}
	if !service.LampOrientations[req.LampOrientation] {
		return "", "lamp_orientation must be landscape or portrait"
	}
	if !service.LampBoxColors[req.LampBoxColor] {
		return "", "lamp_box_color must be black, white, or walnut"
	}
	const prefix = "/uploads/photos/"
	if !strings.HasPrefix(req.PhotoURL, prefix) {
		return "", "photo_url must reference an uploaded photo"
	}
	name := strings.TrimPrefix(req.PhotoURL, prefix)
	if name == "" || strings.Contains(name, "/") || strings.Contains(name, "..") {
		return "", "photo_url must reference an uploaded photo"
	}
	photoPath = filepath.Join(uploadRoot(), "photos", name)
	if _, err := os.Stat(photoPath); err != nil {
		return "", "Uploaded photo not found — please re-upload and try again"
	}
	return photoPath, ""
}

// generateLampSTL runs in a goroutine after a photo_lamp order is placed. It
// writes the printable lithophane STL and records the outcome on the order so
// a failure flags the order for operator attention instead of losing it.
func generateLampSTL(orderID, photoPath, size, orientation string) {
	cfg := service.LampSizes[size]
	widthMm, heightMm := cfg.PanelWidthMm, cfg.PanelHeightMm
	if orientation == "portrait" {
		widthMm, heightMm = heightMm, widthMm
	}

	stlDir := filepath.Join(uploadRoot(), "lithophanes")
	outName := orderID + ".stl"
	outPath := filepath.Join(stlDir, outName)

	err := os.MkdirAll(stlDir, 0o755)
	if err == nil {
		err = lithophane.GenerateFromImage(photoPath, outPath, widthMm, heightMm)
	}

	ctx := context.Background()
	if err != nil {
		log.Printf("[LAMP] STL generation failed for order %s: %v", orderID, err)
		_, _ = db.DB.ExecContext(ctx,
			`UPDATE orders SET stl_generation_status = 'failed' WHERE id::text = $1`, orderID)
		_, _ = db.DB.ExecContext(ctx,
			`INSERT INTO order_timeline (order_id, stage, message, location)
			 VALUES ($1::uuid, 'order_placed', 'Automatic relief generation needs operator attention — our team will prepare your lithophane manually.', 'Bangalore Hub')`,
			orderID)
		return
	}

	_, _ = db.DB.ExecContext(ctx,
		`UPDATE orders SET stl_generation_status = 'generated', generated_stl_url = $2 WHERE id::text = $1`,
		orderID, "/uploads/lithophanes/"+outName)
	_, _ = db.DB.ExecContext(ctx,
		`INSERT INTO order_timeline (order_id, stage, message, location)
		 VALUES ($1::uuid, 'order_placed', 'Lithophane relief model generated and queued for farm slicing.', 'Bangalore Hub')`,
		orderID)
	log.Printf("[LAMP] STL generated for order %s → %s", orderID, outPath)
}

// writeJSONError writes a JSON error payload with the given status code.
func writeJSONError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// randomHex returns n random bytes hex-encoded (2n characters).
func randomHex(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		// crypto/rand never fails on supported platforms; fall back defensively.
		return "fallback"
	}
	return hex.EncodeToString(b)
}
