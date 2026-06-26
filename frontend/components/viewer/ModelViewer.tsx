'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Box, RotateCw, Maximize2 } from 'lucide-react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
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

/* ─── Model Component ──────────────────────────────────────────────────────── */

function STLModel({
  url,
  onLoaded,
}: {
  url: string;
  onLoaded: (geometry: THREE.BufferGeometry) => void;
}) {
  const geometry = useLoader(STLLoader, url);

  useEffect(() => {
    if (geometry) {
      onLoaded(geometry);
    }
  }, [geometry, onLoaded]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color="#c97d1a"
        metalness={0.3}
        roughness={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ─── Placeholder Loader ────────────────────────────────────────────────────── */

function PlaceholderScene({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 select-none bg-[#1c1917] z-10">
      <div className="relative w-24 h-24">
        <div
          className="absolute inset-0 border-2 border-[var(--border-mid)] rounded-lg"
          style={{ transform: 'rotateX(20deg) rotateY(45deg)', transformStyle: 'preserve-3d' }}
        />
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--bg-accent)] to-transparent opacity-60"
          style={{ animation: 'scanline 2.5s ease-in-out infinite', top: '50%' }}
        />
        <Box
          size={32}
          className="absolute inset-0 m-auto text-[var(--border-mid)]"
          strokeWidth={1}
        />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-[var(--text-on-page)]">Loading 3D Preview</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{text || 'Rendering geometry in your browser...'}</p>
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { transform: translateY(-30px); opacity: 0; }
          20%       { opacity: 0.8; }
          80%       { opacity: 0.8; }
          50%       { transform: translateY(30px); }
        }
      `}</style>
    </div>
  );
}

/* ─── Viewer Control Button ────────────────────────────────────────────────── */

function ViewerControl({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-glass)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-on-page)] hover:border-[var(--border-mid)] hover:bg-[var(--bg-glass-hover)] transition-all duration-150"
      title={label}
      aria-label={label}
    >
      <Icon size={13} />
    </button>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export default function ModelViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Read/write order store
  const fileData = useOrderStore((s) => s.fileData);
  const setFileData = useOrderStore((s) => s.setFileData);

  const fileUrl = fileData?.fileUrl || '/placeholder.stl';
  const fileName = fileData?.fileName || 'placeholder.stl';
  
  // Stats derivations
  const fileSize = fileData ? (fileData.fileSize / (1024 * 1024)).toFixed(2) : '—';
  const volume = fileData?.volumeCm3 ? fileData.volumeCm3.toFixed(2) : '—';
  const dimensions = fileData?.dimensions || '—';

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
  }, [fileUrl]);

  const handleLoaded = (geometry: THREE.BufferGeometry) => {
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const size = new THREE.Vector3();
    if (bbox) {
      bbox.getSize(size);
    }
    const vol = calculateVolume(geometry);
    
    setLoading(false);

    // Reactively update the store data if it doesn't match
    if (fileData && fileData.volumeCm3 !== vol) {
      setFileData({
        ...fileData,
        volumeCm3: parseFloat(vol.toFixed(2)),
        dimensions: `${size.x.toFixed(0)}x${size.y.toFixed(0)}x${size.z.toFixed(0)} mm`,
      });
    }
  };

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error('Error enabling fullscreen', err);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <Box size={16} className="text-[var(--bg-accent)]" />
        <h2 className="text-sm font-semibold text-[var(--text-on-page)]">3D Preview</h2>
        <span className="badge badge-cyan ml-1">Three.js</span>

        {/* Viewer controls */}
        <div className="ml-auto flex items-center gap-1.5">
          <ViewerControl icon={RotateCw} label="Reset rotation" onClick={handleReset} />
          <ViewerControl icon={Maximize2} label="Fullscreen" onClick={handleFullscreen} />
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative bg-[#1c1917] h-[320px] w-full overflow-hidden md:h-[450px] flex items-center justify-center"
        aria-label="3D model viewport"
      >
        {loading && <PlaceholderScene text={fileData ? `Parsing ${fileName}...` : 'Loading default model...'} />}

        {mounted && (
          <Canvas camera={{ position: [0, 15, 30], fov: 45 }} shadows className="w-full h-full">
            <color attach="background" args={['#1c1917']} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 15, 10]} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            
            <Suspense fallback={null}>
              <Center>
                <STLModel url={fileUrl} onLoaded={handleLoaded} />
              </Center>
            </Suspense>

            <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.05} />
          </Canvas>
        )}
      </div>

      {/* Footer: model stats */}
      <div className="px-5 py-3 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-4 bg-[var(--bg-card)]">
        {[
          { label: 'Volume', value: volume, unit: 'cm³' },
          { label: 'Dimensions', value: dimensions, unit: 'mm' },
          { label: 'File size', value: fileSize, unit: 'MB' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="text-center">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{label}</p>
            <p className="text-sm font-semibold text-[var(--text-on-page)] mt-0.5">
              {value} {value !== '—' && <span className="text-[10px] font-normal text-[var(--text-muted)]">{unit}</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
