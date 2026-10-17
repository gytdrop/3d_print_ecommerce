'use client';

/**
 * FloatingArt — polished 2.5D product vectors that float around the stage
 * scenes. Hand-coded SVG with gradient faces, warm lamp glow, and specular
 * shine streaks for the "3D polish" look. Each component takes a unique `id`
 * prefix so gradient defs never collide between instances.
 */

export interface ArtProps {
  id: string;
}

const OUTLINE = 'rgba(255,255,255,0.28)';
const OUTLINE_HI = 'rgba(255,255,255,0.5)';

/** Glowing cuboidal lithophane lamp on an LED base. */
export function LampArt({ id }: ArtProps) {
  return (
    <svg viewBox="0 0 160 210" fill="none" className="w-full h-auto">
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#ffc97a" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#ffb45e" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffb45e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-core`} cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor="#ffdfae" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#f3a95c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f3a95c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2b3650" />
          <stop offset="100%" stopColor="#141a2a" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-basetop`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#434e66" />
          <stop offset="100%" stopColor="#242c3e" />
        </linearGradient>
        <linearGradient id={`${id}-basefront`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2130" />
          <stop offset="100%" stopColor="#0a0e18" />
        </linearGradient>
        <linearGradient id={`${id}-strip`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff9d3c" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#ffd9a0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ff9d3c" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* ambient glow halo */}
      <ellipse cx="80" cy="96" rx="76" ry="84" fill={`url(#${id}-glow)`} />

      {/* lithophane plate */}
      <rect x="38" y="26" width="84" height="122" rx="9" fill={`url(#${id}-plate)`} stroke={OUTLINE_HI} strokeWidth="1.2" />
      {/* warm lit core */}
      <ellipse cx="80" cy="88" rx="38" ry="52" fill={`url(#${id}-core)`} />
      {/* relief squiggles, lit warm */}
      <path d="M50 70 Q66 58 82 70 T112 66" stroke="#ffd9a6" strokeOpacity="0.55" strokeWidth="1.4" />
      <path d="M50 92 Q70 78 88 94 T112 88" stroke="#ffcf92" strokeOpacity="0.5" strokeWidth="1.4" />
      <path d="M50 114 Q66 104 84 116 T112 110" stroke="#f3b878" strokeOpacity="0.45" strokeWidth="1.4" />
      <path d="M50 134 Q72 124 92 134 T112 130" stroke="#d99a5e" strokeOpacity="0.35" strokeWidth="1.3" />
      {/* specular shine streak */}
      <path d="M46 30 L74 30 L52 146 L42 146 Z" fill={`url(#${id}-shine)`} />

      {/* LED strip where plate meets base */}
      <rect x="34" y="150" width="92" height="4.5" rx="2.25" fill={`url(#${id}-strip)`} />

      {/* base: top face */}
      <path d="M26 156 H134 L146 172 H14 Z" fill={`url(#${id}-basetop)`} stroke={OUTLINE} strokeWidth="1" />
      {/* base: front face */}
      <path d="M14 172 H146 V188 Q146 194 140 194 H20 Q14 194 14 188 Z" fill={`url(#${id}-basefront)`} stroke={OUTLINE} strokeWidth="1" />
      {/* touch dimmer */}
      <circle cx="80" cy="183" r="4" stroke={OUTLINE_HI} strokeWidth="1" />
      <circle cx="80" cy="183" r="1.4" fill="#ffd9a0" fillOpacity="0.9" />
      {/* braided cable */}
      <path d="M146 184 Q160 186 158 200" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2" />
    </svg>
  );
}

/** Glossy stacked print-layer slabs with a 0.08 callout tick. */
export function LayersArt({ id }: ArtProps) {
  const slab = (y: number, inset: number, key: string) => (
    <g key={key}>
      <path d={`M${30 + inset} ${y} H${130 - inset} L${142 - inset} ${y + 13} H${18 + inset} Z`} fill={`url(#${id}-ltop)`} stroke={OUTLINE} strokeWidth="1" />
      <path d={`M${18 + inset} ${y + 13} H${142 - inset} V${y + 26} H${18 + inset} Z`} fill={`url(#${id}-lfront)`} stroke={OUTLINE} strokeWidth="1" />
    </g>
  );
  return (
    <svg viewBox="0 0 160 120" fill="none" className="w-full h-auto">
      <defs>
        <linearGradient id={`${id}-ltop`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4a5570" />
          <stop offset="100%" stopColor="#272f42" />
        </linearGradient>
        <linearGradient id={`${id}-lfront`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c2333" />
          <stop offset="100%" stopColor="#0c101a" />
        </linearGradient>
      </defs>
      {slab(74, 0, 'c')}
      {slab(44, 6, 'b')}
      {slab(14, 12, 'a')}
      {/* specular streak on top slab */}
      <path d="M48 15 L70 15 L58 26 L40 26 Z" fill="#ffffff" fillOpacity="0.3" />
      {/* 0.08 gap callout */}
      <line x1="150" y1="40" x2="150" y2="57" stroke={OUTLINE_HI} strokeWidth="1" />
      <line x1="146" y1="40" x2="154" y2="40" stroke={OUTLINE_HI} strokeWidth="1" />
      <line x1="146" y1="57" x2="154" y2="57" stroke={OUTLINE_HI} strokeWidth="1" />
    </svg>
  );
}

/** LED base unit with warm strip and USB-C tail. */
export function BaseArt({ id }: ArtProps) {
  return (
    <svg viewBox="0 0 160 110" fill="none" className="w-full h-auto">
      <defs>
        <linearGradient id={`${id}-btop`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#46516b" />
          <stop offset="100%" stopColor="#252d40" />
        </linearGradient>
        <linearGradient id={`${id}-bfront`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b2231" />
          <stop offset="100%" stopColor="#0a0e17" />
        </linearGradient>
        <linearGradient id={`${id}-bstrip`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff9d3c" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#ffd9a0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff9d3c" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="56" rx="72" ry="34" fill="#ffb45e" fillOpacity="0.08" />
      {/* top face */}
      <path d="M30 28 H130 L148 54 H12 Z" fill={`url(#${id}-btop)`} stroke={OUTLINE} strokeWidth="1" />
      {/* specular streak on top */}
      <path d="M52 30 L78 30 L60 52 L38 52 Z" fill="#ffffff" fillOpacity="0.18" />
      {/* front face */}
      <path d="M12 54 H148 V74 Q148 82 140 82 H20 Q12 82 12 74 Z" fill={`url(#${id}-bfront)`} stroke={OUTLINE} strokeWidth="1" />
      {/* warm LED strip */}
      <rect x="24" y="60" width="112" height="4" rx="2" fill={`url(#${id}-bstrip)`} />
      {/* touch dimmer */}
      <circle cx="80" cy="72" r="4.5" stroke={OUTLINE_HI} strokeWidth="1" />
      <circle cx="80" cy="72" r="1.5" fill="#ffd9a0" fillOpacity="0.9" />
      {/* USB-C tail */}
      <path d="M148 70 Q160 74 156 92" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="150" y="92" width="12" height="7" rx="3.5" transform="rotate(12 150 92)" stroke={OUTLINE_HI} strokeWidth="1" />
    </svg>
  );
}

/** Dispatch parcel with glowing locator pin. */
export function ParcelArt({ id }: ArtProps) {
  return (
    <svg viewBox="0 0 160 150" fill="none" className="w-full h-auto">
      <defs>
        <linearGradient id={`${id}-ptop`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4a5570" />
          <stop offset="100%" stopColor="#272f42" />
        </linearGradient>
        <linearGradient id={`${id}-pleft`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#202839" />
          <stop offset="100%" stopColor="#0e1220" />
        </linearGradient>
        <linearGradient id={`${id}-pright`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#161c2a" />
          <stop offset="100%" stopColor="#090c14" />
        </linearGradient>
        <radialGradient id={`${id}-pinglow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffc97a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffc97a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* locator pin */}
      <circle cx="80" cy="28" r="22" fill={`url(#${id}-pinglow)`} />
      <path d="M80 14 Q92 14 92 26 Q92 36 80 46 Q68 36 68 26 Q68 14 80 14 Z" stroke={OUTLINE_HI} strokeWidth="1.3" fill="#141a28" />
      <circle cx="80" cy="26" r="4" fill="#ffd9a0" fillOpacity="0.95" />
      <line x1="80" y1="48" x2="80" y2="62" stroke={OUTLINE} strokeWidth="1" strokeDasharray="2 3" />
      {/* box: top, left, right faces */}
      <path d="M80 62 L132 76 L80 90 L28 76 Z" fill={`url(#${id}-ptop)`} stroke={OUTLINE} strokeWidth="1" />
      <path d="M28 76 L80 90 V132 L28 118 Z" fill={`url(#${id}-pleft)`} stroke={OUTLINE} strokeWidth="1" />
      <path d="M132 76 L80 90 V132 L132 118 Z" fill={`url(#${id}-pright)`} stroke={OUTLINE} strokeWidth="1" />
      {/* tape */}
      <path d="M80 62 L80 90" stroke={OUTLINE_HI} strokeWidth="1" />
      <path d="M80 90 V132" stroke={OUTLINE_HI} strokeWidth="1" />
      {/* specular streak on top */}
      <path d="M62 68 L84 74 L70 80 L48 74 Z" fill="#ffffff" fillOpacity="0.2" />
    </svg>
  );
}

/** Fanned S/M/L glossy frames. */
export function FramesArt({ id }: ArtProps) {
  return (
    <svg viewBox="0 0 170 120" fill="none" className="w-full h-auto">
      <defs>
        <linearGradient id={`${id}-fface`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2b3650" />
          <stop offset="100%" stopColor="#121726" />
        </linearGradient>
      </defs>
      <g transform="rotate(-8 40 70)">
        <rect x="14" y="34" width="52" height="70" rx="6" fill={`url(#${id}-fface)`} stroke={OUTLINE} strokeWidth="1" />
        <path d="M18 38 L34 38 L22 100 L16 100 Z" fill="#ffffff" fillOpacity="0.12" />
      </g>
      <g transform="rotate(8 130 70)">
        <rect x="104" y="30" width="56" height="76" rx="6" fill={`url(#${id}-fface)`} stroke={OUTLINE} strokeWidth="1" />
        <path d="M108 34 L124 34 L112 102 L106 102 Z" fill="#ffffff" fillOpacity="0.12" />
      </g>
      <rect x="54" y="18" width="62" height="88" rx="7" fill={`url(#${id}-fface)`} stroke={OUTLINE_HI} strokeWidth="1.2" />
      <ellipse cx="85" cy="58" rx="22" ry="30" fill="#ffc97a" fillOpacity="0.22" />
      <path d="M60 22 L80 22 L66 102 L58 102 Z" fill="#ffffff" fillOpacity="0.2" />
    </svg>
  );
}
