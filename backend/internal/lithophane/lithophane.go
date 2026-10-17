// Package lithophane converts a photo into a printable 2.5D relief panel.
//
// The generated panel is a watertight binary STL: a flat back at z=0, a
// displaced top surface where darker pixels are thicker (blocking more light
// when backlit), and side walls closing the rim. Units are millimetres.
package lithophane

import (
	"encoding/binary"
	"errors"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"math"
	"os"
)

const (
	// MinThicknessMm is the thinnest (brightest) region of the panel.
	MinThicknessMm = 0.8
	// MaxThicknessMm is the thickest (darkest) region of the panel.
	MaxThicknessMm = 2.8
	// maxGridSamples caps the heightmap resolution along the longest panel
	// edge (512 samples on a 200mm panel ≈ 0.39mm pixel pitch).
	maxGridSamples = 512
)

// GenerateFromImage reads a JPEG/PNG photo and writes a binary STL lithophane
// panel of widthMm × heightMm to outPath. The image is box-resampled onto the
// heightmap grid; callers pre-crop the photo to the panel aspect ratio.
func GenerateFromImage(photoPath, outPath string, widthMm, heightMm float64) error {
	if widthMm <= 0 || heightMm <= 0 {
		return errors.New("panel dimensions must be positive")
	}

	f, err := os.Open(photoPath)
	if err != nil {
		return err
	}
	defer f.Close()

	img, _, err := image.Decode(f)
	if err != nil {
		return err
	}

	grid := buildHeightmap(img, widthMm, heightMm)
	return writeBinarySTL(outPath, grid, widthMm, heightMm)
}

// buildHeightmap box-samples the image into a thickness grid (mm).
// grid[y][x] where y=0 is the top of the image.
func buildHeightmap(img image.Image, widthMm, heightMm float64) [][]float64 {
	var nx, ny int
	if widthMm >= heightMm {
		nx = maxGridSamples
		ny = int(math.Max(2, math.Round(float64(maxGridSamples)*heightMm/widthMm)))
	} else {
		ny = maxGridSamples
		nx = int(math.Max(2, math.Round(float64(maxGridSamples)*widthMm/heightMm)))
	}

	b := img.Bounds()
	iw, ih := b.Dx(), b.Dy()

	grid := make([][]float64, ny)
	for gy := 0; gy < ny; gy++ {
		grid[gy] = make([]float64, nx)
		// Source row range for this grid row (box sampling).
		y0 := b.Min.Y + gy*ih/ny
		y1 := b.Min.Y + (gy+1)*ih/ny
		if y1 <= y0 {
			y1 = y0 + 1
		}
		for gx := 0; gx < nx; gx++ {
			x0 := b.Min.X + gx*iw/nx
			x1 := b.Min.X + (gx+1)*iw/nx
			if x1 <= x0 {
				x1 = x0 + 1
			}
			var sum, count float64
			for y := y0; y < y1; y++ {
				for x := x0; x < x1; x++ {
					r, g, bl, _ := img.At(x, y).RGBA()
					// Rec. 601 luminance on 16-bit channel values.
					lum := (0.299*float64(r) + 0.587*float64(g) + 0.114*float64(bl)) / 65535.0
					sum += lum
					count++
				}
			}
			lum := sum / count
			// Dark pixels → thick (block light), bright pixels → thin.
			grid[gy][gx] = MinThicknessMm + (1.0-lum)*(MaxThicknessMm-MinThicknessMm)
		}
	}
	return grid
}

type vec3 struct{ x, y, z float32 }

