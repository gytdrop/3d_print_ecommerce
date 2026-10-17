'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LampSizeId, LampOrientation, LampBoxColor } from './lampConfig';
import { LAMP_SIZES, BOX_COLOR_HEX } from './lampConfig';
import { buildFrameStyle, heartAlphaMask, type FrameStyleId } from './frameStyles';

interface LampPreview3DProps {
  /** Cropped photo as a data URL (512px preview export). */
  textureDataUrl: string | null;
  size: LampSizeId;
  orientation: LampOrientation;
  boxColor: LampBoxColor;
  frameStyle: FrameStyleId;
  lampOn: boolean;
  /** Called when the physical switch on the side of the box is clicked. */
  onToggleLamp?: () => void;
}

/** Yellowish-orange LED glow (user-specified warm light). */
const GLOW_COLOR = 0xffa733;

/**
 * Orbitable preview of the cuboidal lamp box with the photo-displaced
 * lithophane panel seated in the open front face. Raw Three.js scene
 * (matching ModelViewer.tsx) — no react-three-fiber.
 */
export default function LampPreview3D({
  textureDataUrl,
  size,
  orientation,
  boxColor,
  frameStyle,
  lampOn,
  onToggleLamp,
}: LampPreview3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const panelMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const innerLightRef = useRef<THREE.PointLight | null>(null);
  const switchMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Keep the latest toggle callback reachable from the long-lived canvas
  // event listeners without re-running the setup effect.
  const onToggleRef = useRef(onToggleLamp);
  onToggleRef.current = onToggleLamp;

  // ── One-time scene / renderer setup ────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // WebGL unavailable → show the static fallback (P0-4).
      setWebglFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      40,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0.9, 0.7, 2.6);
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(2.5, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x99c4ff, 0.35);
    rim.position.set(-3, 1, -2);
    scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 5;

    // ── Physical switch interaction (raycast picking) ────────────────────────
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const pickSwitch = (e: PointerEvent): boolean => {
      const group = groupRef.current;
      const cam = cameraRef.current;
      if (!group || !cam) return false;
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, cam);
      return raycaster
        .intersectObjects(group.children, true)
        .some((hit) => hit.object.name === 'lamp-switch');
    };

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      // Only treat it as a click when the pointer barely moved (not an orbit drag).
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      if (pickSwitch(e)) onToggleRef.current?.();
    };
    const onPointerMove = (e: PointerEvent) => {
      renderer.domElement.style.cursor = pickSwitch(e) ? 'pointer' : 'grab';
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  // ── Rebuild lamp geometry when configuration changes ──────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Dispose previous build
    if (groupRef.current) {
      scene.remove(groupRef.current);
      groupRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose());
        }
      });
    }

    const cfg = LAMP_SIZES[size];
    // Scene units: 10 cm = 1 unit.
    let w = cfg.panelWcm / 10;
    let h = cfg.panelHcm / 10;
    if (orientation === 'portrait') [w, h] = [h, w];
    const d = cfg.depthCm / 10;
    const t = 0.05; // wall thickness

    const group = new THREE.Group();
    const isLampBox = frameStyle === 'lamp-box';
    switchMatRef.current = null;

    if (isLampBox) {
      const wallMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(BOX_COLOR_HEX[boxColor]),
        roughness: boxColor === 'walnut' ? 0.75 : 0.55,
        metalness: 0.05,
      });

      const addWall = (sx: number, sy: number, sz: number, px: number, py: number, pz: number) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat);
        mesh.position.set(px, py, pz);
        group.add(mesh);
      };

      // Back, left, right, top, bottom — front face stays open for the panel.
      addWall(w + 2 * t, h + 2 * t, t, 0, 0, -d / 2);
      addWall(t, h + 2 * t, d, -(w + t) / 2, 0, 0);
      addWall(t, h + 2 * t, d, (w + t) / 2, 0, 0);
      addWall(w + 2 * t, t, d, 0, (h + t) / 2, 0);
      addWall(w + 2 * t, t, d, 0, -(h + t) / 2, 0);

      // Physical light switch on the right side face of the box: a base ring
      // and a protruding button. Named 'lamp-switch' for raycast picking.
      const switchX = w / 2 + t; // outer surface of the right wall
      const switchBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.085, 0.025, 24),
        new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.5, metalness: 0.4 }),
      );
      switchBase.rotation.z = Math.PI / 2; // cylinder axis along x
      switchBase.position.set(switchX + 0.012, 0, 0);
      switchBase.name = 'lamp-switch';
      group.add(switchBase);

      const switchMat = new THREE.MeshStandardMaterial({
        color: 0x8a8f99,
        roughness: 0.4,
        metalness: 0.3,
        emissive: new THREE.Color(GLOW_COLOR),
        emissiveIntensity: lampOn ? 0.9 : 0,
      });
      switchMatRef.current = switchMat;
      const switchBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.07, 24), switchMat);
      switchBtn.rotation.z = Math.PI / 2;
      switchBtn.position.set(switchX + 0.045, 0, 0);
      switchBtn.name = 'lamp-switch';
      group.add(switchBtn);
    } else {
      // Standalone frame styles (classic / minimal / vintage / heart) —
      // geometry defined per-style in frameStyles.ts.
      buildFrameStyle(group, frameStyle, w, h, BOX_COLOR_HEX[boxColor], boxColor === 'walnut');
    }

    // Lithophane panel: the image is shown as WHITE print with depth (bump +
    // displacement relief). When the lamp is on, the photo glows through in
    // yellowish-orange from the LED behind it.
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0xf5f2ec,
      roughness: 0.92,
      metalness: 0,
      emissive: new THREE.Color(GLOW_COLOR),
      emissiveIntensity: 0,
    });
    if (frameStyle === 'heart') {
      panelMat.alphaMap = heartAlphaMask();
      panelMat.alphaTest = 0.5;
    }
    panelMatRef.current = panelMat;

    if (textureDataUrl) {
      new THREE.TextureLoader().load(textureDataUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        panelMat.emissiveMap = tex;
        panelMat.bumpMap = tex;
        panelMat.bumpScale = 0.4;
        panelMat.displacementMap = tex;
        panelMat.displacementScale = 0.045;
        panelMat.displacementBias = -0.02;
        panelMat.emissiveIntensity = lampOn ? 1.6 : 0;
        panelMat.needsUpdate = true;
      });
    }

    const panelW = frameStyle === 'heart' ? Math.min(w, h) * 1.15 : w * 0.96;
    const panelH = frameStyle === 'heart' ? Math.min(w, h) * 1.15 : h * 0.96;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH, 96, 96), panelMat);
    panel.position.set(0, 0, isLampBox ? d / 2 - 0.01 : 0.02);
    group.add(panel);

    // Yellowish-orange LED glow — inside the box, or behind the panel for
    // flat frame styles.
    const innerLight = new THREE.PointLight(GLOW_COLOR, lampOn ? 2.2 : 0, 3);
    innerLight.position.set(0, 0, isLampBox ? 0 : -0.04);
    group.add(innerLight);
    innerLightRef.current = innerLight;

    scene.add(group);
    groupRef.current = group;
  }, [textureDataUrl, size, orientation, boxColor, frameStyle]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cheap lamp on/off toggle without a rebuild ─────────────────────────────
  useEffect(() => {
    if (panelMatRef.current) {
      panelMatRef.current.emissiveIntensity =
        lampOn && panelMatRef.current.emissiveMap ? 1.6 : 0;
      panelMatRef.current.needsUpdate = true;
    }
    if (innerLightRef.current) {
      innerLightRef.current.intensity = lampOn ? 2.2 : 0;
    }
    if (switchMatRef.current) {
      switchMatRef.current.emissiveIntensity = lampOn ? 0.9 : 0;
      switchMatRef.current.needsUpdate = true;
    }
  }, [lampOn]);

  return (
    <div ref={mountRef} className="relative w-full h-full min-h-[280px]">
      {webglFailed && (
        <div className="absolute inset-0 flex items-center justify-center text-center p-6">
          <p className="text-sm text-[var(--text-muted)]">
            3D preview unavailable on this device — your photo will still be
            printed exactly as cropped above.
          </p>
        </div>
      )}
    </div>
  );
}
