'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Layers } from 'lucide-react';

export type MaterialPreset = 'amber-glow' | 'cyber-cyan' | 'obsidian' | 'titanium';

interface Hero3DCanvasProps {
  activePreset?: MaterialPreset;
  onPresetChange?: (preset: MaterialPreset) => void;
}

export default function Hero3DCanvas({
  activePreset: controlledPreset,
  onPresetChange,
}: Hero3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalPreset, setInternalPreset] = useState<MaterialPreset>('amber-glow');
  const [isWireframe, setIsWireframe] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [fps, setFps] = useState(60);

  const activePreset = controlledPreset || internalPreset;

  const handleSelectPreset = (preset: MaterialPreset) => {
    setInternalPreset(preset);
    if (onPresetChange) onPresetChange(preset);
  };

  const stateRef = useRef({
    preset: activePreset,
    isWireframe,
    mouseX: 0,
    mouseY: 0,
    isDragging: false,
    prevPointerX: 0,
    prevPointerY: 0,
    manualRotY: 0,
    manualRotX: 0,
  });

  stateRef.current.preset = activePreset;
  stateRef.current.isWireframe = isWireframe;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene & Camera ---
    const scene = new THREE.Scene();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 8.5);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- Lighting Rig ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 10, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-8, 4, -6);
    scene.add(rimLight);

    const bottomGlow = new THREE.PointLight(0xf59e0b, 2.5, 12);
    bottomGlow.position.set(0, -1.8, 0);
    scene.add(bottomGlow);

    // --- 3D Model Hierarchy ---
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Precision Multi-Tier Base (Stand)
    const baseGroup = new THREE.Group();
    rootGroup.add(baseGroup);

    const lowerBaseGeom = new THREE.CylinderGeometry(2.3, 2.5, 0.35, 64);
    const lowerBaseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
    });
    const lowerBaseMesh = new THREE.Mesh(lowerBaseGeom, lowerBaseMat);
    lowerBaseMesh.position.y = -2.1;
    baseGroup.add(lowerBaseMesh);

    const upperBaseGeom = new THREE.CylinderGeometry(1.9, 2.2, 0.25, 64);
    const upperBaseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.6,
    });
    const upperBaseMesh = new THREE.Mesh(upperBaseGeom, upperBaseMat);
    upperBaseMesh.position.y = -1.85;
    baseGroup.add(upperBaseMesh);

    // Subtle brushed metallic chamfer ring
    const chamferGeom = new THREE.TorusGeometry(2.05, 0.04, 16, 64);
    const chamferMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9,
    });
    const chamferMesh = new THREE.Mesh(chamferGeom, chamferMat);
    chamferMesh.rotation.x = Math.PI / 2;
    chamferMesh.position.y = -1.85;
    baseGroup.add(chamferMesh);

    // 2. Lithophane Curved Relief Shield (Primary focal geometry)
    const panelGeom = new THREE.CylinderGeometry(
      2.1,
      2.1,
      3.6,
      64,
      32,
      true,
      -Math.PI / 2.8,
      (2 * Math.PI) / 2.8
    );

    const panelMeshMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      transmission: 0.65,
      thickness: 1.2,
      ior: 1.5,
      side: THREE.DoubleSide,
    });
    const panelMesh = new THREE.Mesh(panelGeom, panelMeshMat);
    panelMesh.position.set(0, 0.1, 0);
    rootGroup.add(panelMesh);

    // 3. Precision Internal Warm LED Diffuser Column
    const ledGeom = new THREE.CylinderGeometry(0.12, 0.12, 3.4, 32);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });
    const ledMesh = new THREE.Mesh(ledGeom, ledMat);
    ledMesh.position.set(0, 0.1, 0.1);
    rootGroup.add(ledMesh);

    // Secondary subtle light ring around emitter
    const emitterRingGeom = new THREE.RingGeometry(0.3, 0.5, 32);
    const emitterRingMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
    });
    const emitterRingMesh = new THREE.Mesh(emitterRingGeom, emitterRingMat);
    emitterRingMesh.rotation.x = Math.PI / 2;
    emitterRingMesh.position.y = -1.7;
    rootGroup.add(emitterRingMesh);

    // 4. Floating Precision Caliper Ring
    const caliperGeom = new THREE.TorusGeometry(2.9, 0.025, 16, 100);
    const caliperMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });
    const caliperMesh = new THREE.Mesh(caliperGeom, caliperMat);
    caliperMesh.rotation.x = Math.PI / 2;
    caliperMesh.position.y = 0.1;
    rootGroup.add(caliperMesh);

    // 5. Floating Micro-Particles
    const particleCount = 180;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 9;
      particlePositions[i + 1] = (Math.random() - 0.5) * 7;
      particlePositions[i + 2] = (Math.random() - 0.5) * 7;
    }
    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // Helper to apply presets dynamically
    const applyMaterialPreset = (preset: MaterialPreset, wireframe: boolean) => {
      panelMeshMat.wireframe = wireframe;
      lowerBaseMat.wireframe = wireframe;
      upperBaseMat.wireframe = wireframe;

      switch (preset) {
        case 'cyber-cyan':
          panelMeshMat.color.setHex(0x0ea5e9);
          panelMeshMat.transmission = 0.8;
          panelMeshMat.roughness = 0.15;
          panelMeshMat.thickness = 1.5;
          ledMat.emissive.setHex(0x00f0ff);
          ledMat.emissiveIntensity = 2.8;
          bottomGlow.color.setHex(0x0284c7);
          chamferMat.emissive.setHex(0x0ea5e9);
          particleMat.color.setHex(0x38bdf8);
          break;

        case 'obsidian':
          panelMeshMat.color.setHex(0x18181b);
          panelMeshMat.transmission = 0.05;
          panelMeshMat.roughness = 0.35;
          panelMeshMat.metalness = 0.85;
          panelMeshMat.thickness = 0.5;
          ledMat.emissive.setHex(0x71717a);
          ledMat.emissiveIntensity = 0.9;
          bottomGlow.color.setHex(0x3f3f46);
          chamferMat.emissive.setHex(0xa1a1aa);
          particleMat.color.setHex(0x94a3b8);
          break;

        case 'titanium':
          panelMeshMat.color.setHex(0xe2e8f0);
          panelMeshMat.transmission = 0.1;
          panelMeshMat.roughness = 0.2;
          panelMeshMat.metalness = 0.95;
          panelMeshMat.thickness = 0.2;
          ledMat.emissive.setHex(0x60a5fa);
          ledMat.emissiveIntensity = 1.4;
          bottomGlow.color.setHex(0x3b82f6);
          chamferMat.emissive.setHex(0x60a5fa);
          particleMat.color.setHex(0x93c5fd);
          break;

        case 'amber-glow':
        default:
          panelMeshMat.color.setHex(0xf8fafc);
          panelMeshMat.transmission = 0.65;
          panelMeshMat.roughness = 0.3;
          panelMeshMat.metalness = 0.05;
          panelMeshMat.thickness = 1.2;
          ledMat.emissive.setHex(0xf59e0b);
          ledMat.emissiveIntensity = 2.4;
          bottomGlow.color.setHex(0xd97706);
          chamferMat.emissive.setHex(0xf59e0b);
          particleMat.color.setHex(0xfbbf24);
          break;
      }
    };

    // --- Interactive Mouse & Touch Drag Handlers ---
    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.mouseX = x;
      stateRef.current.mouseY = y;

      if (stateRef.current.isDragging) {
        const deltaX = e.clientX - stateRef.current.prevPointerX;
        const deltaY = e.clientY - stateRef.current.prevPointerY;
        stateRef.current.manualRotY += deltaX * 0.008;
        stateRef.current.manualRotX += deltaY * 0.005;
        stateRef.current.prevPointerX = e.clientX;
        stateRef.current.prevPointerY = e.clientY;
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.prevPointerX = e.clientX;
      stateRef.current.prevPointerY = e.clientY;
    };

    const onPointerUp = () => {
      stateRef.current.isDragging = false;
    };

    window.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mouseup', onPointerUp);

    // --- Resize Handler ---
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // --- Animation Loop ---
    let animId: number;
    const clock = new THREE.Clock();
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // FPS calculation
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsTime)));
        frameCount = 0;
        lastFpsTime = now;
      }

      // Material synchronization
      applyMaterialPreset(stateRef.current.preset, stateRef.current.isWireframe);

      // Smooth turntable & mouse parallax rotation
      const baseTurntable = elapsedTime * 0.45;
      const parallaxX = stateRef.current.mouseY * 0.25;
      const parallaxY = stateRef.current.mouseX * 0.4;

      const targetX = parallaxX + stateRef.current.manualRotX;
      const targetY = baseTurntable + parallaxY + stateRef.current.manualRotY;

      rootGroup.rotation.x = THREE.MathUtils.damp(rootGroup.rotation.x, targetX, 4, delta);
      rootGroup.rotation.y = THREE.MathUtils.damp(rootGroup.rotation.y, targetY, 4, delta);

      caliperMesh.rotation.z = -elapsedTime * 0.3;
      caliperMesh.position.y = 0.1 + Math.sin(elapsedTime * 1.5) * 0.12;

      particleSystem.rotation.y = elapsedTime * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[480px] sm:h-[580px] lg:h-[680px] rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing select-none group border border-white/10 bg-[#060810]/70 backdrop-blur-md shadow-2xl"
    >
      {/* Background Subtle Gradient & Light Bloom */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.12)_0%,transparent_70%)]" />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern inside 3D canvas */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Floating 3D Telemetry HUD Overlay (Top-Left) */}
      <div className="absolute top-5 left-5 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/10 text-[11px] text-slate-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono uppercase tracking-wider">WebGL 2.0 Realtime PBR</span>
          <span className="text-white/20">|</span>
          <span className="font-mono text-cyan-400">{fps} FPS</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 px-1">
          Drag to orbit · Mouse parallax active
        </div>
      </div>

      {/* Floating Material Shader Switcher (Bottom-Center) */}
      <div className="absolute bottom-5 inset-x-0 mx-auto w-fit max-w-[92%] z-20 flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-2xl overflow-x-auto">
        <button
          onClick={() => handleSelectPreset('amber-glow')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
            activePreset === 'amber-glow'
              ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Amber Glow
        </button>

        <button
          onClick={() => handleSelectPreset('cyber-cyan')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
            activePreset === 'cyber-cyan'
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          Cyan Resin
        </button>

        <button
          onClick={() => handleSelectPreset('obsidian')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
            activePreset === 'obsidian'
              ? 'bg-zinc-200 text-slate-950 font-semibold shadow-md shadow-zinc-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-500" />
          Obsidian
        </button>

        <button
          onClick={() => handleSelectPreset('titanium')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
            activePreset === 'titanium'
              ? 'bg-blue-400 text-slate-950 font-semibold shadow-md shadow-blue-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-300" />
          Titanium
        </button>

        <div className="w-px h-4 bg-white/10 mx-0.5 shrink-0" />

        {/* Wireframe toggle */}
        <button
          onClick={() => setIsWireframe(!isWireframe)}
          title="Toggle wireframe topology"
          className={`p-2 rounded-xl text-xs font-medium transition-all shrink-0 ${
            isWireframe
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers size={14} />
        </button>
      </div>

      {/* Floating Interaction Prompt Indicator */}
      <div
        className={`absolute top-5 right-5 z-20 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-80'
        }`}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/10 text-xs text-slate-300 shadow-lg">
          <RotateCw size={13} className="text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Interactive 360° Orbit</span>
        </div>
      </div>
    </div>
  );
}
