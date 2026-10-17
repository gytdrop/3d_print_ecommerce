'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { 
  Layers, 
  RotateCw, 
  Compass, 
  Sun, 
  Maximize2, 
  Box, 
  ShieldCheck, 
  ArrowRight,
  Eye,
  SlidersHorizontal,
  Check
} from 'lucide-react';

export type StudioModel = 'lamp' | 'gear' | 'core' | 'arm';
export type ViewAngle = 'isometric' | 'front' | 'top' | 'orbit';

interface ModelInfo {
  id: StudioModel;
  name: string;
  category: string;
  volumeCm3: number;
  dimensionsMm: string;
  weightGrams: number;
  description: string;
}

const MODELS: ModelInfo[] = [
  {
    id: 'lamp',
    name: 'Curved Lithophane Lamp',
    category: 'Custom Illumination',
    volumeCm3: 84.5,
    dimensionsMm: '140 × 110 × 160 mm',
    weightGrams: 104.8,
    description: 'Precision sub-0.08mm relief curve with internal warm 2700K LED array and solid base.',
  },
  {
    id: 'gear',
    name: 'Precision Helical Turbine Gear',
    category: 'Industrial Prototype',
    volumeCm3: 62.0,
    dimensionsMm: '95 × 95 × 45 mm',
    weightGrams: 76.8,
    description: 'High-torque involute tooth profile engineered for high-speed mechanical validation.',
  },
  {
    id: 'core',
    name: 'Polyhedral Lattice Core',
    category: 'Generative Architecture',
    volumeCm3: 54.2,
    dimensionsMm: '80 × 80 × 80 mm',
    weightGrams: 67.2,
    description: 'Lightweight aerospace structural core with high stiffness-to-weight ratio.',
  },
  {
    id: 'arm',
    name: 'Structural Drone Arm Mount',
    category: 'Aerospace & Robotics',
    volumeCm3: 42.0,
    dimensionsMm: '180 × 35 × 25 mm',
    weightGrams: 52.1,
    description: 'Carbon-reinforced high-rigidity motor mount tested for high vibration resistance.',
  },
];

