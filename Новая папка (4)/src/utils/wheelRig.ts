import type { ScooterId } from '../data/scooters';

interface ArmKeep {
  /** Angle in degrees from wheel center (0 = right, 90 = down, -90 = up, 180 = left) */
  deg: number;
  /** Half-width of the swingarm/fork bar as a fraction of wheel radius R */
  halfW: number;
  /** Length of the bar as a fraction of wheel radius R (default 1.3) */
  len?: number;
}

interface CaliperKeep {
  deg: number;
  dist: number; // fraction of R
  rad: number;  // fraction of R
}

interface FenderArcKeep {
  startDeg: number;
  endDeg: number;
  minR: number; // fraction of R
}

export type WheelRotorStyle = 'none' | 'g2pro_disc' | 'rim_bolts' | 'moto_spokes';

export interface WheelCircleSpec {
  cx: number; // normalized 0..1 of image width
  cy: number; // normalized 0..1 of image height
  rH: number; // wheel radius normalized to image height
  /** Rotational symmetry step in degrees (72 for 5-spoke/5-bolt discs, 60 for 6-spoke) */
  symmetryDeg?: number;
  hubKeepR?: number; // fraction of R kept opaque at center axle bolt
  /** Visual detail style baked behind swingarms so every scooter spins as cleanly as Kugoo G2 Pro */
  rotorStyle?: WheelRotorStyle;
  /** Radius of rotor disc as fraction of R (default 0.57 — stays cleanly inside colored rims) */
  rotorScale?: number;
  /** Keep bright metallic spokes (e.g., Wish 01 wire spokes) from being stripped as white studio halo */
  preserveBrightSpokes?: boolean;
  arms: ArmKeep[];
  caliper?: CaliperKeep;
  fender?: FenderArcKeep;
}

export interface ScooterWheelConfig {
  rear: WheelCircleSpec;
  front: WheelCircleSpec;
}

/**
 * Pixel-measured exact wheel circles, swingarm/fork keep-masks & G2-Pro-grade spinning rotors
 * for all 13 scooters.
 */
