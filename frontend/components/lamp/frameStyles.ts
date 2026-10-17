/**
 * Frame style definitions for the Photo Lamp configurator — each style's
 * geometry is coded separately so new frames can be added without touching
 * the preview component. All builders work in scene units (10 cm = 1 unit)
 * and receive the panel's width/height plus the chosen finish color.
 */

import * as THREE from 'three';

export type FrameStyleId = 'lamp-box' | 'classic' | 'minimal' | 'vintage' | 'heart' | 'celebration';

export interface FrameStyleDef {
  id: FrameStyleId;
  label: string;
  description: string;
}

export const FRAME_STYLES: FrameStyleDef[] = [
  { id: 'lamp-box', label: 'Lamp Box', description: 'Cuboidal LED lamp with side switch' },
  { id: 'classic', label: 'Classic', description: 'Rectangular backlit frame' },
  { id: 'minimal', label: 'Minimal', description: 'Thin borderless gallery frame' },
  { id: 'vintage', label: 'Vintage', description: 'Deep double-border frame' },
  { id: 'heart', label: 'Heart', description: 'Heart-shaped backlit panel' },
  { id: 'celebration', label: 'Celebration', description: 'Festive embossed stud border' },
];

/** Maps /explore catalog frame products onto configurator frame styles —
 *  every catalog frame opens the customizer with its style pre-selected. */
export const FRAME_STYLE_BY_PRODUCT: Record<string, FrameStyleId> = {
  'photo-lamp-frame': 'lamp-box',
  'classic-lithophane': 'classic',
  'heart-shaped-memory': 'heart',
  'ornate-vintage-border': 'vintage',
  'sleek-minimalist-gallery': 'minimal',
  'embossed-celebration': 'celebration',
};

export function isFrameStyleId(value: string | undefined): value is FrameStyleId {
  return !!value && FRAME_STYLES.some((f) => f.id === value);
}

/** Standard material for frame bodies in the chosen finish. */
function frameMaterial(colorHex: string, walnut: boolean): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: walnut ? 0.75 : 0.55,
    metalness: 0.05,
  });
}

/**
 * Rectangular border frame: four box pieces around the panel plus a backing
 * plate that houses the LED. Used by classic / minimal / vintage with
 * different border widths and depths.
 */
function buildRectBorder(
  group: THREE.Group,
  w: number,
  h: number,
  ft: number, // border width
  fd: number, // border depth
  mat: THREE.MeshStandardMaterial,
) {
  const top = new THREE.Mesh(new THREE.BoxGeometry(w + 2 * ft, ft, fd), mat);
  top.position.set(0, (h + ft) / 2, 0);
  const bottom = top.clone();
  bottom.position.y = -(h + ft) / 2;
  const left = new THREE.Mesh(new THREE.BoxGeometry(ft, h + 2 * ft, fd), mat);
  left.position.set(-(w + ft) / 2, 0, 0);
  const right = left.clone();
  right.position.x = (w + ft) / 2;
  group.add(top, bottom, left, right);

  // Backing plate behind the panel (houses the LED strip).
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(w + 2 * ft, h + 2 * ft, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.8 }),
  );
  back.position.z = -fd / 2 - 0.015;
  group.add(back);
}

/** Normalized heart path (classic three.js heart), centered at origin,
 *  spanning roughly [-0.5, 0.5] in both axes before scaling. */
function heartShape(scaleX: number, scaleY: number): THREE.Shape {
  const s = new THREE.Shape();
  // Raw curve bounds: x ∈ [-30, 80], y ∈ [0, 95] → center (25, 47.5), span 110×95.
  const px = (x: number) => ((x - 25) / 110) * scaleX;
  const py = (y: number) => -((y - 47.5) / 95) * scaleY; // flip so the point faces down
  s.moveTo(px(25), py(25));
  s.bezierCurveTo(px(25), py(25), px(20), py(0), px(0), py(0));
  s.bezierCurveTo(px(-30), py(0), px(-30), py(35), px(-30), py(35));
  s.bezierCurveTo(px(-30), py(55), px(-10), py(77), px(25), py(95));
  s.bezierCurveTo(px(60), py(77), px(80), py(55), px(80), py(35));
  s.bezierCurveTo(px(80), py(35), px(80), py(0), px(50), py(0));
  s.bezierCurveTo(px(35), py(0), px(25), py(25), px(25), py(25));
  return s;
}

