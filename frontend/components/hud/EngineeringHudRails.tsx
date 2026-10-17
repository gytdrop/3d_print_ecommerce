'use client';

/**
 * EngineeringHudRails
 * Decorative blueprint-style side rails that flank the center stage card on the
 * home scrollytelling experience. Left rail shows a per-stage wireframe diagram;
 * right rail is a persistent telemetry column with a live scrub marker.
 *
 * Stage fade windows mirror the card windows in Fused3DScrollExperience — keep
 * both in sync if the scroll choreography changes.
 */

interface HudProps {
  scrollProgress: number;
  activeStepIndex: number;
}

const STROKE = 'rgba(255,255,255,0.35)';
const STROKE_DIM = 'rgba(255,255,255,0.18)';
const STROKE_HI = 'rgba(255,255,255,0.7)';
const LABEL = 'rgba(226,232,240,0.75)';
const LABEL_DIM = 'rgba(148,163,184,0.7)';

const mono = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;

/* Fade windows matching the six stages of Fused3DScrollExperience */
function stageOpacity(stageIndex: number, p: number): number {
  if (stageIndex === 0) {
    if (p <= 0.08) return 1;
    if (p <= 0.16) return 1 - (p - 0.08) / 0.08;
    return 0;
  }
  if (stageIndex === 1) {
    if (p < 0.12 || p > 0.32) return 0;
    if (p < 0.18) return (p - 0.12) / 0.06;
    if (p <= 0.26) return 1;
    return 1 - (p - 0.26) / 0.06;
  }
  if (stageIndex === 2) {
    if (p < 0.28 || p > 0.48) return 0;
    if (p < 0.34) return (p - 0.28) / 0.06;
    if (p <= 0.42) return 1;
    return 1 - (p - 0.42) / 0.06;
  }
  if (stageIndex === 3) {
    if (p < 0.44 || p > 0.64) return 0;
    if (p < 0.5) return (p - 0.44) / 0.06;
    if (p <= 0.58) return 1;
    return 1 - (p - 0.58) / 0.06;
  }
  if (stageIndex === 4) {
    if (p < 0.6 || p > 0.82) return 0;
    if (p < 0.66) return (p - 0.6) / 0.06;
    if (p <= 0.76) return 1;
    return 1 - (p - 0.76) / 0.06;
  }
  // stage 5: footer
  if (p < 0.78) return 0;
  if (p < 0.86) return (p - 0.78) / 0.08;
  return 1;
}

/* ─── Left rail diagrams (one per stage) ─────────────────────────────────── */

function DiagramLamp() {
  return (
    <svg viewBox="0 0 200 250" fill="none" className="w-full">
      {/* light rays */}
      {[-30, -15, 0, 15, 30].map((a) => (
        <line
          key={a}
          x1="100"
          y1="88"
          x2={100 + 55 * Math.sin((a * Math.PI) / 180)}
          y2={88 - 55 * Math.cos((a * Math.PI) / 180)}
          stroke={STROKE_DIM}
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      ))}
      {/* lithophane plate */}
      <rect x="55" y="70" width="90" height="118" rx="7" stroke={STROKE_HI} strokeWidth="1.3" />
      <rect x="63" y="78" width="74" height="102" rx="4" stroke={STROKE_DIM} strokeWidth="1" />
      {/* relief contour lines */}
      <path d="M68 110 Q90 96 112 110 T132 106" stroke={STROKE} strokeWidth="1" />
      <path d="M68 128 Q92 114 114 130 T132 124" stroke={STROKE} strokeWidth="1" />
      <path d="M68 146 Q88 136 110 148 T132 142" stroke={STROKE} strokeWidth="1" />
      <path d="M68 164 Q94 152 118 164 T132 160" stroke={STROKE_DIM} strokeWidth="1" />
      {/* base stand */}
      <path d="M70 188 L62 212 H138 L130 188" stroke={STROKE_HI} strokeWidth="1.3" />
      <line x1="52" y1="212" x2="148" y2="212" stroke={STROKE_HI} strokeWidth="1.3" />
      {/* LED dots in base */}
      {[82, 100, 118].map((x) => (
        <circle key={x} cx={x} cy="202" r="2.4" stroke={STROKE} strokeWidth="1" />
      ))}
      {/* dimension line */}
      <line x1="38" y1="70" x2="38" y2="212" stroke={STROKE_DIM} strokeWidth="1" />
      <line x1="34" y1="70" x2="42" y2="70" stroke={STROKE_DIM} strokeWidth="1" />
      <line x1="34" y1="212" x2="42" y2="212" stroke={STROKE_DIM} strokeWidth="1" />
      <text x="30" y="144" fill={LABEL_DIM} fontSize="7.5" style={mono} transform="rotate(-90 30 144)" textAnchor="middle">
        H 150 MM
      </text>
      <text x="100" y="236" fill={LABEL} fontSize="8" style={mono} textAnchor="middle">
        FIG.01 — LITHOPHANE ASSEMBLY
      </text>
      <text x="100" y="56" fill={LABEL_DIM} fontSize="7.5" style={mono} textAnchor="middle">
        2700K DIFFUSION
      </text>
    </svg>
  );
}