export const SCOOTER_WHEEL_CONFIGS: Record<ScooterId, ScooterWheelConfig> = {
  c3: {
    rear: {
      cx: 0.1107,
      cy: 0.8769,
      rH: 0.0851,
      symmetryDeg: 72, // 5-spoke rear wheel
      hubKeepR: 0.18,
      rotorStyle: 'rim_bolts',
      arms: [{ deg: -4, halfW: 0.25 }],
      fender: { startDeg: -162, endDeg: -12, minR: 0.93 },
    },
    front: {
      cx: 0.8974,
      cy: 0.9071,
      rH: 0.0885,
      symmetryDeg: 72,
      hubKeepR: 0.19,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.55,
      arms: [{ deg: -98, halfW: 0.22 }],
      fender: { startDeg: -168, endDeg: -40, minR: 0.91 },
    },
  },
  g2: {
    rear: {
      cx: 0.1274,
      cy: 0.8892,
      rH: 0.1012,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.58,
      arms: [{ deg: -18, halfW: 0.25 }],
      fender: { startDeg: -175, endDeg: -85, minR: 0.74 },
    },
    front: {
      cx: 0.8862,
      cy: 0.8887,
      rH: 0.1018,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.57,
      arms: [{ deg: -158, halfW: 0.24 }],
    },
  },
  gm: {
    rear: {
      cx: 0.1115,
      cy: 0.8986,
      rH: 0.094,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'rim_bolts',
      arms: [{ deg: -10, halfW: 0.27 }],
      caliper: { deg: -92, dist: 0.56, rad: 0.32 },
      fender: { startDeg: -165, endDeg: -35, minR: 0.85 },
    },
    front: {
      cx: 0.8971,
      cy: 0.8995,
      rH: 0.0986,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.57,
      arms: [{ deg: -156, halfW: 0.26 }],
      fender: { startDeg: -150, endDeg: -40, minR: 0.85 },
    },
  },
  m2: {
    rear: {
      cx: 0.104,
      cy: 0.9079,
      rH: 0.0825,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.57,
      arms: [{ deg: -14, halfW: 0.26 }],
      fender: { startDeg: -150, endDeg: -20, minR: 0.88 },
    },
    front: {
      cx: 0.8981,
      cy: 0.903,
      rH: 0.0855,
      symmetryDeg: 60,
      hubKeepR: 0.19,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.56,
      arms: [{ deg: -98, halfW: 0.22 }],
      fender: { startDeg: -170, endDeg: -28, minR: 0.88 },
    },
  },
  g77: {
    rear: {
      cx: 0.1325,
      cy: 0.8886,
      rH: 0.1077,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.56, // sits neatly inside yellow rim ring
      arms: [{ deg: 0, halfW: 0.23 }],
      fender: { startDeg: -168, endDeg: -15, minR: 0.92 },
    },
    front: {
      cx: 0.8929,
      cy: 0.8926,
      rH: 0.1037,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'rim_bolts',
      arms: [{ deg: -99, halfW: 0.2 }],
      fender: { startDeg: -168, endDeg: -32, minR: 0.92 },
    },
  },
  wish01: {
    rear: {
      cx: 0.1449,
      cy: 0.7386,
      rH: 0.1854,
      symmetryDeg: 60,
      hubKeepR: 0.18,
      rotorStyle: 'moto_spokes',
      preserveBrightSpokes: true,
      arms: [{ deg: -10, halfW: 0.21 }],
      caliper: { deg: -36, dist: 0.45, rad: 0.22 },
    },
    front: {
      cx: 0.8188,
      cy: 0.772,
      rH: 0.2097,
      symmetryDeg: 60,
      hubKeepR: 0.17,
      rotorStyle: 'moto_spokes',
      preserveBrightSpokes: true,
      arms: [{ deg: -110, halfW: 0.2 }],
      caliper: { deg: 172, dist: 0.38, rad: 0.23 },
    },
  },
  f3: {
    rear: {
      cx: 0.1063,
      cy: 0.9046,
      rH: 0.0944,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.56, // fits cleanly inside F3's orange rim stripe
      arms: [{ deg: -21, halfW: 0.27 }],
      fender: { startDeg: -165, endDeg: -32, minR: 0.86 },
    },
    front: {
      cx: 0.8981,
      cy: 0.9037,
      rH: 0.0963,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.56, // fits cleanly inside F3's orange rim stripe
      arms: [{ deg: -157, halfW: 0.27 }],
      fender: { startDeg: -145, endDeg: -38, minR: 0.86 },
    },
  },
  g2max: {
    rear: {
      cx: 0.1045,
      cy: 0.8995,
      rH: 0.0986,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'rim_bolts',
      arms: [{ deg: -24, halfW: 0.25 }],
      caliper: { deg: -92, dist: 0.56, rad: 0.28 },
    },
    front: {
      cx: 0.8945,
      cy: 0.8991,
      rH: 0.0991,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.57,
      arms: [{ deg: -152, halfW: 0.25 }],
      caliper: { deg: -102, dist: 0.52, rad: 0.23 },
    },
  },
  teverun: {
    rear: {
      cx: 0.1077,
      cy: 0.9049,
      rH: 0.0914,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'rim_bolts',
      arms: [
        { deg: -12, halfW: 0.26 },
        { deg: -142, halfW: 0.15 },
      ],
      caliper: { deg: -88, dist: 0.56, rad: 0.3 },
      fender: { startDeg: -155, endDeg: -32, minR: 0.87 },
    },
    front: {
      cx: 0.9012,
      cy: 0.9073,
      rH: 0.0908,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'rim_bolts',
      arms: [{ deg: -156, halfW: 0.26 }],
      caliper: { deg: -108, dist: 0.54, rad: 0.28 },
      fender: { startDeg: -145, endDeg: -40, minR: 0.87 },
    },
  },
  g2ultra: {
    rear: {
      cx: 0.1207,
      cy: 0.9019,
      rH: 0.0972,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.56, // sits neatly inside orange rim ring
      arms: [{ deg: -15, halfW: 0.25 }],
      fender: { startDeg: -162, endDeg: -42, minR: 0.8 },
    },
    front: {
      cx: 0.8946,
      cy: 0.9056,
      rH: 0.0935,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.56, // sits neatly inside orange rim ring
      arms: [{ deg: -150, halfW: 0.25 }],
    },
  },
  g2pro: {
    rear: {
      cx: 0.1673,
      cy: 0.8965,
      rH: 0.0995,
      symmetryDeg: 60,
      hubKeepR: 0.22,
      rotorStyle: 'none', // Gold standard — untouched real ventilated rotor!
      arms: [{ deg: -31, halfW: 0.28 }],
      caliper: { deg: -88, dist: 0.56, rad: 0.3 },
    },
    front: {
      cx: 0.8911,
      cy: 0.898,
      rH: 0.0995,
      symmetryDeg: 60,
      hubKeepR: 0.22,
      rotorStyle: 'none', // Gold standard — untouched real ventilated rotor!
      arms: [{ deg: -58, halfW: 0.27 }],
      caliper: { deg: -108, dist: 0.54, rad: 0.3 },
    },
  },
  thunder3: {
    rear: {
      cx: 0.1324,
      cy: 0.9046,
      rH: 0.0944,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'rim_bolts',
      arms: [{ deg: -40, halfW: 0.25 }],
      fender: { startDeg: -175, endDeg: -42, minR: 0.85 },
    },
    front: {
      cx: 0.8841,
      cy: 0.9056,
      rH: 0.0935,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.55, // sits cleanly inside Dualtron's white/silver rim ring
      arms: [{ deg: -140, halfW: 0.24 }],
      fender: { startDeg: -145, endDeg: -40, minR: 0.88 },
    },
  },
  g4max: {
    rear: {
      cx: 0.1056,
      cy: 0.8824,
      rH: 0.1,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.56, // sits neatly inside orange rim ring
      arms: [{ deg: -11, halfW: 0.26 }],
      fender: { startDeg: -165, endDeg: -50, minR: 0.86 },
    },
    front: {
      cx: 0.8907,
      cy: 0.8917,
      rH: 0.1019,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'rim_bolts',
      arms: [{ deg: -153, halfW: 0.26 }],
    },
  },
};