export default function Interactive3DStudio() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState<StudioModel>('lamp');
  const [materialColor, setMaterialColor] = useState<'cyan' | 'amber' | 'carbon' | 'titanium'>('cyan');
  const [renderMode, setRenderMode] = useState<'pbr' | 'wireframe'>('pbr');
  const [lightIntensity, setLightIntensity] = useState(2.2);
  const [isRotating, setIsRotating] = useState(true);

  const modelInfo = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  // Dynamic Three.js Setup
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const activeMeshGroupRef = useRef<THREE.Group | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);

  const stateRef = useRef({
    model: selectedModel,
    color: materialColor,
    renderMode,
    isRotating,
    lightIntensity,
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotX: 0.3,
    rotY: 0,
  });

  stateRef.current.model = selectedModel;
  stateRef.current.color = materialColor;
  stateRef.current.renderMode = renderMode;
  stateRef.current.isRotating = isRotating;
  stateRef.current.lightIntensity = lightIntensity;

  // Geometry generator function
  const createModelGeometry = (modelId: StudioModel): THREE.Group => {
    const group = new THREE.Group();

    if (modelId === 'lamp') {
      // Base
      const baseGeom = new THREE.CylinderGeometry(1.9, 2.1, 0.4, 48);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.7 });
      const baseMesh = new THREE.Mesh(baseGeom, baseMat);
      baseMesh.position.y = -1.6;
      group.add(baseMesh);

      // Curved Lithophane Panel
      const panelGeom = new THREE.CylinderGeometry(1.8, 1.8, 3.2, 48, 16, true, -Math.PI / 3, (2 * Math.PI) / 3);
      const panelMat = new THREE.MeshPhysicalMaterial({
        color: 0xf8fafc,
        roughness: 0.25,
        transmission: 0.75,
        thickness: 1.0,
        ior: 1.45,
        side: THREE.DoubleSide,
      });
      const panelMesh = new THREE.Mesh(panelGeom, panelMat);
      panelMesh.position.y = 0.2;
      group.add(panelMesh);

      // Internal LED Core
      const ledGeom = new THREE.CylinderGeometry(0.1, 0.1, 2.8, 16);
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 2.2,
      });
      const ledMesh = new THREE.Mesh(ledGeom, ledMat);
      ledMesh.position.set(0, 0.2, 0.15);
      group.add(ledMesh);
    } else if (modelId === 'gear') {
      // Involute Gear Structure
      const hubGeom = new THREE.CylinderGeometry(1.6, 1.6, 0.8, 32);
      const hubMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.85 });
      const hubMesh = new THREE.Mesh(hubGeom, hubMat);
      group.add(hubMesh);

      // Teeth Ring
      const teethCount = 14;
      for (let i = 0; i < teethCount; i++) {
        const angle = (i / teethCount) * Math.PI * 2;
        const toothGeom = new THREE.BoxGeometry(0.45, 0.8, 0.75);
        const toothMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.85 });
        const toothMesh = new THREE.Mesh(toothGeom, toothMat);
        toothMesh.position.set(Math.cos(angle) * 1.8, 0, Math.sin(angle) * 1.8);
        toothMesh.rotation.y = -angle;
        group.add(toothMesh);
      }

      // Center Bore Hole
      const boreGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.85, 24);
      const boreMat = new THREE.MeshBasicMaterial({ color: 0x05070d });
      const boreMesh = new THREE.Mesh(boreGeom, boreMat);
      group.add(boreMesh);
    } else if (modelId === 'core') {
      // Polyhedral Lattice Core
      const icosaGeom = new THREE.IcosahedronGeometry(1.8, 1);
      const icosaMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        roughness: 0.2,
        metalness: 0.9,
        wireframe: false,
      });
      const icosaMesh = new THREE.Mesh(icosaGeom, icosaMat);
      group.add(icosaMesh);

      const innerGeom = new THREE.OctahedronGeometry(1.1, 0);
      const innerMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 1.5,
      });
      const innerMesh = new THREE.Mesh(innerGeom, innerMat);
      group.add(innerMesh);
    } else {
      // Drone Arm Mount
      const armGeom = new THREE.BoxGeometry(3.6, 0.3, 0.8);
      const armMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
      const armMesh = new THREE.Mesh(armGeom, armMat);
      group.add(armMesh);

      // Motor Mount Head
      const motorHeadGeom = new THREE.CylinderGeometry(0.85, 0.85, 0.45, 32);
      const motorHeadMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.9 });
      const motorHeadMesh = new THREE.Mesh(motorHeadGeom, motorHeadMat);
      motorHeadMesh.position.set(1.8, 0.1, 0);
      group.add(motorHeadMesh);

      // Mounting Holes
      for (let j = 0; j < 4; j++) {
        const hAngle = (j / 4) * Math.PI * 2;
        const holeGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
        const holeMesh = new THREE.Mesh(holeGeom, holeMat);
        holeMesh.position.set(1.8 + Math.cos(hAngle) * 0.5, 0.1, Math.sin(hAngle) * 0.5);
        group.add(holeMesh);
      }
    }

    return group;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(6, 8, 6);
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    fillLight.position.set(-6, -4, -4);
    scene.add(fillLight);

    // Active Group
    const modelGroup = createModelGeometry(selectedModel);
    scene.add(modelGroup);
    activeMeshGroupRef.current = modelGroup;

    // Grid Floor
    const gridHelper = new THREE.GridHelper(8, 20, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    // Drag Interaction
    const onMouseDown = (e: MouseEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.prevX = e.clientX;
      stateRef.current.prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (stateRef.current.isDragging) {
        const dx = e.clientX - stateRef.current.prevX;
        const dy = e.clientY - stateRef.current.prevY;
        stateRef.current.rotY += dx * 0.008;
        stateRef.current.rotX += dy * 0.008;
        stateRef.current.prevX = e.clientX;
        stateRef.current.prevY = e.clientY;
      }
    };

    const onMouseUp = () => {
      stateRef.current.isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (dirLightRef.current) {
        dirLightRef.current.intensity = stateRef.current.lightIntensity;
      }

      if (activeMeshGroupRef.current) {
        if (stateRef.current.isRotating && !stateRef.current.isDragging) {
          stateRef.current.rotY += delta * 0.45;
        }

        activeMeshGroupRef.current.rotation.x = THREE.MathUtils.damp(
          activeMeshGroupRef.current.rotation.x,
          stateRef.current.rotX,
          6,
          delta
        );
        activeMeshGroupRef.current.rotation.y = THREE.MathUtils.damp(
          activeMeshGroupRef.current.rotation.y,
          stateRef.current.rotY,
          6,
          delta
        );
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Handle Model Switching
  const handleModelSelect = (model: StudioModel) => {
    setSelectedModel(model);
    if (!sceneRef.current || !activeMeshGroupRef.current) return;

    sceneRef.current.remove(activeMeshGroupRef.current);
    const newGroup = createModelGeometry(model);
    sceneRef.current.add(newGroup);
    activeMeshGroupRef.current = newGroup;

    // Apply current render mode and material finish
    applyShaderStyle(newGroup, materialColor, renderMode);
  };

  // Handle Camera Presets
  const setCameraView = (view: ViewAngle) => {
    if (!activeMeshGroupRef.current) return;

    if (view === 'isometric') {
      stateRef.current.rotX = 0.4;
      stateRef.current.rotY = 0.7;
    } else if (view === 'front') {
      stateRef.current.rotX = 0.0;
      stateRef.current.rotY = 0.0;
    } else if (view === 'top') {
      stateRef.current.rotX = Math.PI / 2.2;
      stateRef.current.rotY = 0.0;
    }
  };

  // Helper to apply materials across meshes in the active model
  const applyShaderStyle = (group: THREE.Group, color: string, mode: 'pbr' | 'wireframe') => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          child.material.wireframe = mode === 'wireframe';

          if (color === 'amber' && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setHex(0xf59e0b);
            child.material.roughness = 0.35;
          } else if (color === 'cyan' && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setHex(0x0ea5e9);
            child.material.roughness = 0.2;
          } else if (color === 'carbon' && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setHex(0x18181b);
            child.material.roughness = 0.5;
            child.material.metalness = 0.8;
          } else if (color === 'titanium' && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setHex(0x94a3b8);
            child.material.roughness = 0.15;
            child.material.metalness = 0.95;
          }
        }
      }
    });
  };

  const handleColorChange = (c: 'cyan' | 'amber' | 'carbon' | 'titanium') => {
    setMaterialColor(c);
    if (activeMeshGroupRef.current) {
      applyShaderStyle(activeMeshGroupRef.current, c, renderMode);
    }
  };

  const handleRenderModeChange = (mode: 'pbr' | 'wireframe') => {
    setRenderMode(mode);
    if (activeMeshGroupRef.current) {
      applyShaderStyle(activeMeshGroupRef.current, materialColor, mode);
    }
  };

  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2">
            <Compass size={14} />
            Hardware & 3D Geometry Studio
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Interactive Product Explorer & Customizer
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Inspect real additive manufacturing geometries in 360°. Rotate, change camera elevations, and view internal topology.
          </p>
        </div>

        {/* Model Selection Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/10 self-start md:self-auto overflow-x-auto max-w-full">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModelSelect(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedModel === m.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* 3D Viewport (3 Cols) */}
        <div className="lg:col-span-3 rounded-3xl bg-[#060810]/85 border border-white/10 overflow-hidden relative flex flex-col justify-between shadow-2xl h-[500px] sm:h-[600px]">
          {/* Top Viewport Controls */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            {/* Camera Presets */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 pointer-events-auto">
              <button
                onClick={() => setCameraView('isometric')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Isometric
              </button>
              <button
                onClick={() => setCameraView('front')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Front
              </button>
              <button
                onClick={() => setCameraView('top')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Top
              </button>
            </div>

            {/* Rotation & Turntable Toggle */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`p-2 rounded-xl backdrop-blur-md border transition-all text-xs flex items-center gap-1.5 ${
                  isRotating
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                    : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Toggle automatic turntable rotation"
              >
                <RotateCw size={14} className={isRotating ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
                <span className="hidden sm:inline">Auto-Orbit</span>
              </button>

              <button
                onClick={() => handleRenderModeChange(renderMode === 'pbr' ? 'wireframe' : 'pbr')}
                className={`p-2 rounded-xl backdrop-blur-md border transition-all text-xs flex items-center gap-1.5 ${
                  renderMode === 'wireframe'
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                    : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Toggle wireframe topology"
              >
                <Layers size={14} />
                <span className="hidden sm:inline">{renderMode === 'wireframe' ? 'Mesh' : 'Shaded'}</span>
              </button>
            </div>
          </div>

          {/* Three.js Canvas Container */}
          <div
            ref={containerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          />

          {/* Bottom Material Selector Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            {/* Material Finishes */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/10 pointer-events-auto">
              <button
                onClick={() => handleColorChange('cyan')}
                className={`px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                  materialColor === 'cyan' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Resin Cyan
              </button>

              <button
                onClick={() => handleColorChange('amber')}
                className={`px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                  materialColor === 'amber' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Warm Amber
              </button>

              <button
                onClick={() => handleColorChange('carbon')}
                className={`px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                  materialColor === 'carbon' ? 'bg-zinc-200 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-zinc-800" />
                Carbon PETG
              </button>

              <button
                onClick={() => handleColorChange('titanium')}
                className={`px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                  materialColor === 'titanium' ? 'bg-blue-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                Titanium
              </button>
            </div>

            {/* Lighting Slider */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/10 pointer-events-auto text-xs text-slate-400">
              <Sun size={13} className="text-amber-400" />
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={lightIntensity}
                onChange={(e) => setLightIntensity(Number(e.target.value))}
                className="w-20 accent-amber-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Specs & Ordering Sidebar (1 Col) */}
        <div className="rounded-3xl bg-[#080c16]/80 border border-white/10 p-6 flex flex-col justify-between shadow-2xl relative">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-slate-400 mb-4">
              <span className="font-mono text-cyan-400 uppercase tracking-wider">{modelInfo.category}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
                Print Ready
              </span>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">{modelInfo.name}</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{modelInfo.description}</p>

            {/* Technical Dimensional Spec Table */}
            <div className="mt-6 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Dimensions:</span>
                <span className="text-slate-200">{modelInfo.dimensionsMm}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Part Volume:</span>
                <span className="text-slate-200">{modelInfo.volumeCm3} cm³</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Material Mass:</span>
                <span className="text-slate-200">{modelInfo.weightGrams} g</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Micro-Resolution:</span>
                <span className="text-cyan-400">0.08 mm Layers</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Bangalore Express:</span>
                <span className="text-emerald-400">8-Hour Delivery</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 pt-4 border-t border-white/10 space-y-3">
            <Link
              href="/upload"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              Order & Slice This Model <ArrowRight size={14} />
            </Link>

            <Link
              href="/upload"
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2"
            >
              Upload Your Own STL / Photo
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
