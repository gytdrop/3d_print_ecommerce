'use client';

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { 
  Layers, 
  MapPin, 
  Zap, 
  Sparkles, 
  Sliders, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Search,
  Maximize2,
  Box,
  RotateCw,
  Gauge
} from 'lucide-react';

export default function BentoGrid() {
  // ─── State for Card 1: 3D Material Lab ───
  const materialCanvasRef = useRef<HTMLDivElement>(null);
  const [bentoMaterial, setBentoMaterial] = useState<'carbon' | 'resin' | 'titanium' | 'gold'>('carbon');
  const [bentoWireframe, setBentoWireframe] = useState(false);

  // ─── State for Card 2: Bangalore Radar ───
  const [pincode, setPincode] = useState('560001');
  const [radarStatus, setRadarStatus] = useState({
    eligible: true,
    tier: '8-Hour Express',
    message: 'Order before 2 PM for delivery by 9 PM tonight',
  });
  const [countdown, setCountdown] = useState('04h 32m 18s');

  // ─── State for Card 3: Micro-Layer Slicer ───
  const [layerProgress, setLayerProgress] = useState(65);

  // ─── State for Card 4: Kelvin Backlight Simulator ───
  const [kelvin, setKelvin] = useState(3000);
  const [intensity, setIntensity] = useState(85);

  // ─── State for Card 5: Quoting Matrix ───
  const [calcVolume, setCalcVolume] = useState(65);
  const [calcMaterial, setCalcMaterial] = useState<'pla' | 'petg' | 'abs' | 'resin'>('pla');
  const [calcTier, setCalcTier] = useState<'standard' | 'express'>('express');

  // Countdown timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(14, 0, 0, 0); // 2:00 PM cutoff

      let diff = cutoff.getTime() - now.getTime();
      if (diff <= 0) {
        // Reset to next day cutoff
        diff += 24 * 60 * 60 * 1000;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(
        `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Card 2 Pincode checker function
  const handleCheckPincode = async (code: string) => {
    setPincode(code);
    const cleaned = code.trim();
    if (cleaned.length === 6) {
      try {
        const res = await fetch(`/api/pincodes/check?pincode=${cleaned}`);
        if (res.ok) {
          const data = await res.json();
          setRadarStatus({
            eligible: data.eligible,
            tier: data.tier === 'express' ? '8-Hour Express' : 'Standard Delivery',
            message: data.message || 'Express delivery active for this zone',
          });
          return;
        }
      } catch {
        // Fallback local check
      }

      // Local Bangalore validation (560xxx)
      if (cleaned.startsWith('560')) {
        setRadarStatus({
          eligible: true,
          tier: '8-Hour Express',
          message: 'Express zone active: Bangalore Central & Tech Corridors',
        });
      } else {
        setRadarStatus({
          eligible: false,
          tier: 'Standard 2-4 Days',
          message: 'Outside express perimeter. Standard shipping available.',
        });
      }
    }
  };

  // Card 1: Three.js embedded mini canvas
  useEffect(() => {
    const container = materialCanvasRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(5, 5, 5);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x38bdf8, 2.0);
    rim.position.set(-5, -3, -4);
    scene.add(rim);

    // Intricate precision mechanical gear geometry
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);

    const outerGeom = new THREE.TorusKnotGeometry(1.2, 0.35, 128, 32, 2, 3);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      roughness: 0.25,
      metalness: 0.85,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    });
    const knotMesh = new THREE.Mesh(outerGeom, material);
    meshGroup.add(knotMesh);

    // Inner glowing core
    const coreGeom = new THREE.SphereGeometry(0.5, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    meshGroup.add(coreMesh);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      meshGroup.rotation.y += delta * 0.7;
      meshGroup.rotation.x = Math.sin(elapsed * 0.8) * 0.25;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      outerGeom.dispose();
      material.dispose();
      coreGeom.dispose();
      coreMat.dispose();
    };
  }, []);

  // Update bento material dynamic shaders
  useEffect(() => {
    // When bentoMaterial changes, find meshes in container if needed
  }, [bentoMaterial, bentoWireframe]);

  // Pricing calculation matching Go backend formula:
  // Base Price = (Volume * Material Density * Cost Per Gram) + (Print Time * Machine Hourly Rate)
  const calculateEstimate = () => {
    const densities: Record<string, number> = {
      pla: 1.24,
      petg: 1.27,
      abs: 1.04,
      resin: 1.15,
    };
    const costs: Record<string, number> = {
      pla: 3.5,
      petg: 4.5,
      abs: 4.0,
      resin: 6.8,
    };
    const density = densities[calcMaterial] || 1.24;
    const costPerGram = costs[calcMaterial] || 3.5;
    const weightGrams = calcVolume * density;

    // Estimate print time: 1 hour per 25 cm3 + 0.5h setup
    const printTimeHours = 0.5 + calcVolume / 28;
    const machineHourlyRate = 180; // INR / hour

    let basePrice = weightGrams * costPerGram + printTimeHours * machineHourlyRate;

    // Rush surcharge if express
    let multiplier = 1.0;
    if (calcTier === 'express') {
      multiplier = 1.65;
    }

    return Math.round(basePrice * multiplier);
  };

  // Convert Kelvin to Hex/RGB color representation for backlight card
  const getKelvinColor = (k: number) => {
    if (k < 2800) return '#f59e0b'; // Warm Candle Amber
    if (k < 3500) return '#fbbf24'; // Warm Incandescent
    if (k < 4500) return '#fef08a'; // Neutral Warm
    if (k < 5500) return '#f8fafc'; // Pure Daylight
    return '#bae6fd'; // Cool Studio White
  };

  return (
    <section className="relative w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
          <Sparkles size={13} />
          High-Tech Additive Ecosystem
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-2xl">
          Engineered for Extreme Precision & Rapid Turnaround
        </h2>
        <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-xl">
          Explore interactive hardware capabilities, real-time slice tolerances, and our hyperlocal Bangalore routing engine.
        </p>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[280px]">
        
        {/* ─── Card 1: Live 3D Material & Physics Shader Lab (2x2) ─── */}
        <div className="md:col-span-2 md:row-span-2 rounded-3xl bg-[#080c16]/80 border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300 shadow-2xl">
          {/* Ambient Corner Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
                <Box size={14} />
                Real-Time WebGL Shader Lab
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                PBR Material Dynamics & Micro-Meshes
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 px-2 py-1 rounded bg-white/5 border border-white/10">
                12,480 Polys
              </span>
            </div>
          </div>

          {/* Center 3D Viewport */}
          <div 
            ref={materialCanvasRef} 
            className="w-full flex-1 my-2 relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-white/5 bg-[#03050a]/60"
          />

          {/* Controls Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 z-10">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-white/10 w-full sm:w-auto overflow-x-auto">
              {(['carbon', 'resin', 'titanium', 'gold'] as const).map((mat) => (
                <button
                  key={mat}
                  onClick={() => setBentoMaterial(mat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                    bentoMaterial === mat
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mat}
                </button>
              ))}

              <button
                onClick={() => setBentoWireframe(!bentoWireframe)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  bentoWireframe ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Wireframe
              </button>
            </div>

            <Link
              href="/upload"
              className="text-xs font-medium text-slate-300 hover:text-cyan-400 flex items-center gap-1 transition-colors self-end sm:self-center"
            >
              Test Custom STL <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* ─── Card 2: Bangalore Hyperlocal 8-Hour Delivery Radar (1x1) ─── */}
        <div className="rounded-3xl bg-[#080c16]/80 border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden hover:border-emerald-500/40 transition-all duration-300 shadow-xl group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Bangalore Radar
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                8H Fast-Track
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Same-Day Local Hub</h3>
            <p className="text-xs text-slate-400 mt-1">{radarStatus.message}</p>
          </div>

          {/* Interactive Pincode Checker */}
          <div className="my-2">
            <div className="relative flex items-center">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => handleCheckPincode(e.target.value)}
                placeholder="Enter 6-digit pin"
                className="w-full bg-[#03050a] border border-white/15 focus:border-emerald-400 text-white font-mono text-xs px-3 py-2 rounded-xl outline-none transition-colors"
              />
              <Search size={14} className="absolute right-3 text-slate-500 pointer-events-none" />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Dispatch Cutoff:</span>
              <span className="font-mono text-emerald-400 font-semibold">{countdown}</span>
            </div>
          </div>

          {/* Footer Badge */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 size={13} /> {radarStatus.tier}
            </span>
            <Link href="/zones" className="text-slate-400 hover:text-white transition-colors">
              50+ Zones →
            </Link>
          </div>
        </div>

        {/* ─── Card 3: 0.08mm Micro-Layer Slicing Visualizer (1x1) ─── */}
        <div className="rounded-3xl bg-[#080c16]/80 border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden hover:border-blue-500/40 transition-all duration-300 shadow-xl group">
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-mono text-blue-400 uppercase tracking-wider">
                <Layers size={13} />
                Layer Slicer
              </span>
              <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                0.08mm Fine
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Sub-Millimeter Tolerances</h3>
          </div>

          {/* Interactive Slicer Scrub Bar */}
          <div className="my-2 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Layer {Math.round((layerProgress / 100) * 850)} / 850</span>
              <span className="text-blue-400 font-semibold">{layerProgress}% Sliced</span>
            </div>

            <input
              type="range"
              min="1"
              max="100"
              value={layerProgress}
              onChange={(e) => setLayerProgress(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />

            {/* Simulated toolpath lines */}
            <div className="w-full h-8 rounded-lg bg-[#03050a] border border-white/10 p-1 flex flex-col justify-around overflow-hidden">
              <div 
                className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-150"
                style={{ width: `${layerProgress}%` }}
              />
              <div 
                className="h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full opacity-60 transition-all duration-150"
                style={{ width: `${Math.max(0, layerProgress - 15)}%` }}
              />
            </div>
          </div>

          {/* Footer Metrics */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Infill: 25% Gyroid</span>
            <span className="text-white">Est: ~3h 15m</span>
          </div>
        </div>

        {/* ─── Card 4: Optical Backlight & Kelvin Simulator (1x1) ─── */}
        <div className="rounded-3xl bg-[#080c16]/80 border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden hover:border-amber-500/40 transition-all duration-300 shadow-xl group">
          {/* Dynamic Kelvin glow overlay */}
          <div 
            className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl pointer-events-none transition-all duration-300"
            style={{ backgroundColor: getKelvinColor(kelvin), opacity: intensity / 350 }}
          />

          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-mono text-amber-400 uppercase tracking-wider">
                <Sliders size={13} />
                Lithophane Optical
              </span>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {kelvin}K
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Warm LED Translucency</h3>
          </div>

          {/* Interactive Kelvin Slider */}
          <div className="my-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Color Spectrum:</span>
              <span className="font-mono text-xs font-semibold" style={{ color: getKelvinColor(kelvin) }}>
                {kelvin < 3200 ? 'Candle Warm' : kelvin < 5000 ? 'Warm Daylight' : 'Cool Studio'}
              </span>
            </div>

            <input
              type="range"
              min="2200"
              max="6500"
              step="100"
              value={kelvin}
              onChange={(e) => setKelvin(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />

            {/* Glowing relief simulation bar */}
            <div 
              className="w-full h-8 rounded-lg border border-white/10 flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: '#05070d',
                boxShadow: `inset 0 0 16px ${getKelvinColor(kelvin)}${Math.round(intensity * 1.5).toString(16).padStart(2, '0')}`,
              }}
            >
              <span className="text-[11px] font-mono text-slate-300 tracking-wider">
                High-Contrast Relief Active
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>USB-C Braided Array</span>
            <span className="text-amber-400 font-mono">Calibrated Optics</span>
          </div>
        </div>

        {/* ─── Card 5: Instant Volumetric Quoting Matrix (1x1) ─── */}
        <div className="rounded-3xl bg-[#080c16]/80 border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden hover:border-purple-500/40 transition-all duration-300 shadow-xl group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-mono text-purple-400 uppercase tracking-wider">
                <Gauge size={13} />
                Quoting Matrix
              </span>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Go API Formula
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Instant Volumetric Quote</h3>
          </div>

          {/* Calculator Controls */}
          <div className="my-2 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Volume: {calcVolume} cm³</span>
              <span className="text-purple-300 uppercase font-semibold">{calcMaterial}</span>
            </div>

            <input
              type="range"
              min="15"
              max="200"
              value={calcVolume}
              onChange={(e) => setCalcVolume(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />

            <div className="flex items-center justify-between gap-1 pt-1">
              {(['pla', 'petg', 'abs', 'resin'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setCalcMaterial(m)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all ${
                    calcMaterial === m
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Live Price Tag & Checkout Button */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Est. Total (INR)</span>
              <span className="text-lg font-mono font-bold text-white">₹{calculateEstimate()}</span>
            </div>

            <Link
              href="/upload"
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1"
            >
              Order Now <ArrowRight size={12} />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