export interface PreparedScooterRig {
  body: HTMLCanvasElement;
  rearWheel: HTMLCanvasElement;
  frontWheel: HTMLCanvasElement;
  rear: { cx: number; cy: number; rH: number; padScale: number };
  front: { cx: number; cy: number; rH: number; padScale: number };
}

function normAngleRad(a: number): number {
  let x = a;
  while (x <= -Math.PI) x += Math.PI * 2;
  while (x > Math.PI) x -= Math.PI * 2;
  return x;
}

function isAngleInArc(angRad: number, startDeg: number, endDeg: number): boolean {
  const a = normAngleRad(angRad);
  const s = normAngleRad((startDeg * Math.PI) / 180);
  const e = normAngleRad((endDeg * Math.PI) / 180);
  if (s <= e) return a >= s && a <= e;
  return a >= s || a <= e;
}

function distToRaySegment(
  px: number,
  py: number,
  dirX: number,
  dirY: number,
  startProj: number,
  segLen: number
): number {
  const proj = Math.max(startProj, Math.min(segLen, px * dirX + py * dirY));
  const dx = px - dirX * proj;
  const dy = py - dirY * proj;
  return Math.hypot(dx, dy);
}

function sampleBilinear(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  fx: number,
  fy: number,
  out: [number, number, number, number]
) {
  if (fx < 0 || fy < 0 || fx >= w - 1 || fy >= h - 1) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return;
  }
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  const i00 = (y0 * w + x0) * 4;
  const i10 = i00 + 4;
  const i01 = i00 + w * 4;
  const i11 = i01 + 4;

  const w00 = (1 - tx) * (1 - ty);
  const w10 = tx * (1 - ty);
  const w01 = (1 - tx) * ty;
  const w11 = tx * ty;

  const a =
    data[i00 + 3] * w00 +
    data[i10 + 3] * w10 +
    data[i01 + 3] * w01 +
    data[i11 + 3] * w11;

  if (a < 1) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return;
  }

  const r =
    data[i00] * data[i00 + 3] * w00 +
    data[i10] * data[i10 + 3] * w10 +
    data[i01] * data[i01 + 3] * w01 +
    data[i11] * data[i11 + 3] * w11;
  const g =
    data[i00 + 1] * data[i00 + 3] * w00 +
    data[i10 + 1] * data[i10 + 3] * w10 +
    data[i01 + 1] * data[i01 + 3] * w01 +
    data[i11 + 1] * data[i11 + 3] * w11;
  const b =
    data[i00 + 2] * data[i00 + 3] * w00 +
    data[i10 + 2] * data[i10 + 3] * w10 +
    data[i01 + 2] * data[i01 + 3] * w01 +
    data[i11 + 2] * data[i11 + 3] * w11;

  out[0] = r / a;
  out[1] = g / a;
  out[2] = b / a;
  out[3] = a;
}