function DiagramLayers() {
  return (
    <svg viewBox="0 0 200 250" fill="none" className="w-full">
      {/* nozzle */}
      <path d="M92 44 H108 L104 58 H96 Z" stroke={STROKE_HI} strokeWidth="1.3" />
      <line x1="100" y1="58" x2="100" y2="70" stroke={STROKE} strokeWidth="1" strokeDasharray="2 3" />
      {/* layer stack forming a dome profile */}
      {Array.from({ length: 11 }, (_, i) => {
        const y = 74 + i * 9;
        const inset = Math.pow(10 - i, 1.45) * 1.55;
        return (
          <line
            key={y}
            x1={48 + inset}
            y1={y}
            x2={152 - inset}
            y2={y}
            stroke={i < 2 ? STROKE_HI : STROKE}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        );
      })}
      <line x1="44" y1="178" x2="156" y2="178" stroke={STROKE_HI} strokeWidth="1.3" />
      {/* magnifier callout on top layers */}
      <circle cx="146" cy="84" r="24" stroke={STROKE_HI} strokeWidth="1.2" />
      <line x1="128" y1="100" x2="112" y2="116" stroke={STROKE_DIM} strokeWidth="1" />
      <line x1="132" y1="78" x2="160" y2="78" stroke={STROKE_HI} strokeWidth="2" strokeLinecap="round" />
      <line x1="132" y1="90" x2="160" y2="90" stroke={STROKE_HI} strokeWidth="2" strokeLinecap="round" />
      <line x1="166" y1="78" x2="166" y2="90" stroke={STROKE_DIM} strokeWidth="1" />
      <text x="172" y="87" fill={LABEL} fontSize="7" style={mono}>
        0.08
      </text>
      {/* axis label */}
      <line x1="40" y1="178" x2="40" y2="74" stroke={STROKE_DIM} strokeWidth="1" />
      <path d="M37 80 L40 73 L43 80" stroke={STROKE_DIM} strokeWidth="1" />
      <text x="32" y="128" fill={LABEL_DIM} fontSize="7.5" style={mono} transform="rotate(-90 32 128)" textAnchor="middle">
        Z-AXIS
      </text>
      <text x="100" y="206" fill={LABEL} fontSize="8" style={mono} textAnchor="middle">
        FIG.02 — 0.08MM SLICING
      </text>
      <text x="100" y="222" fill={LABEL_DIM} fontSize="7.5" style={mono} textAnchor="middle">
        5 ENGINEERING POLYMERS
      </text>
    </svg>
  );
}

function DiagramExploded() {
  return (
    <svg viewBox="0 0 200 250" fill="none" className="w-full">
      {/* assembly axis */}
      <line x1="100" y1="34" x2="100" y2="216" stroke={STROKE_DIM} strokeWidth="1" strokeDasharray="3 5" />
      {/* plate */}
      <rect x="62" y="38" width="76" height="46" rx="5" stroke={STROKE_HI} strokeWidth="1.3" />
      <path d="M70 60 Q86 50 102 60 T130 58" stroke={STROKE_DIM} strokeWidth="1" />
      <text x="146" y="64" fill={LABEL_DIM} fontSize="7.5" style={mono}>
        PLATE
      </text>
      {/* LED array */}
      <rect x="70" y="106" width="60" height="16" rx="3" stroke={STROKE} strokeWidth="1.2" />
      {[80, 92, 104, 116].map((x) => (
        <circle key={x} cx={x} cy="114" r="2.6" stroke={STROKE_HI} strokeWidth="1" />
      ))}
      <text x="140" y="117" fill={LABEL_DIM} fontSize="7.5" style={mono}>
        LED 2700K
      </text>
      {/* base block */}
      <rect x="58" y="146" width="84" height="28" rx="6" stroke={STROKE_HI} strokeWidth="1.3" />
      <circle cx="100" cy="160" r="5.5" stroke={STROKE} strokeWidth="1" />
      <text x="150" y="163" fill={LABEL_DIM} fontSize="7.5" style={mono}>
        BASE
      </text>
      {/* USB-C connector */}
      <rect x="86" y="196" width="28" height="11" rx="5.5" stroke={STROKE} strokeWidth="1.2" />
      <line x1="114" y1="201" x2="138" y2="201" stroke={STROKE_DIM} strokeWidth="1" />
      <text x="142" y="204" fill={LABEL_DIM} fontSize="7.5" style={mono}>
        USB-C 5V
      </text>
      {/* touch dimmer mark */}
      <text x="48" y="163" fill={LABEL_DIM} fontSize="7.5" style={mono} textAnchor="end">
        DIM
      </text>
      <text x="100" y="236" fill={LABEL} fontSize="8" style={mono} textAnchor="middle">
        FIG.03 — EXPLODED ASSEMBLY
      </text>
    </svg>
  );
}

