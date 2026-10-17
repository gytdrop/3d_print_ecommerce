'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Upload, ChevronDown, CheckCircle2, Zap } from 'lucide-react';

interface StoryBeat {
  id: string;
  tag: string;
  title: string;
  description: string;
  highlight?: string;
}

const STORY_BEATS: StoryBeat[] = [
  {
    id: 'intro',
    tag: 'NEXT-GEN FABRICATION',
    title: 'THE ARCHITECTURE OF PRECISION',
    description: 'Scroll to initiate cinematic precision assembly. From digital STL geometry to high-fidelity physical reality.',
    highlight: '8-Hour Express Dispatch in Bangalore',
  },
  {
    id: 'slicing',
    tag: 'SUB-MILLIMETER RESOLUTION',
    title: '0.08mm MICRO-LAYER CONTROL',
    description: 'Engineered resin & filament micro-structures with zero visual stair-stepping and pristine internal geometry.',
    highlight: 'PLA, PETG, ABS & Optical Clear Resin',
  },
  {
    id: 'assembly',
    tag: 'DYNAMIC CUSTOMIZATION',
    title: 'ENGINEERED FOR THE FUTURE',
    description: 'Every facet dynamically verified, stress-tested, and built for lasting tactile quality.',
    highlight: 'Instant STL & Lithophane Quoting Engine',
  },
];

export default function Cinematic3DScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [, setIsVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId: number;
    let targetProgress = 0;
    let currentProgress = 0;
    const lerpFactor = 0.08;

    const onScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
      targetProgress = progress;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const render = () => {
      // LERP smooth interpolation
      currentProgress += (targetProgress - currentProgress) * lerpFactor;

      // 1. Video scrubbing sync
      if (video.duration && !isNaN(video.duration)) {
        const targetTime = currentProgress * video.duration;
        if (Math.abs(video.currentTime - targetTime) > 0.02) {
          video.currentTime = targetTime;
        }
      }

      // 2. Progress bar
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${currentProgress * 100}%`;
      }

      // 3. 3D Elements Update (fade in/out and fly along Z axis)
      const ranges = [
        { start: 0.0, peak: 0.16, end: 0.36 },
        { start: 0.36, peak: 0.52, end: 0.72 },
        { start: 0.72, peak: 0.88, end: 1.0 },
      ];

      ranges.forEach((range, idx) => {
        const el = beatRefs.current[idx];
        if (!el) return;

        if (currentProgress >= range.start && currentProgress <= range.end) {
          let opacity = 0;
          if (currentProgress < range.peak) {
            opacity = (currentProgress - range.start) / (range.peak - range.start);
          } else {
            opacity = 1 - (currentProgress - range.peak) / (range.end - range.peak);
          }

          // 3D parallax fly-through effect towards the viewer
          const zTranslate = (currentProgress - range.start) * 350 - 80;
          const yTranslate = (currentProgress - range.peak) * -40;

          el.style.opacity = Math.max(0, Math.min(1, opacity)).toString();
          el.style.transform = `translate(-50%, -50%) translate3d(0, ${yTranslate}px, ${zTranslate}px)`;
          el.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none';
        } else {
          el.style.opacity = '0';
          el.style.transform = 'translate(-50%, -50%) translate3d(0, 40px, -150px)';
          el.style.pointerEvents = 'none';
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    const handleVideoLoaded = () => {
      setIsVideoReady(true);
      requestAnimationFrame(render);
    };

    if (video.readyState >= 1) {
      handleVideoLoaded();
    } else {
      video.addEventListener('loadedmetadata', handleVideoLoaded);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(animationFrameId);
      if (video) {
        video.removeEventListener('loadedmetadata', handleVideoLoaded);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[400vh] bg-[#050508] text-white">
      {/* Top Glowing Progress Bar */}
      <div
        ref={progressBarRef}
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 z-50 shadow-[0_0_12px_#38bdf8] transition-[width] duration-75"
        style={{ width: '0%' }}
      />

      {/* Pinned Sticky 3D Viewport */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden [perspective:1200px] z-10">
        {/* Background Video Layer */}
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover opacity-60 pointer-events-none filter contrast-125 brightness-90"
          src="/videos/cube_assembly_web.mp4"
        />

        {/* Ambient Vignette & Color Grading Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background:
              'radial-gradient(circle at center, rgba(5,5,8,0.1) 25%, rgba(5,5,8,0.75) 70%, #050508 95%)',
          }}
        />

        {/* Tech Grid Lines in Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-[3]" />

        {/* Floating 3D Overlays */}
        {STORY_BEATS.map((beat, idx) => (
          <div
            key={beat.id}
            ref={(el) => {
              beatRefs.current[idx] = el;
            }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-3xl text-center z-20 opacity-0 transition-opacity duration-100 [transform-style:preserve-3d] select-none"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(34,211,238,0.2)] backdrop-blur-md">
              <Zap size={13} className="text-cyan-400" />
              {beat.tag}
            </div>

            {/* Display Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight uppercase bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-100 to-neutral-400 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              {beat.title}
            </h1>

            {/* Subtitle / Description */}
            <p className="mt-4 text-sm sm:text-base md:text-lg text-neutral-300 max-w-xl mx-auto leading-relaxed drop-shadow">
              {beat.description}
            </p>

            {/* Feature Highlight Pill */}
            {beat.highlight && (
              <div className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-neutral-400 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm">
                <CheckCircle2 size={13} className="text-cyan-400" />
                <span>{beat.highlight}</span>
              </div>
            )}

            {/* Interactive Actions on Last Beat */}
            {idx === STORY_BEATS.length - 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/upload"
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                >
                  <Upload size={16} />
                  Upload 3D STL / Photo
                </Link>
                <a
                  href="#pricing"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold transition-all backdrop-blur-md"
                >
                  Explore Sizes & Pricing
                </a>
              </div>
            )}
          </div>
        ))}

        {/* Subtle Scroll Indicator at the bottom */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 opacity-70 pointer-events-none animate-pulse">
          <span className="text-[11px] tracking-widest uppercase text-neutral-400 font-semibold">
            Scroll to Navigate Model
          </span>
          <ChevronDown size={16} className="text-cyan-400" />
        </div>
      </div>
    </div>
  );
}