interface PrecomputedMask {
  arms: { dirX: number; dirY: number; halfW: number; len: number }[];
  cal: { x: number; y: number; rad: number } | null;
  fender?: FenderArcKeep;
  R: number;
}

function buildMask(spec: WheelCircleSpec, R: number): PrecomputedMask {
  return {
    R,
    arms: spec.arms.map((arm) => {
      const rad = (arm.deg * Math.PI) / 180;
      return {
        dirX: Math.cos(rad),
        dirY: Math.sin(rad),
        halfW: arm.halfW * R,
        len: (arm.len ?? 1.3) * R,
      };
    }),
    cal: spec.caliper
      ? {
          x: Math.cos((spec.caliper.deg * Math.PI) / 180) * spec.caliper.dist * R,
          y: Math.sin((spec.caliper.deg * Math.PI) / 180) * spec.caliper.dist * R,
          rad: spec.caliper.rad * R,
        }
      : null,
    fender: spec.fender,
  };
}

/**
 * Returns occlusion amount in [0..1] for a pixel (dx, dy) relative to wheel center.
 * Note: startProj = 0.24 * R keeps the arm ray from swallowing the opposite side of the hub!
 */
function getOcclusion(
  dx: number,
  dy: number,
  dist: number,
  mask: PrecomputedMask,
  padPx = 0,
  startProjFrac = 0.22
): number {
  let occ = 0;
  const feather = 5.0;
  const startProj = mask.R * startProjFrac;

  for (const arm of mask.arms) {
    const dArm = distToRaySegment(dx, dy, arm.dirX, arm.dirY, startProj, arm.len);
    const lim = arm.halfW + padPx;
    if (dArm <= lim) return 1;
    if (dArm < lim + feather) {
      occ = Math.max(occ, 1 - (dArm - lim) / feather);
    }
  }

  if (mask.cal) {
    const dCal = Math.hypot(dx - mask.cal.x, dy - mask.cal.y);
    const lim = mask.cal.rad + padPx;
    if (dCal <= lim) return 1;
    if (dCal < lim + feather) {
      occ = Math.max(occ, 1 - (dCal - lim) / feather);
    }
  }

  if (mask.fender) {
    const minFR = mask.fender.minR * mask.R - padPx;
    if (dist >= minFR - feather) {
      const ang = Math.atan2(dy, dx);
      if (isAngleInArc(ang, mask.fender.startDeg, mask.fender.endDeg)) {
        if (dist >= minFR) return 1;
        occ = Math.max(occ, (dist - (minFR - feather)) / feather);
      }
    }
  }

  return occ;
}

/**
 * Bakes realistic Kugoo G2 Pro–style brushed-steel vented brake rotor & subtle tire-tread cues
 * directly onto the wheel texture (strictly behind stationary swingarms/forks/axles) so flat dark
 * motor-hub wheels spin just as visibly, crisply, and smoothly as Kugoo G2 Pro — with zero white stripes!
 */
