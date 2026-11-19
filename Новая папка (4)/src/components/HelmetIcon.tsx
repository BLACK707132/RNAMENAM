import type { MotocrossHelmet } from '../data/helmets';

interface HelmetIconProps {
  helmet: MotocrossHelmet;
  className?: string;
}

export function HelmetIcon({ helmet, className = 'w-16 h-16' }: HelmetIconProps) {
  return (
    <svg
      viewBox="-22 -22 52 40"
      className={className}
      aria-label={helmet.name}
      role="img"
    >
      {/* Main MX dome */}
      <path
        d="M -14 4 C -17 -9, -8 -17, 4 -15.5 C 11 -14.5, 14.5 -9, 14 -2 L 10 10 L -10 11 Z"
        fill={helmet.shell}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1.2"
      />
      {/* Forward MX chin guard */}
      <path
        d="M 4 3 L 22.5 6.2 L 20.5 12.2 L 3 12 L -4 9.5 Z"
        fill={helmet.chin}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1"
      />
      {/* Chin vent */}
      <path d="M 15.5 6.8 L 20.6 7.6 L 19.6 10.6 L 14.8 10 Z" fill="rgba(0,0,0,0.48)" />
      {/* Racing stripe */}
      <path d="M -13.5 -2 L -2 -10.5 L 6 -10 L -4.5 -1 Z" fill={helmet.stripe} />
      {/* Top aggressive MX visor / peak */}
      <path
        d="M -2 -14.2 Q 11 -17.5 25 -12.2 L 23.5 -9.2 Q 12 -12.2 4 -10 Z"
        fill={helmet.visor}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="0.9"
      />
      {/* Goggle strap */}
      <path d="M -15.5 -4 L 5 -5.5 L 5 1 L -14.8 2.2 Z" fill={helmet.strap} />
      {/* Goggles frame */}
      <rect x="4.5" y="-7.8" width="11.5" height="10.2" rx="2.8" fill="#0f131a" />
      {/* Goggles mirrored lens */}
      <rect x="6.2" y="-6.2" width="8.8" height="7.2" rx="2" fill={helmet.goggles} />
      {/* Lens glare */}
      <path d="M 7.4 -5.2 L 11.4 -5.2 L 9.2 0.2 L 7.2 0.2 Z" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}