/**
 * Heart-shaped alpha mask drawn on a canvas — applied to the subdivided
 * panel plane so the displaced lithophane relief is clipped to the heart.
 */
export function heartAlphaMask(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#fff';
  ctx.save();
  // Map heart raw coords (x -30..80, y 0..95) onto the canvas with a margin.
  const margin = 0.06 * size;
  const sx = (size - 2 * margin) / 110;
  const sy = (size - 2 * margin) / 95;
  ctx.translate(margin + 30 * sx, margin);
  ctx.scale(sx, sy);
  ctx.beginPath();
  ctx.moveTo(25, 25);
  ctx.bezierCurveTo(25, 25, 20, 0, 0, 0);
  ctx.bezierCurveTo(-30, 0, -30, 35, -30, 35);
  ctx.bezierCurveTo(-30, 55, -10, 77, 25, 95);
  ctx.bezierCurveTo(60, 77, 80, 55, 80, 35);
  ctx.bezierCurveTo(80, 35, 80, 0, 50, 0);
  ctx.bezierCurveTo(35, 0, 25, 25, 25, 25);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  // Canvas y-down vs UV y-up: flipY(default true) + our y-flip in py() cancel
  // out so the heart points down-up correctly on the plane.
  return tex;
}

/**
 * Builds the frame geometry for a non-lamp-box style around a w×h panel.
 * Returns the group's extra meshes (already added to `group`).
 */
export function buildFrameStyle(
  group: THREE.Group,
  style: FrameStyleId,
  w: number,
  h: number,
  colorHex: string,
  walnut: boolean,
) {
  const mat = frameMaterial(colorHex, walnut);

  switch (style) {
    case 'classic':
      buildRectBorder(group, w, h, 0.09, 0.14, mat);
      break;

    case 'minimal':
      buildRectBorder(group, w, h, 0.035, 0.08, mat);
      break;

    case 'celebration': {
      buildRectBorder(group, w, h, 0.11, 0.15, mat);
      // Festive embossed studs spaced along the border.
      const studMat = new THREE.MeshStandardMaterial({
        color: 0xd4a24a,
        roughness: 0.35,
        metalness: 0.5,
      });
      const studGeo = new THREE.SphereGeometry(0.028, 12, 10);
      const bw = (w + 0.22) / 2; // stud track: center of the border
      const bh = (h + 0.22) / 2;
      const addStud = (x: number, y: number) => {
        const stud = new THREE.Mesh(studGeo, studMat);
        stud.position.set(x, y, 0.085);
        group.add(stud);
      };
      const stepsX = Math.max(3, Math.round(w / 0.3));
      const stepsY = Math.max(2, Math.round(h / 0.3));
      for (let i = 0; i <= stepsX; i++) {
        const x = -bw + (2 * bw * i) / stepsX;
        addStud(x, bh);
        addStud(x, -bh);
      }
      for (let i = 1; i < stepsY; i++) {
        const y = -bh + (2 * bh * i) / stepsY;
        addStud(-bw, y);
        addStud(bw, y);
      }
      break;
    }

    case 'vintage': {
      buildRectBorder(group, w, h, 0.14, 0.18, mat);
      // Inner decorative lip.
      const lipMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex).offsetHSL(0, 0, walnut ? 0.08 : 0.12),
        roughness: 0.45,
        metalness: 0.25,
      });
      buildRectBorder(group, w * 0.98, h * 0.98, 0.03, 0.2, lipMat);
      break;
    }

    case 'heart': {
      // Extruded heart outline: outer heart with a scaled inner hole.
      const span = Math.min(w, h) * 1.15;
      const outer = heartShape(span * 1.18, span * 1.18);
      const inner = heartShape(span, span);
      outer.holes.push(new THREE.Path(inner.getPoints(48)));
      const geo = new THREE.ExtrudeGeometry(outer, {
        depth: 0.12,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2,
      });
      geo.translate(0, 0, -0.06);
      group.add(new THREE.Mesh(geo, mat));

      // Heart backing plate.
      const backGeo = new THREE.ShapeGeometry(heartShape(span * 1.18, span * 1.18), 24);
      const back = new THREE.Mesh(
        backGeo,
        new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.8 }),
      );
      back.position.z = -0.08;
      group.add(back);
      break;
    }
  }
}