function bakeG2ProWheelDetails(
  ctx: CanvasRenderingContext2D,
  half: number,
  R: number,
  spec: WheelCircleSpec
) {
  const style = spec.rotorStyle ?? 'none';
  if (style === 'none') return;

  ctx.save();
  ctx.translate(half, half);

  if (style === 'g2pro_disc') {
    const discR = R * (spec.rotorScale ?? 0.57);
    const trackIn = discR * 0.72;
    const hubFlangeR = discR * 0.44;

    // 1) Dark recessed cavity behind the brake rotor so curved rotor spokes pop cleanly like G2 Pro
    ctx.fillStyle = 'rgba(14, 18, 24, 0.88)';
    ctx.beginPath();
    ctx.arc(0, 0, discR * 1.03, 0, Math.PI * 2);
    ctx.fill();

    // 2) Brushed-steel ventilated outer brake rotor ring (realistic metallic grey, never harsh white)
    const steelGrad = ctx.createRadialGradient(0, 0, hubFlangeR, 0, 0, discR);
    steelGrad.addColorStop(0, '#788290');
    steelGrad.addColorStop(0.55, '#a8b2bf');
    steelGrad.addColorStop(0.86, '#bcc5d1');
    steelGrad.addColorStop(1, '#858f9c');

    ctx.strokeStyle = steelGrad;
    ctx.lineWidth = Math.max(2, discR - trackIn);
    ctx.beginPath();
    ctx.arc(0, 0, (discR + trackIn) * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // 3) 6 curved G2-Pro-style rotor carrier arms connecting hub flange to brake track
    ctx.strokeStyle = '#9aa4b2';
    ctx.lineWidth = Math.max(1.8, discR * 0.13);
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a0 = (i * Math.PI) / 3;
      const a1 = a0 + 0.36;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a0) * (hubFlangeR * 0.85), Math.sin(a0) * (hubFlangeR * 0.85));
      ctx.quadraticCurveTo(
        Math.cos(a0 + 0.12) * (discR * 0.6),
        Math.sin(a0 + 0.12) * (discR * 0.6),
        Math.cos(a1) * (trackIn * 1.04),
        Math.sin(a1) * (trackIn * 1.04)
      );
      ctx.stroke();
    }

    // 4) Ventilated brake rotor slots & cooling holes around the outer steel track
    const midTrack = (discR + trackIn) * 0.5;
    ctx.fillStyle = '#181e27';
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const hx = Math.cos(a) * midTrack;
      const hy = Math.sin(a) * midTrack;
      ctx.beginPath();
      ctx.arc(hx, hy, Math.max(1.1, discR * 0.055), 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle wavy outer edge notches like G2 Pro's petal disc
    ctx.strokeStyle = 'rgba(20, 25, 32, 0.72)';
    ctx.lineWidth = Math.max(1.1, discR * 0.04);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.25;
      ctx.beginPath();
      ctx.arc(0, 0, discR * 1.01, a, a + 0.2);
      ctx.stroke();
    }

    // 5) Center mounting flange + 6 Torx rotor bolts
    ctx.fillStyle = '#252c36';
    ctx.beginPath();
    ctx.arc(0, 0, hubFlangeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(180, 190, 204, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, hubFlangeR, 0, Math.PI * 2);
    ctx.stroke();

    const boltRing = hubFlangeR * 0.76;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 6;
      ctx.fillStyle = '#c2cbd6';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * boltRing, Math.sin(a) * boltRing, Math.max(1.1, discR * 0.052), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'moto_spokes') {
    // Wish 01 dirtbike: crisp brushed-silver crossed wire spokes + inner wave brake disc
    // strictly inside the orange anodized rim (~0.60R) so real orange rim & knobby tires stay 100% intact!
    const spokeOuter = R * 0.6;
    const hubR = R * 0.23;

    // Subtle dark backing inside spoke area for clear motion contrast against sky/road
    ctx.fillStyle = 'rgba(18, 22, 28, 0.14)';
    ctx.beginPath();
    ctx.arc(0, 0, spokeOuter, 0, Math.PI * 2);
    ctx.fill();

    // 12 brushed-steel dirtbike wire spokes (angled tangentially like real moto wheels)
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const twist = i % 2 === 0 ? 0.22 : -0.22;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(205, 214, 224, 0.85)' : 'rgba(140, 150, 165, 0.78)';
      ctx.lineWidth = Math.max(1.1, R * 0.024);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * hubR, Math.sin(a) * hubR);
      ctx.lineTo(Math.cos(a + twist) * spokeOuter, Math.sin(a + twist) * spokeOuter);
      ctx.stroke();
    }

    // Inner wave brake rotor (0.24R .. 0.44R)
    const rotorR = R * 0.43;
    const rotorIn = R * 0.31;
    ctx.strokeStyle = 'rgba(185, 195, 208, 0.9)';
    ctx.lineWidth = Math.max(2, rotorR - rotorIn);
    ctx.beginPath();
    ctx.arc(0, 0, (rotorR + rotorIn) * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // 6 dark wave rotor vents
    ctx.fillStyle = '#1a2028';
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(
        Math.cos(a) * ((rotorR + rotorIn) * 0.5),
        Math.sin(a) * ((rotorR + rotorIn) * 0.5),
        Math.max(1.3, R * 0.032),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Hub flange + 6 bolts
    ctx.fillStyle = '#262d37';
    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.fillStyle = '#c8d1dc';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (hubR * 0.72), Math.sin(a) * (hubR * 0.72), Math.max(1.1, R * 0.025), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Subtle dark-graphite rubber sidewall tread notches (clipped strictly inside existing wheel pixels)
  // so outer tire motion is smoothly perceptible without any white stripes!
  ctx.globalCompositeOperation = 'source-atop';
  const lugCount = style === 'moto_spokes' ? 16 : 12;
  ctx.strokeStyle = 'rgba(200, 210, 222, 0.13)';
  ctx.lineWidth = Math.max(1.2, R * 0.045);
  ctx.lineCap = 'round';
  for (let i = 0; i < lugCount; i++) {
    const a = (i * Math.PI * 2) / lugCount;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (R * 0.8), Math.sin(a) * (R * 0.8));
    ctx.lineTo(Math.cos(a) * (R * 0.93), Math.sin(a) * (R * 0.93));
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Copies the real untouched wheel 1-to-1 from the original scooter PNG,
 * cleanly fills ONLY the occluded swingarm/caliper strip from a clean symmetric twin,
 * keeps the inner axle center dark metallic (never leaking white/orange swingarm pieces),
 * removes studio-background fringes, and bakes G2-Pro-grade rotor details on flat dark hubs!
 */
function buildUntouchedWheelCanvas(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  spec: WheelCircleSpec
): { canvas: HTMLCanvasElement; padScale: number } {
  const cx = spec.cx * srcW;
  const cy = spec.cy * srcH;
  const R = spec.rH * srcH;
  const padScale = 1.015;
  const maxR = R * padScale;
  const size = Math.max(16, Math.ceil(maxR * 2) + 2);
  const half = size * 0.5;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, padScale };

  const outImg = ctx.createImageData(size, size);
  const out = outImg.data;
  const mask = buildMask(spec, R);

  const stepRad = ((spec.symmetryDeg ?? 60) * Math.PI) / 180;
  const offsets: number[] = [];
  for (let k = 1; k <= 5; k++) {
    offsets.push(stepRad * k);
    offsets.push(-stepRad * k);
  }
  offsets.push(Math.PI, Math.PI * 0.5, -Math.PI * 0.5);

  const origC: [number, number, number, number] = [0, 0, 0, 0];
  const fillC: [number, number, number, number] = [0, 0, 0, 0];
  const centerCleanR = R * Math.max(0.22, (spec.hubKeepR ?? 0.2) + 0.04);

  for (let y = 0; y < size; y++) {
    const dy = y + 0.5 - half;
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - half;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) continue;

      const idx = (y * size + x) * 4;

      // Center axle core is always covered by the stationary axle bolt/swingarm tip on bodyCanvas:
      // keep it clean dark metallic so no white/orange swingarm pixels ever leak into the wheel center!
      if (dist < centerCleanR) {
        out[idx] = 28;
        out[idx + 1] = 33;
        out[idx + 2] = 41;
        out[idx + 3] = 255;
        continue;
      }

      sampleBilinear(srcData, srcW, srcH, cx + dx, cy + dy, origC);

      // Extra generous padding (5px) when reading wheel pixels so swingarm edges NEVER bleed onto wheel
      const occ = getOcclusion(dx, dy, dist, mask, 5.0, 0.24);

      let r = origC[0];
      let g = origC[1];
      let b = origC[2];
      let a = origC[3];

      if (occ > 0.001) {
        const baseAng = Math.atan2(dy, dx);
        // Average up to 2 clean symmetric twins at the same radius to eliminate lighting seams
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let sumA = 0;
        let count = 0;
        let fallbackOx = dx;
        let fallbackOy = dy;
        let fallbackOcc = 2;

        for (const off of offsets) {
          const candAng = baseAng + off;
          const cdx = Math.cos(candAng) * dist;
          const cdy = Math.sin(candAng) * dist;
          const fx = cx + cdx;
          const fy = cy + cdy;
          if (fx < 1 || fy < 1 || fx >= srcW - 2 || fy >= srcH - 2) continue;
          const candOcc = getOcclusion(cdx, cdy, dist, mask, 6.5, 0.24);
          if (candOcc < fallbackOcc) {
            fallbackOcc = candOcc;
            fallbackOx = cdx;
            fallbackOy = cdy;
          }
          if (candOcc <= 0.01) {
            sampleBilinear(srcData, srcW, srcH, fx, fy, fillC);
            if (fillC[3] > 1) {
              sumR += fillC[0] * fillC[3];
              sumG += fillC[1] * fillC[3];
              sumB += fillC[2] * fillC[3];
              sumA += fillC[3];
              count++;
              if (count >= 2) break;
            }
          }
        }

        if (count > 0 && sumA > 0.5) {
          fillC[0] = sumR / sumA;
          fillC[1] = sumG / sumA;
          fillC[2] = sumB / sumA;
          fillC[3] = sumA / count;
        } else {
          sampleBilinear(srcData, srcW, srcH, cx + fallbackOx, cy + fallbackOy, fillC);
        }

        const wFill = occ;
        const wOrig = 1 - occ;
        const aSum = fillC[3] * wFill + origC[3] * wOrig;
        if (aSum > 0.5) {
          r = (fillC[0] * fillC[3] * wFill + origC[0] * origC[3] * wOrig) / aSum;
          g = (fillC[1] * fillC[3] * wFill + origC[1] * origC[3] * wOrig) / aSum;
          b = (fillC[2] * fillC[3] * wFill + origC[2] * origC[3] * wOrig) / aSum;
          a = aSum;
        } else {
          a = 0;
        }
      }

      // Remove white studio-background fringes, honeycomb white dots & white stripes inside the wheel!
      const maxCh = Math.max(r, g, b);
      const minCh = Math.min(r, g, b);
      const sat = maxCh - minCh;
      if (a > 0) {
        // 1) Outer black rubber tire zone (dist > 0.73 * R): any bright neutral pixel is studio-cutout halo or honeycomb white!
        if (dist > R * 0.73 && minCh > 135 && sat < 34) {
          a = 0;
        }
        // 2) Inner spoke/disc zone: strip semi-transparent white background halo edges & trapped pure-white studio blotches
        else if (
          !spec.preserveBrightSpokes &&
          ((a < 235 && minCh > 155 && sat < 30) || (minCh > 232 && sat < 18))
        ) {
          a = 0;
        } else if (spec.preserveBrightSpokes && a < 210 && minCh > 220 && sat < 15) {
          a = 0;
        }
      }

      // Clean circular anti-alias fade on the outermost 1.5px edge
      if (dist > maxR - 1.5) {
        a *= Math.max(0, (maxR - dist) / 1.5);
      }

      out[idx] = Math.round(r);
      out[idx + 1] = Math.round(g);
      out[idx + 2] = Math.round(b);
      out[idx + 3] = Math.round(Math.max(0, Math.min(255, a)));
    }
  }

  ctx.putImageData(outImg, 0, 0);
  bakeG2ProWheelDetails(ctx, half, R, spec);
  return { canvas, padScale };
}

