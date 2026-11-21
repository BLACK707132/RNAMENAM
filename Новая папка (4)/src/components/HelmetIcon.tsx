import type { HelmetStyle, MotocrossHelmet } from '../data/helmets';

interface HelmetIconProps {
  helmet: MotocrossHelmet;
  className?: string;
}

export function HelmetIcon({ helmet, className = 'w-16 h-16' }: HelmetIconProps) {
  const style: HelmetStyle = helmet.style ?? 'mx_peak';

  if (style === 'street_full') {
    return (
      <svg viewBox="-22 -22 52 40" className={className} aria-label={helmet.name} role="img">
        <path
          d="M -14.5 4.5 C -17.5 -10, -7 -17, 5.5 -15 C 14.5 -13.5, 19 -5.5, 19 3.5 C 18.8 10, 13.5 12.2, 4 12 L -10.5 11 Z"
          fill={helmet.shell}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="1.2"
        />
        <path
          d="M 4 3.5 L 18.6 4.2 Q 17.6 11.5 11 12 L -4 10.5 Z"
          fill={helmet.chin}
        />
        <path
          d="M -14.5 -2.5 Q -4 -10 8 -11.5 L 6.5 -7.8 Q -4 -6.2 -13.5 1.5 Z"
          fill={helmet.stripe}
        />
        <path
          d="M 2.5 -8.5 Q 15.5 -9 18.6 -1.8 L 18.2 3.2 Q 9 4.2 1.5 1.5 Z"
          fill="#0b0e14"
        />
        <path
          d="M 4 -7 Q 14.5 -7.5 17.4 -1.4 L 17.1 2.0 Q 9.5 2.8 3.2 0.5 Z"
          fill={helmet.goggles}
        />
        <path d="M 7.2 -5.8 L 11.4 -5.4 L 8.8 1.4 L 6.2 1.0 Z" fill="rgba(255,255,255,0.48)" />
      </svg>
    );
  }

  if (style === 'aero_track') {
    return (
      <svg viewBox="-24 -22 54 40" className={className} aria-label={helmet.name} role="img">
        <path d="M -12 -11 L -22.5 -15.5 L -19.5 -7.5 L -13.5 -3 Z" fill={helmet.visor} />
        <path
          d="M -14.5 4.5 C -17 -10, -7 -17, 5.5 -15.2 C 15 -13.2, 19.5 -4, 19.5 4.2 L 14.5 12 L -10 11 Z"
          fill={helmet.shell}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="1.2"
        />
        <path d="M 4 4 L 19.2 5.2 L 16.8 12 L -3 11 Z" fill={helmet.chin} />
        <path d="M -15 -1.5 L 5 -12.2 L 9 -11 L -12 2 Z" fill={helmet.stripe} />
        <path d="M 3 -8.5 Q 16 -9 19 -1.2 L 18.5 3.6 L 2 1.8 Z" fill="#090d14" />
        <path d="M 4.5 -7.0 Q 14.8 -7.4 17.8 -0.8 L 17.4 2.2 L 3.8 0.8 Z" fill={helmet.goggles} />
        <path d="M 7.5 -5.8 L 12 -5.2 L 9.4 1.4 L 6.6 0.8 Z" fill="rgba(255,255,255,0.5)" />
      </svg>
    );
  }

  if (style === 'open_ski') {
    return (
      <svg viewBox="-22 -22 52 40" className={className} aria-label={helmet.name} role="img">
        <path
          d="M -6 1.5 L 14.5 1.5 Q 15.5 11 10 12.2 L -8 11.2 Z"
          fill={helmet.chin}
        />
        <path
          d="M -15.5 3 C -17.5 -10.5, -7 -17, 5 -15.5 C 12.5 -14.5, 15.5 -9.5, 15.5 -5.5 L 6 -5.5 L -7 4.5 Z"
          fill={helmet.shell}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="1.2"
        />
        <path d="M 8 -10.5 Q 15 -10.8 18.5 -8.2 L 17.5 -6.2 L 7 -7.2 Z" fill={helmet.visor} />
        <path d="M -14 -3 L -1 -11.5 L 4 -11 L -9 -1 Z" fill={helmet.stripe} />
        <rect x="-15.2" y="-5.5" width="19.5" height="5.8" fill={helmet.strap} />
        <rect x="2.5" y="-8.5" width="13.8" height="11.2" rx="3.2" fill="#0f131a" />
        <rect x="4.2" y="-6.8" width="10.6" height="8" rx="2.2" fill={helmet.goggles} />
        <path d="M 6.2 -5.8 L 10.5 -5.8 L 8.0 0.4 L 5.6 0.4 Z" fill="rgba(255,255,255,0.5)" />
      </svg>
    );
  }

  return (
    <svg viewBox="-22 -24 52 42" className={className} aria-label={helmet.name} role="img">
      {style === 'horned_mx' && (
        <>
          <path
            d="M -7 -13 Q -13 -23.5 -17.5 -21 Q -13 -15 -11.5 -10.5 Z"
            fill={helmet.visor}
          />
          <path
            d="M 1 -14.5 Q -3 -21.5 -8 -19.5 Q -4 -14.5 -3 -13 Z"
            fill={helmet.stripe}
          />
        </>
      )}
      <path
        d="M -14 4 C -17 -9, -8 -17, 4 -15.5 C 11 -14.5, 14.5 -9, 14 -2 L 10 10 L -10 11 Z"
        fill={helmet.shell}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1.2"
      />
      <path
        d="M 4 3 L 22.5 6.2 L 20.5 12.2 L 3 12 L -4 9.5 Z"
        fill={helmet.chin}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1"
      />
      <path d="M 15.5 6.8 L 20.6 7.6 L 19.6 10.6 L 14.8 10 Z" fill="rgba(0,0,0,0.48)" />
      <path d="M -13.5 -2 L -2 -10.5 L 6 -10 L -4.5 -1 Z" fill={helmet.stripe} />
      <path
        d="M -2 -14.2 Q 11 -17.5 25 -12.2 L 23.5 -9.2 Q 12 -12.2 4 -10 Z"
        fill={helmet.visor}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="0.9"
      />
      <path d="M -15.5 -4 L 5 -5.5 L 5 1 L -14.8 2.2 Z" fill={helmet.strap} />
      <rect x="4.5" y="-7.8" width="11.5" height="10.2" rx="2.8" fill="#0f131a" />
      <rect x="6.2" y="-6.2" width="8.8" height="7.2" rx="2" fill={helmet.goggles} />
      <path d="M 7.4 -5.2 L 11.4 -5.2 L 9.2 0.2 L 7.2 0.2 Z" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}
