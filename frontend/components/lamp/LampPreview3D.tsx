'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LampSizeId, LampOrientation, LampBoxColor } from './lampConfig';
import { LAMP_SIZES, BOX_COLOR_HEX } from './lampConfig';

interface LampPreview3DProps {
  /** Cropped photo as a data URL (512px preview export). */
  textureDataUrl: string | null;
  size: LampSizeId;
  orientation: LampOrientation;
  boxColor: LampBoxColor;
  lampOn: boolean;
}

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
  lampOn,
}: LampPreview3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const panelMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const innerLightRef = useRef<THREE.PointLight | null>(null);

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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

    // Studio lighting: hemisphere fill + key with shadow + two rims so a
    // matte-black box still separates from the dark backdrop.
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    scene.add(new THREE.HemisphereLight(0xdfe7f5, 0x1a1d24, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(2.5, 3, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 4;
    scene.add(key);
    const rimCool = new THREE.DirectionalLight(0x9fc5ff, 0.9);
    rimCool.position.set(-3, 1.2, -2);
    scene.add(rimCool);
    const rimWarm = new THREE.DirectionalLight(0xffd9a0, 0.55);
    rimWarm.position.set(3, 0.6, -2.5);
    scene.add(rimWarm);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 5;

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
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
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
    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(BOX_COLOR_HEX[boxColor]),
      roughness: boxColor === 'walnut' ? 0.75 : 0.55,
      metalness: 0.05,
    });

    // Faint edge outlines keep the box silhouette readable even when the
    // finish is nearly the same tone as the backdrop (matte black).
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 });
    const addWall = (sx: number, sy: number, sz: number, px: number, py: number, pz: number) => {
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(px, py, pz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      edges.position.copy(mesh.position);
      group.add(edges);
    };

    // Ground disc catches the contact shadow and gives the box a surface.
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 48),
      new THREE.MeshStandardMaterial({ color: 0x1b2130, roughness: 1, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -(h / 2 + t) - 0.002;
    ground.receiveShadow = true;
    group.add(ground);

    // Back, left, right, top, bottom — front face stays open for the panel.
    addWall(w + 2 * t, h + 2 * t, t, 0, 0, -d / 2);
    addWall(t, h + 2 * t, d, -(w + t) / 2, 0, 0);
    addWall(t, h + 2 * t, d, (w + t) / 2, 0, 0);
    addWall(w + 2 * t, t, d, 0, (h + t) / 2, 0);
    addWall(w + 2 * t, t, d, 0, -(h + t) / 2, 0);

    // Lithophane panel seated in the open front face.
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0xf5f2ec,
      roughness: 0.92,
      metalness: 0,
      emissive: new THREE.Color(0xffb36b),
      emissiveIntensity: 0,
    });
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

    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.96, 96, 96), panelMat);
    panel.position.set(0, 0, d / 2 - 0.01);
    group.add(panel);

    // Warm LED glow inside the box.
    const innerLight = new THREE.PointLight(0xffb36b, lampOn ? 2.2 : 0, 3);
    innerLight.position.set(0, 0, 0);
    group.add(innerLight);
    innerLightRef.current = innerLight;

    scene.add(group);
    groupRef.current = group;
  }, [textureDataUrl, size, orientation, boxColor]); // eslint-disable-line react-hooks/exhaustive-deps

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
