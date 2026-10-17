'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * "See it in your space" — an orbitable vignette on /explore showing the
 * Photo Lamp glowing in the places customers typically keep it. Placement
 * presets rearrange simple props around the lamp; the lamp itself glows a
 * sample lithophane.
 */

export type PlacementId = 'desk' | 'bedside' | 'shelf';

export const PLACEMENTS: { id: PlacementId; label: string; caption: string }[] = [
  { id: 'desk', label: 'Work Desk', caption: 'Warm accent light beside your monitor' },
  { id: 'bedside', label: 'Bedside', caption: 'A memory that glows as you fall asleep' },
  { id: 'shelf', label: 'Living Shelf', caption: 'A conversation piece between your books' },
];

const GLOW_COLOR = 0xffa733;
const SAMPLE_PHOTO = '/slides/sample1.png';

export default function ExploreShowcase3D({ placement }: { placement: PlacementId }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const propsRef = useRef<THREE.Group | null>(null);

  // ── One-time scene setup: renderer, lights, the lamp itself ────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setWebglFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(1.4, 1.0, 3.2);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(3, 4, 4);
    scene.add(key);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1.8;
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, 0.45, 0);

    // ── The lamp: black cuboid, glowing sample lithophane, side switch ──────
    const lamp = new THREE.Group();
    const w = 1.5;
    const h = 1.0;
    const d = 0.3;
    const t = 0.05;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1d23, roughness: 0.55, metalness: 0.05 });
    const addWall = (sx: number, sy: number, sz: number, px: number, py: number, pz: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat);
      mesh.position.set(px, py, pz);
      lamp.add(mesh);
    };
    addWall(w + 2 * t, h + 2 * t, t, 0, 0, -d / 2);
    addWall(t, h + 2 * t, d, -(w + t) / 2, 0, 0);
    addWall(t, h + 2 * t, d, (w + t) / 2, 0, 0);
    addWall(w + 2 * t, t, d, 0, (h + t) / 2, 0);
    addWall(w + 2 * t, t, d, 0, -(h + t) / 2, 0);

    const panelMat = new THREE.MeshStandardMaterial({
      color: 0xf5f2ec,
      roughness: 0.92,
      emissive: new THREE.Color(GLOW_COLOR),
      emissiveIntensity: 0,
    });
    new THREE.TextureLoader().load(SAMPLE_PHOTO, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      panelMat.emissiveMap = tex;
      panelMat.bumpMap = tex;
      panelMat.bumpScale = 0.4;
      panelMat.emissiveIntensity = 1.5;
      panelMat.needsUpdate = true;
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.96, 48, 48), panelMat);
    panel.position.z = d / 2 - 0.01;
    lamp.add(panel);

    const glow = new THREE.PointLight(GLOW_COLOR, 1.8, 4);
    lamp.add(glow);

    // Lamp rests on the surface (bottom wall at y = -(h+2t)/2).
    lamp.position.y = (h + 2 * t) / 2;
    scene.add(lamp);

    // Props group — rebuilt per placement by the second effect.
    const propsGroup = new THREE.Group();
    scene.add(propsGroup);
    propsRef.current = propsGroup;

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    });
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
      sceneRef.current = null;
      propsRef.current = null;
    };
  }, []);

  // ── Placement vignette props ───────────────────────────────────────────────
  useEffect(() => {
    const props = propsRef.current;
    if (!props) return;

    // Clear previous vignette
    while (props.children.length) {
      const obj = props.children.pop()!;
      obj.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
    }

    const mat = (color: number, roughness = 0.8) =>
      new THREE.MeshStandardMaterial({ color, roughness });
    const box = (sx: number, sy: number, sz: number, m: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
      mesh.position.set(x, y, z);
      props.add(mesh);
      return mesh;
    };

    // Shared: surface the lamp stands on + back wall.
    const surfaceColor = placement === 'desk' ? 0x4a3b2a : placement === 'bedside' ? 0x3a3330 : 0x5a4632;
    const wallColor = placement === 'bedside' ? 0x1c1a22 : 0x232833;
    box(6, 0.12, 3, mat(surfaceColor, 0.9), 0, -0.06, 0);
    box(6, 4, 0.1, mat(wallColor, 0.95), 0, 1.9, -1.4);

    if (placement === 'desk') {
      // Monitor slab + keyboard + mug
      box(1.6, 1.0, 0.06, mat(0x0c0f16, 0.4), -1.6, 0.9, -0.7);
      box(0.5, 0.35, 0.06, mat(0x2a2f3a), -1.6, 0.22, -0.7); // monitor stand
      box(1.1, 0.05, 0.4, mat(0x161a22, 0.5), -1.5, 0.03, 0.3); // keyboard
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 20), mat(0x8a2f24, 0.6));
      mug.position.set(1.5, 0.15, 0.4);
      props.add(mug);
    } else if (placement === 'bedside') {
      // Headboard + pillow + small clock
      box(2.2, 1.4, 0.12, mat(0x2d2420, 0.9), -2.4, 0.7, -1.1);
      box(1.6, 0.35, 0.8, mat(0xd8d3c8, 0.95), -2.3, 0.18, -0.2); // pillow
      const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 24), mat(0x10131a, 0.4));
      clock.rotation.x = Math.PI / 2;
      clock.position.set(1.4, 0.45, -0.4);
      props.add(clock);
      box(0.3, 0.3, 0.08, mat(0x10131a, 0.4), 1.4, 0.15, -0.4); // clock base
    } else {
      // Shelf: book stacks on both sides + a small plant pot
      const bookColors = [0x7a4a2f, 0x2f5a4a, 0x4a2f5a, 0x8a6a3a];
      let x = -2.2;
      bookColors.forEach((c, i) => {
        box(0.14, 0.8 - i * 0.08, 0.5, mat(c, 0.85), x, (0.8 - i * 0.08) / 2, -0.3);
        x += 0.17;
      });
      box(0.14, 0.72, 0.5, mat(0x3a3f4a, 0.85), 1.6, 0.36, -0.3);
      box(0.14, 0.64, 0.5, mat(0x6a3a2a, 0.85), 1.78, 0.32, -0.3);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.24, 18), mat(0xb0643a, 0.8));
      pot.position.set(2.3, 0.12, -0.2);
      props.add(pot);
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(0x2f6a3a, 0.9));
      leaves.position.set(2.3, 0.4, -0.2);
      props.add(leaves);
    }
  }, [placement]);

  return (
    <div ref={mountRef} className="relative w-full h-full min-h-[300px]">
      {webglFailed && (
        <div className="absolute inset-0 flex items-center justify-center text-center p-6">
          <p className="text-sm text-[var(--text-muted)]">
            3D showcase unavailable on this device.
          </p>
        </div>
      )}
    </div>
  );
}