/**
 * Punches ONLY the unobstructed spinning wheel zone out of the body copy,
 * keeping the real swingarms, forks, calipers, fenders, and center axle nuts opaque on top!
 */
function punchWheelFromBody(
  bodyData: Uint8ClampedArray,
  w: number,
  h: number,
  spec: WheelCircleSpec
) {
  const cx = spec.cx * w;
  const cy = spec.cy * h;
  const R = spec.rH * h;
  const punchR = R * 1.025;
  const hubR = R * (spec.hubKeepR ?? 0.2);
  const mask = buildMask(spec, R);

  const x0 = Math.max(0, Math.floor(cx - punchR - 2));
  const x1 = Math.min(w - 1, Math.ceil(cx + punchR + 2));
  const y0 = Math.max(0, Math.floor(cy - punchR - 2));
  const y1 = Math.min(h - 1, Math.ceil(cy + punchR + 2));

  for (let y = y0; y <= y1; y++) {
    const dy = y + 0.5 - cy;
    for (let x = x0; x <= x1; x++) {
      const idx = (y * w + x) * 4;
      const origA = bodyData[idx + 3];
      if (origA === 0) continue;

      const dx = x + 0.5 - cx;
      const dist = Math.hypot(dx, dy);
      if (dist >= punchR) continue;

      let keep = getOcclusion(dx, dy, dist, mask, 0, 0.14);

      // Keep center axle nut/bolt stationary on top
      if (dist <= hubR) {
        keep = 1;
      } else if (dist < hubR + 2) {
        keep = Math.max(keep, 1 - (dist - hubR) / 2);
      }

      if (dist > punchR - 2) {
        keep = Math.max(keep, (dist - (punchR - 2)) / 2);
      }

      if (keep < 0.999) {
        bodyData[idx + 3] = Math.round(origA * keep);
      }
    }
  }
}