// writeBinarySTL emits a watertight mesh: displaced top surface, flat back,
// and four perimeter walls.
func writeBinarySTL(outPath string, grid [][]float64, widthMm, heightMm float64) error {
	ny := len(grid)
	nx := len(grid[0])
	cellW := widthMm / float64(nx-1)
	cellH := heightMm / float64(ny-1)

	// Vertex helper: grid (gx, gy) → panel coordinates. Image row 0 maps to
	// the top of the panel (max Y) so the print matches the photo.
	top := func(gx, gy int) vec3 {
		return vec3{
			x: float32(float64(gx) * cellW),
			y: float32(heightMm - float64(gy)*cellH),
			z: float32(grid[gy][gx]),
		}
	}
	back := func(gx, gy int) vec3 {
		return vec3{
			x: float32(float64(gx) * cellW),
			y: float32(heightMm - float64(gy)*cellH),
			z: 0,
		}
	}

	quads := (nx - 1) * (ny - 1)
	wallQuads := 2*(nx-1) + 2*(ny-1)
	triCount := uint32(2*quads /*top*/ + 2*quads /*back*/ + 2*wallQuads)

	f, err := os.Create(outPath)
	if err != nil {
		return err
	}
	defer f.Close()

	header := make([]byte, 80)
	copy(header, []byte("TechAZsure lithophane panel"))
	if _, err := f.Write(header); err != nil {
		return err
	}
	if err := binary.Write(f, binary.LittleEndian, triCount); err != nil {
		return err
	}

	writeTri := func(a, b, c vec3) error {
		// Facet normal via cross product (unnormalized is tolerated by
		// slicers, but normalize for correctness).
		ux, uy, uz := b.x-a.x, b.y-a.y, b.z-a.z
		vx, vy, vz := c.x-a.x, c.y-a.y, c.z-a.z
		n := vec3{uy*vz - uz*vy, uz*vx - ux*vz, ux*vy - uy*vx}
		l := float32(math.Sqrt(float64(n.x*n.x + n.y*n.y + n.z*n.z)))
		if l > 0 {
			n.x /= l
			n.y /= l
			n.z /= l
		}
		data := []float32{n.x, n.y, n.z, a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z}
		if err := binary.Write(f, binary.LittleEndian, data); err != nil {
			return err
		}
		var attr uint16
		return binary.Write(f, binary.LittleEndian, attr)
	}

	for gy := 0; gy < ny-1; gy++ {
		for gx := 0; gx < nx-1; gx++ {
			// Top surface (normal +z): counter-clockwise seen from +z.
			tl, tr := top(gx, gy), top(gx+1, gy)
			bl, br := top(gx, gy+1), top(gx+1, gy+1)
			if err := writeTri(bl, br, tr); err != nil {
				return err
			}
			if err := writeTri(bl, tr, tl); err != nil {
				return err
			}
			// Back surface (normal -z): reversed winding.
			kbl, kbr := back(gx, gy+1), back(gx+1, gy+1)
			ktl, ktr := back(gx, gy), back(gx+1, gy)
			if err := writeTri(kbl, ktr, kbr); err != nil {
				return err
			}
			if err := writeTri(kbl, ktl, ktr); err != nil {
				return err
			}
		}
	}

	// Perimeter walls connect the top rim to the back rim.
	wall := func(a, b vec3) error {
		ab, bb := vec3{a.x, a.y, 0}, vec3{b.x, b.y, 0}
		if err := writeTri(ab, bb, b); err != nil {
			return err
		}
		return writeTri(ab, b, a)
	}
	for gx := 0; gx < nx-1; gx++ {
		// Bottom edge of panel (gy = ny-1, y = 0): outward normal -y.
		if err := wall(top(gx, ny-1), top(gx+1, ny-1)); err != nil {
			return err
		}
		// Top edge of panel (gy = 0, y = heightMm): outward normal +y.
		if err := wall(top(gx+1, 0), top(gx, 0)); err != nil {
			return err
		}
	}
	for gy := 0; gy < ny-1; gy++ {
		// Left edge (gx = 0): outward normal -x.
		if err := wall(top(0, gy), top(0, gy+1)); err != nil {
			return err
		}
		// Right edge (gx = nx-1): outward normal +x.
		if err := wall(top(nx-1, gy+1), top(nx-1, gy)); err != nil {
			return err
		}
	}

	return nil
}
