'use client';

import { useRef, useState, useEffect } from 'react';
import { Box, RotateCw, Maximize2, Layers } from 'lucide-react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { useOrderStore } from '@/store/useOrderStore';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function calculateVolume(geometry: THREE.BufferGeometry): number {
  let volume = 0;
  const position = geometry.attributes.position;
  if (!position) return 0;
  
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  
  for (let i = 0; i < position.count; i += 3) {
    vA.fromBufferAttribute(position, i);
    vB.fromBufferAttribute(position, i + 1);
    vC.fromBufferAttribute(position, i + 2);
    
    volume += vA.dot(vB.cross(vC)) / 6.0;
  }
  
  return Math.abs(volume) / 1000.0; // mm³ to cm³
}

export default function ModelViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [wireframe, setWireframe] = useState(false);

  // Read/write order store
  const fileData = useOrderStore((s) => s.fileData);
  const setFileData = useOrderStore((s) => s.setFileData);

  const fileUrl = fileData?.fileUrl || '/placeholder.stl';
  const fileName = fileData?.fileName || 'placeholder.stl';
  
  // Stats derivations
  const fileSize = fileData ? (fileData.fileSize / (1024 * 1024)).toFixed(2) : '—';
  const volume = fileData?.volumeCm3 ? fileData.volumeCm3.toFixed(2) : '—';
  const dimensions = fileData?.dimensions || '—';

  // Three.js runtime refs
  const meshRef = useRef<THREE.Mesh | null>(null);
  const stateRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotX: 0.3,
    rotY: 0.4,
    zoom: 1.0,
    wireframe: false,
  });
  stateRef.current.wireframe = wireframe;

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    setLoading(true);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0f17);

    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 360;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 50);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(20, 30, 25);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight2.position.set(-20, -15, -20);
    scene.add(dirLight2);

    const grid = new THREE.GridHelper(40, 20, 0x0284c7, 0x1e293b);
    grid.position.y = -10;
    scene.add(grid);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Load STL Geometry
    const loader = new STLLoader();
    loader.load(
      fileUrl,
      (geometry) => {
        geometry.computeBoundingBox();
        geometry.computeVertexNormals();

        const bbox = geometry.boundingBox!;
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        geometry.center();

        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 18 / maxDim : 1;
        geometry.scale(scale, scale, scale);

        const material = new THREE.MeshPhysicalMaterial({
          color: 0x0ea5e9,
          roughness: 0.25,
          metalness: 0.2,
          transmission: 0.4,
          thickness: 0.8,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        meshRef.current = mesh;
        modelGroup.add(mesh);

        const vol = calculateVolume(geometry);
        setLoading(false);

        // Update zustand store
        if (fileData) {
          setFileData({
            ...fileData,
            volumeCm3: parseFloat(vol.toFixed(2)),
            dimensions: `${size.x.toFixed(0)}x${size.y.toFixed(0)}x${size.z.toFixed(0)} mm`,
          });
        }
      },
      undefined,
      (err) => {
        console.error('Error loading STL:', err);
        // Fallback procedural prism
        const fallbackGeom = new THREE.CylinderGeometry(6, 6, 12, 32);
        const fallbackMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
        const fallbackMesh = new THREE.Mesh(fallbackGeom, fallbackMat);
        meshRef.current = fallbackMesh;
        modelGroup.add(fallbackMesh);
        setLoading(false);
      }
    );

    // Mouse Controls
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

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stateRef.current.zoom = Math.max(0.4, Math.min(2.5, stateRef.current.zoom + e.deltaY * -0.001));
      camera.position.z = 50 / stateRef.current.zoom;
    };

    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    mount.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (meshRef.current && meshRef.current.material) {
        (meshRef.current.material as THREE.MeshStandardMaterial).wireframe = stateRef.current.wireframe;
      }

      modelGroup.rotation.x = THREE.MathUtils.damp(modelGroup.rotation.x, stateRef.current.rotX, 8, delta);
      modelGroup.rotation.y = THREE.MathUtils.damp(modelGroup.rotation.y, stateRef.current.rotY, 8, delta);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      mount.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);

      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [fileUrl]);

  const handleReset = () => {
    stateRef.current.rotX = 0.3;
    stateRef.current.rotY = 0.4;
    stateRef.current.zoom = 1.0;
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(console.error);
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div ref={containerRef} className="rounded-3xl border border-white/10 bg-[#080c16]/90 overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box size={16} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Interactive 3D Inspector</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            WebGL 2.0
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setWireframe(!wireframe)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              wireframe ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle wireframe topology"
          >
            <Layers size={13} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors"
            title="Reset camera view"
          >
            <RotateCw size={13} />
          </button>
          <button
            type="button"
            onClick={handleFullscreen}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative bg-[#060810] h-[340px] sm:h-[420px] w-full overflow-hidden flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#060810]/80 backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-slate-300">Parsing 3D Mesh Topology...</p>
          </div>
        )}

        <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />

        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 pointer-events-none">
          Drag to rotate · Scroll to zoom
        </div>
      </div>

      {/* Stats Readout */}
      <div className="px-5 py-3 border-t border-white/10 grid grid-cols-3 gap-4 bg-slate-950/70 font-mono text-xs">
        <div className="text-center">
          <span className="text-[10px] text-slate-400 block uppercase">Volume</span>
          <span className="text-white font-bold">{volume} cm³</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-slate-400 block uppercase">Dimensions</span>
          <span className="text-white font-bold">{dimensions}</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-slate-400 block uppercase">File Size</span>
          <span className="text-white font-bold">{fileSize} MB</span>
        </div>
      </div>
    </div>
  );
}
