package lithophane

import (
	"encoding/binary"
	"image"
	"image/color"
	"image/png"
	"math"
	"os"
	"path/filepath"
	"testing"
)

// TestGenerateFromImage renders a small gradient photo and checks the STL is
// well-formed: valid header, declared triangle count matches the byte length,
// and all z values stay within the thickness bounds.
func TestGenerateFromImage(t *testing.T) {
	dir := t.TempDir()
	photoPath := filepath.Join(dir, "photo.png")
	outPath := filepath.Join(dir, "panel.stl")

	img := image.NewGray(image.Rect(0, 0, 64, 48))
	for y := 0; y < 48; y++ {
		for x := 0; x < 64; x++ {
			img.SetGray(x, y, color.Gray{Y: uint8(x * 4)})
		}
	}
	f, err := os.Create(photoPath)
	if err != nil {
		t.Fatal(err)
	}
	if err := png.Encode(f, img); err != nil {
		t.Fatal(err)
	}
	f.Close()

	if err := GenerateFromImage(photoPath, outPath, 100, 80); err != nil {
		t.Fatalf("GenerateFromImage failed: %v", err)
	}

	data, err := os.ReadFile(outPath)
	if err != nil {
		t.Fatal(err)
	}
	if len(data) < 84 {
		t.Fatalf("STL too short: %d bytes", len(data))
	}
	triCount := binary.LittleEndian.Uint32(data[80:84])
	wantLen := 84 + int(triCount)*50
	if len(data) != wantLen {
		t.Fatalf("STL length %d does not match declared %d triangles (want %d bytes)", len(data), triCount, wantLen)
	}

	// Spot-check vertex z bounds across all triangles.
	for i := 0; i < int(triCount); i++ {
		base := 84 + i*50 + 12 // skip normal
		for v := 0; v < 3; v++ {
			zBits := binary.LittleEndian.Uint32(data[base+v*12+8 : base+v*12+12])
			z := float64(math.Float32frombits(zBits))
			if z < -0.001 || z > MaxThicknessMm+0.001 {
				t.Fatalf("triangle %d vertex %d z=%.3f outside [0, %.1f]", i, v, z, MaxThicknessMm)
			}
		}
	}
}