function DiagramRoutes() {
  const nodes: Array<[number, number, string]> = [
    [52, 72, '560034'],
    [150, 64, '560038'],
    [164, 128, '560066'],
    [142, 188, '560100'],
    [56, 182, '560102'],
    [40, 126, '560024'],
  ];
  return (
    <svg viewBox="0 0 200 250" fill="none" className="w-full">
      {/* spokes */}
      {nodes.map(([x, y], i) => (
        <line
          key={i}
          x1="100"
          y1="126"
          x2={x}
          y2={y}
          stroke={i === 2 ? STROKE_HI : STROKE_DIM}
          strokeWidth="1"
          strokeDasharray={i === 2 ? undefined : '3 4'}
        />
      ))}
      {/* outer nodes */}
      {nodes.map(([x, y, pin], i) => (
        <g key={pin}>
          <circle cx={x} cy={y} r="3.2" stroke={i === 2 ? STROKE_HI : STROKE} strokeWidth="1.2" />
          <text
            x={x}
            y={y - 8}
            fill={LABEL_DIM}
            fontSize="7"
            style={mono}
            textAnchor="middle"
          >
            {pin}
          </text>
        </g>
      ))}
      {/* hub */}
      <circle cx="100" cy="126" r="9" stroke={STROKE_HI} strokeWidth="1.3" />
      <circle cx="100" cy="126" r="3" fill={STROKE_HI} />
      <circle cx="100" cy="126" r="16" stroke={STROKE_DIM} strokeWidth="1" strokeDasharray="2 4" />
      <text x="100" y="152" fill={LABEL} fontSize="7.5" style={mono} textAnchor="middle">
        BLR HUB
      </text>
      <text x="100" y="222" fill={LABEL} fontSize="8" style={mono} textAnchor="middle">
        FIG.04 — DISPATCH NETWORK
      </text>
      <text x="100" y="236" fill={LABEL_DIM} fontSize="7.5" style={mono} textAnchor="middle">
        50+ PIN CODES · 8H EXPRESS
      </text>
    </svg>
  );
}

function DiagramSizes() {
  return (
    <svg viewBox="0 0 200 250" fill="none" className="w-full">
      {/* nested frames: L, M, S */}
      <rect x="40" y="48" width="120" height="90" rx="5" stroke={STROKE_DIM} strokeWidth="1.2" />
      <rect x="55" y="60" width="90" height="67" rx="4" stroke={STROKE} strokeWidth="1.2" />
      <rect x="70" y="71" width="60" height="45" rx="3" stroke={STROKE_HI} strokeWidth="1.3" />
      <text x="166" y="56" fill={LABEL_DIM} fontSize="7.5" style={mono}>
        L
      </text>
      <text x="150" y="68" fill={LABEL_DIM} fontSize="7.5" style={mono}>
        M
      </text>
      <text x="134" y="79" fill={LABEL} fontSize="7.5" style={mono}>
        S
      </text>
      {/* dimension arrows under L */}
      <line x1="40" y1="152" x2="160" y2="152" stroke={STROKE_DIM} strokeWidth="1" />
      <path d="M44 149 L40 152 L44 155" stroke={STROKE_DIM} strokeWidth="1" />
      <path d="M156 149 L160 152 L156 155" stroke={STROKE_DIM} strokeWidth="1" />
      <text x="100" y="164" fill={LABEL_DIM} fontSize="7.5" style={mono} textAnchor="middle">
        20 × 15 CM
      </text>
      {/* price table */}
      {[
        ['S — 10 × 7.5', '₹499'],
        ['M — 15 × 11.2', '₹799'],
        ['L — 20 × 15', '₹1299'],
      ].map(([label, price], i) => (
        <g key={label}>
          <text x="48" y={188 + i * 14} fill={LABEL_DIM} fontSize="7.5" style={mono}>
            {label}
          </text>
          <text x="152" y={188 + i * 14} fill={LABEL} fontSize="7.5" style={mono} textAnchor="end">
            {price}
          </text>
        </g>
      ))}
      <text x="100" y="236" fill={LABEL} fontSize="8" style={mono} textAnchor="middle">
        FIG.05 — FRAME DIMENSIONS
      </text>
    </svg>
  );
}

