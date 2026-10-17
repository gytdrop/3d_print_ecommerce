'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Scroll3DProductCanvasProps {
  scrollProgress: number;
}

export default function Scroll3DProductCanvas({
  scrollProgress,
}: Scroll3DProductCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(scrollProgress);
  progressRef.current = scrollProgress;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean scene & camera setup
    const scene = new THREE.Scene();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    container.appendChild(renderer.domElement);

    // Subtle studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.8);
    fillLight.position.set(-8, -4, -6);
    scene.add(fillLight);

    // Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Lithophane Frame Outer Base
    const standGeom = new THREE.BoxGeometry(3.6, 0.35, 1.6);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.2,
    });
    const standMesh = new THREE.Mesh(standGeom, standMat);
    standMesh.position.y = -2.1;
    rootGroup.add(standMesh);

    // 2. Lithophane Curved Relief Panel (Curved Arch Geometry)
    const panelGeom = new THREE.CylinderGeometry(2.4, 2.4, 3.4, 32, 1, true, -Math.PI / 3.2, (2 * Math.PI) / 3.2);
    const panelMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      transmission: 0.7,
      thickness: 0.8,
      ior: 1.45,
      side: THREE.DoubleSide,
    });
    const panelMesh = new THREE.Mesh(panelGeom, panelMat);
    panelMesh.position.set(0, -0.2, 0);
    rootGroup.add(panelMesh);

    // 3. Precision Internal Warm LED Diffuser
    const ledGeom = new THREE.CylinderGeometry(0.08, 0.08, 3.0, 16);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });
    const ledMesh = new THREE.Mesh(ledGeom, ledMat);
    ledMesh.position.set(0, -0.3, 0.2);
    rootGroup.add(ledMesh);

    // 4. Subtle Bed Platform Ring
    const bedRingGeom = new THREE.RingGeometry(2.6, 2.65, 64);
    const bedRingMat = new THREE.MeshBasicMaterial({
      color: 0x334155,
      side: THREE.DoubleSide,
    });
    const bedRingMesh = new THREE.Mesh(bedRingGeom, bedRingMat);
    bedRingMesh.rotation.x = Math.PI / 2;
    bedRingMesh.position.y = -2.3;
    rootGroup.add(bedRingMesh);

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const progress = progressRef.current;

      // Clean, slow e-commerce turntable rotation driven by scroll
      const targetRotY = (progress * Math.PI * 2.5) + (Math.PI * 0.15);
      const targetRotX = (progress - 0.5) * 0.2;

      rootGroup.rotation.y = THREE.MathUtils.damp(rootGroup.rotation.y, targetRotY, 4, delta);
      rootGroup.rotation.x = THREE.MathUtils.damp(rootGroup.rotation.x, targetRotX, 4, delta);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      standGeom.dispose();
      standMat.dispose();
      panelGeom.dispose();
      panelMat.dispose();
      ledGeom.dispose();
      ledMat.dispose();
      bedRingGeom.dispose();
      bedRingMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative pointer-events-none select-none overflow-hidden"
    />
  );
}