export function prepareScooterWheelRig(
  id: ScooterId,
  img: HTMLImageElement
): PreparedScooterRig | null {
  const cfg = SCOOTER_WHEEL_CONFIGS[id];
  if (!cfg || !img.naturalWidth || !img.naturalHeight) return null;

  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const body = document.createElement('canvas');
  body.width = w;
  body.height = h;
  const bCtx = body.getContext('2d', { willReadFrequently: true });
  if (!bCtx) return null;

  bCtx.drawImage(img, 0, 0, w, h);
  const srcImg = bCtx.getImageData(0, 0, w, h);
  const cleanSrc = new Uint8ClampedArray(srcImg.data);

  const rearBuilt = buildUntouchedWheelCanvas(cleanSrc, w, h, cfg.rear);
  const frontBuilt = buildUntouchedWheelCanvas(cleanSrc, w, h, cfg.front);

  punchWheelFromBody(srcImg.data, w, h, cfg.rear);
  punchWheelFromBody(srcImg.data, w, h, cfg.front);
  bCtx.putImageData(srcImg, 0, 0);

  return {
    body,
    rearWheel: rearBuilt.canvas,
    frontWheel: frontBuilt.canvas,
    rear: {
      cx: cfg.rear.cx,
      cy: cfg.rear.cy,
      rH: cfg.rear.rH,
      padScale: rearBuilt.padScale,
    },
    front: {
      cx: cfg.front.cx,
      cy: cfg.front.cy,
      rH: cfg.front.rH,
      padScale: frontBuilt.padScale,
    },
  };
}