function DiagramCompass() {
  return (
    <svg viewBox="0 0 200 250" fill="none" className="w-full">
      <circle cx="100" cy="112" r="52" stroke={STROKE} strokeWidth="1.2" />
      <circle cx="100" cy="112" r="40" stroke={STROKE_DIM} strokeWidth="1" strokeDasharray="2 4" />
      {/* cardinal ticks */}
      {[0, 90, 180, 270].map((a) => (
        <line
          key={a}
          x1={100 + 46 * Math.sin((a * Math.PI) / 180)}
          y1={112 - 46 * Math.cos((a * Math.PI) / 180)}
          x2={100 + 56 * Math.sin((a * Math.PI) / 180)}
          y2={112 - 56 * Math.cos((a * Math.PI) / 180)}
          stroke={STROKE_HI}
          strokeWidth="1.3"
        />
      ))}
      <text x="100" y="42" fill={LABEL} fontSize="8" style={mono} textAnchor="middle">
        N
      </text>
      {/* needle pointing NE-ish toward Bangalore */}
      <path d="M100 112 L124 84" stroke={STROKE_HI} strokeWidth="1.5" />
      <path d="M100 112 L84 124" stroke={STROKE_DIM} strokeWidth="1.2" />
      <circle cx="100" cy="112" r="3.5" fill={STROKE_HI} />
      <text x="100" y="192" fill={LABEL} fontSize="8" style={mono} textAnchor="middle">
        12.9716° N · 77.5946° E
      </text>
      <text x="100" y="206" fill={LABEL_DIM} fontSize="7.5" style={mono} textAnchor="middle">
        BENGALURU, INDIA
      </text>
      <text x="100" y="232" fill={LABEL} fontSize="8" style={mono} textAnchor="middle">
        FIG.06 — SERVICE ORIGIN
      </text>
    </svg>
  );
}

const DIAGRAMS = [DiagramLamp, DiagramLayers, DiagramExploded, DiagramRoutes, DiagramSizes, DiagramCompass];

const DIAGRAM_TAGS = [
  'CORE-01 / OPTICS',
  'RESIN-02 / SLICING',
  'HARNESS-03 / POWER',
  'ROUTE-04 / LOGISTICS',
  'MATRIX-05 / SIZING',
  'ORIGIN-06 / GEO',
];

/* ─── Right rail telemetry readouts (one block per stage) ────────────────── */

const READOUTS: Array<{ title: string; rows: Array<[string, string]> }> = [
  {
    title: 'OPTICAL CORE',
    rows: [
      ['MODE', 'LITHOPHANE'],
      ['RELIEF', '0.6–2.8 MM'],
      ['LED', '2700K WARM'],
    ],
  },
  {
    title: 'SLICING ENGINE',
    rows: [
      ['LAYER', '0.08 MM'],
      ['POLYMERS', '05 GRADES'],
      ['SURFACE', 'ZERO-STEP'],
    ],
  },
  {
    title: 'POWER HARNESS',
    rows: [
      ['INPUT', 'USB-C 5V'],
      ['DIMMER', 'TOUCH'],
      ['CABLE', 'BRAIDED'],
    ],
  },
  {
    title: 'DISPATCH GRID',
    rows: [
      ['ZONES', '50+ ACTIVE'],
      ['CUTOFF', '14:00 IST'],
      ['EXPRESS', '8 HOURS'],
    ],
  },
  {
    title: 'PRICE MATRIX',
    rows: [
      ['SMALL', '₹499'],
      ['MEDIUM', '₹799'],
      ['LARGE', '₹1299'],
    ],
  },
  {
    title: 'DIRECTORY',
    rows: [
      ['ORIGIN', 'BENGALURU'],
      ['LAT/LNG', '12.97 / 77.59'],
      ['STATUS', 'ACCEPTING'],
    ],
  },
];

export default function EngineeringHudRails({ scrollProgress, activeStepIndex }: HudProps) {
  const pct = Math.round(scrollProgress * 100);
  // Stages 05 (pricing) and 06 (footer) use wider cards that reach into the
  // rail zone — recede the rails so the overlap reads as depth, not collision.
  const receded = activeStepIndex >= 4;
  const recedeStyle = (dir: 1 | -1) => ({
    opacity: receded ? 0.35 : 1,
    transform: `translateY(-50%) translateX(${receded ? dir * 14 : 0}px)`,
    transition: 'opacity 700ms ease, transform 700ms ease',
  });

  return (
    <div aria-hidden="true" className="hidden xl:block pointer-events-none select-none">
      {/* ─── Left rail: per-stage blueprint diagram ─── */}
      <div className="absolute left-0 top-1/2 w-52 2xl:w-60" style={recedeStyle(-1)}>
        <div className="border-l border-t border-white/10 rounded-tl-xl pl-4 pt-3 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1 h-1 rounded-full bg-white/60" />
            <span className="text-[9px] font-mono text-slate-400 tracking-[0.18em]">
              BLUEPRINT // {DIAGRAM_TAGS[activeStepIndex]}
            </span>
          </div>
          <div className="relative h-[270px]">
            {DIAGRAMS.map((Diagram, idx) => (
              <div
                key={idx}
                className="absolute inset-0"
                style={{
                  opacity: stageOpacity(idx, scrollProgress) * 0.9,
                  visibility: stageOpacity(idx, scrollProgress) > 0.01 ? 'visible' : 'hidden',
                }}
              >
                <Diagram />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 pl-4 flex items-center gap-2 text-[9px] font-mono text-slate-500">
          <span className="inline-block w-6 border-t border-white/20" />
          <span>DWG NO. TAZ-3DP-{String(activeStepIndex + 1).padStart(2, '0')}</span>
        </div>
      </div>

      {/* ─── Right rail: telemetry column ─── */}
      <div className="absolute right-0 top-1/2 w-44 2xl:w-48 flex items-stretch justify-end gap-3" style={recedeStyle(1)}>
        {/* readout panel */}
        <div className="flex flex-col justify-between border-r border-t border-white/10 rounded-tr-xl pr-4 pt-3 pl-2 min-h-[320px]">
          <div>
            <div className="flex items-center justify-end gap-2 mb-3">
              <span className="text-[9px] font-mono text-slate-400 tracking-[0.18em]">
                TELEMETRY // LIVE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
            </div>

            {/* per-stage readout block (crossfade) */}
            <div className="relative h-[92px]">
              {READOUTS.map((block, idx) => (
                <div
                  key={block.title}
                  className="absolute inset-0 text-right transition-opacity duration-500"
                  style={{ opacity: activeStepIndex === idx ? 1 : 0 }}
                >
                  <div className="text-[10px] font-mono text-slate-200 tracking-wider mb-2">
                    {block.title}
                  </div>
                  {block.rows.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-end gap-2 leading-5">
                      <span className="text-[9px] font-mono text-slate-500">{k}</span>
                      <span className="inline-block w-3 border-t border-white/15" />
                      <span className="text-[9px] font-mono text-slate-300">{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* progress readout */}
            <div className="mt-4 text-right">
              <div className="text-[9px] font-mono text-slate-500 mb-1">TIMELINE</div>
              <div className="text-lg font-mono text-slate-200 tabular-nums leading-none">
                {String(pct).padStart(3, '0')}
                <span className="text-[10px] text-slate-500">%</span>
              </div>
              <div className="mt-1.5 text-[9px] font-mono text-slate-500">
                STAGE {String(activeStepIndex + 1).padStart(2, '0')} / 06
              </div>
            </div>
          </div>

          <div className="mt-4 text-right text-[9px] font-mono text-slate-600 tracking-wider pb-1">
            SYS NOMINAL
          </div>
        </div>

        {/* vertical ruler track */}
        <div className="relative w-5 min-h-[320px]">
          <div className="absolute inset-y-0 right-2 border-r border-white/15" />
          {/* ticks every 10% */}
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={i}
              className="absolute right-2 border-t border-white/25"
              style={{ top: `${i * 10}%`, width: i % 5 === 0 ? 10 : 5 }}
            />
          ))}
          {/* live marker */}
          <div
            className="absolute right-0.5 -translate-y-1/2 flex items-center gap-1"
            style={{ top: `${scrollProgress * 100}%` }}
          >
            <div className="w-2 h-2 rotate-45 bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
