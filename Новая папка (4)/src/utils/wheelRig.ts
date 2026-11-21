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
  /** Horizontal-to-vertical aspect correction (rx/ry) to un-squash 3/4-perspective wheels into a 100% true circle (eliminates 8-мерка wobble) */
  ellipseX?: number;
  /** Clear interior pixels inside this fraction of R (removes 3D-offset chain/sprocket/rotor fragments before baking centered rotor/spokes) */
  cleanInnerR?: number;
  /** Outer spoke anchor radius as a fraction of R for moto_spokes wheels (default 0.635; ~0.71 for black-rim dirtbikes) */
  spokeOuterR?: number;
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
      cy: 0.9027,
      rH: 0.0906,
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
      cx: 0.1128,
      cy: 0.8948,
      rH: 0.0972,
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
      cx: 0.897,
      cy: 0.9019,
      rH: 0.0866,
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
      cx: 0.1348,
      cy: 0.8825,
      rH: 0.1128,
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
      cx: 0.155,
      cy: 0.7897,
      rH: 0.2078,
      ellipseX: 1.005,
      symmetryDeg: 60,
      hubKeepR: 0.13,
      rotorStyle: 'moto_spokes', // Real knobby tire & orange rim + dead-centered transparent wire spokes & wave rotor (zero 8-мерка!)
      cleanInnerR: 0.61,
      spokeOuterR: 0.635,
      preserveBrightSpokes: true,
      arms: [
        { deg: -11, halfW: 0.17 },
        { deg: 3, halfW: 0.14, len: 1.15 },
      ],
      caliper: { deg: -55, dist: 0.36, rad: 0.17 },
    },
    front: {
      cx: 0.8435,
      cy: 0.7815,
      rH: 0.212,
      ellipseX: 0.99,
      symmetryDeg: 60,
      hubKeepR: 0.13,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.62,
      spokeOuterR: 0.635,
      preserveBrightSpokes: true,
      arms: [{ deg: -110, halfW: 0.15 }],
      caliper: { deg: 170, dist: 0.34, rad: 0.16 },
    },
  },
  wish02pro: {
    rear: {
      cx: 0.173,
      cy: 0.7515,
      rH: 0.2385,
      ellipseX: 1.022, // Pixel-measured concentric fit — zero 8-мерка wobble and zero ghost crescent
      symmetryDeg: 60,
      hubKeepR: 0.125,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.64,
      spokeOuterR: 0.655,
      preserveBrightSpokes: true,
      arms: [
        { deg: -17, halfW: 0.155 },
        { deg: 5, halfW: 0.12, len: 1.15 },
      ],
      caliper: { deg: -60, dist: 0.36, rad: 0.17 },
    },
    front: {
      cx: 0.8257,
      cy: 0.734,
      rH: 0.251,
      ellipseX: 0.962, // Pixel-measured concentric fit — front rim spins dead-center
      symmetryDeg: 60,
      hubKeepR: 0.125,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.65,
      spokeOuterR: 0.665,
      preserveBrightSpokes: true,
      arms: [{ deg: -112, halfW: 0.145 }],
      caliper: { deg: 168, dist: 0.34, rad: 0.16 },
    },
  },
  surron: {
    rear: {
      cx: 0.171,
      cy: 0.7302,
      rH: 0.268,
      ellipseX: 1.032, // True pixel-centered fit for Sur-Ron rear tire & black rim
      symmetryDeg: 60,
      hubKeepR: 0.12,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.705,
      spokeOuterR: 0.72,
      preserveBrightSpokes: true,
      arms: [
        { deg: -18, halfW: 0.14 },
        { deg: 5, halfW: 0.12, len: 1.15 },
      ],
      caliper: { deg: -48, dist: 0.35, rad: 0.15 },
    },
    front: {
      cx: 0.8283,
      cy: 0.7299,
      rH: 0.2688,
      ellipseX: 1.03,
      symmetryDeg: 60,
      hubKeepR: 0.12,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.715,
      spokeOuterR: 0.73,
      preserveBrightSpokes: true,
      arms: [{ deg: -114, halfW: 0.135 }],
      caliper: { deg: 165, dist: 0.34, rad: 0.15 },
    },
  },
  starkvarg: {
    rear: {
      cx: 0.1595,
      cy: 0.7385,
      rH: 0.2585,
      ellipseX: 0.985, // Locked dead-center on rear silver axle — zero 8-мерка wobble
      symmetryDeg: 60,
      hubKeepR: 0.125,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.675,
      spokeOuterR: 0.695,
      preserveBrightSpokes: true,
      arms: [{ deg: -14, halfW: 0.155 }],
      caliper: { deg: -60, dist: 0.34, rad: 0.16 },
    },
    front: {
      cx: 0.8366,
      cy: 0.7311,
      rH: 0.2625,
      ellipseX: 0.979,
      symmetryDeg: 60,
      hubKeepR: 0.125,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.705,
      spokeOuterR: 0.72,
      preserveBrightSpokes: true,
      arms: [{ deg: -115, halfW: 0.145 }],
      caliper: { deg: 162, dist: 0.35, rad: 0.16 },
    },
  },
  f3: {
    rear: {
      cx: 0.1095,
      cy: 0.8992,
      rH: 0.0985,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.56, // fits cleanly inside F3's orange rim stripe
      arms: [{ deg: -21, halfW: 0.27 }],
      fender: { startDeg: -165, endDeg: -32, minR: 0.86 },
    },
    front: {
      cx: 0.8942,
      cy: 0.8994,
      rH: 0.0987,
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
      cy: 0.9031,
      rH: 0.095,
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
      cx: 0.8901,
      cy: 0.8924,
      rH: 0.102,
      symmetryDeg: 60,
      hubKeepR: 0.22,
      rotorStyle: 'none', // Gold standard — untouched real ventilated rotor!
      arms: [{ deg: -58, halfW: 0.27 }],
      caliper: { deg: -108, dist: 0.54, rad: 0.3 },
    },
  },
  thunder3: {
    rear: {
      cx: 0.1312,
      cy: 0.8912,
      rH: 0.1028,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc', // Dead-centered ventilated silver brake rotor inside real Dualtron tire
      rotorScale: 0.56,
      cleanInnerR: 0.56,
      preserveBrightSpokes: true,
      arms: [{ deg: -40, halfW: 0.24 }],
      caliper: { deg: -102, dist: 0.56, rad: 0.26 },
      fender: { startDeg: -175, endDeg: -45, minR: 0.86 },
    },
    front: {
      cx: 0.8861,
      cy: 0.8913,
      rH: 0.1018,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'rim_bolts', // Preserves iconic crisp white Dualtron front rim ring & adds machined hub bolts
      preserveBrightSpokes: true,
      arms: [{ deg: -138, halfW: 0.22 }],
      fender: { startDeg: -145, endDeg: -42, minR: 0.88 },
    },
  },
  g4max: {
    rear: {
      cx: 0.1149,
      cy: 0.8862,
      rH: 0.1138,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'none', // HD G4 Max already has crisp real ventilated silver brake rotor!
      arms: [{ deg: -14, halfW: 0.27 }],
      caliper: { deg: -88, dist: 0.56, rad: 0.25 },
      fender: { startDeg: -158, endDeg: -55, minR: 0.88 },
    },
    front: {
      cx: 0.8864,
      cy: 0.8888,
      rH: 0.1112,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'none', // HD G4 Max already has crisp real ventilated silver brake rotor!
      arms: [{ deg: -163, halfW: 0.27 }],
      caliper: { deg: -92, dist: 0.56, rad: 0.25 },
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
    // High-precision motocross spoked wheel: dead-centered crossed stainless spokes, spoke nipples,
    // crisp inner rim lip, scalloped wave brake rotor & CNC hub (100% radial symmetry = zero 8-мерка wobble!)
    const spokeOuter = R * (spec.spokeOuterR ?? 0.635);
    const hubR = R * 0.205;

    // 1) Far-side crossed wire spokes (subtle metallic depth)
    ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const a = (i * Math.PI * 2) / 18;
      const twist = i % 2 === 0 ? 0.26 : -0.26;
      ctx.strokeStyle = 'rgba(128, 138, 152, 0.78)';
      ctx.lineWidth = Math.max(1.0, R * 0.016);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (hubR * 0.96), Math.sin(a) * (hubR * 0.96));
      ctx.lineTo(Math.cos(a + twist) * spokeOuter, Math.sin(a + twist) * spokeOuter);
      ctx.stroke();
    }

    // 2) Near-side bright stainless steel wire spokes + spoke nipples along the inner rim bed
    for (let i = 0; i < 18; i++) {
      const a = (i * Math.PI * 2) / 18 + Math.PI / 18;
      const twist = i % 2 === 0 ? -0.25 : 0.25;
      const endAng = a + twist;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(228, 236, 245, 0.94)' : 'rgba(176, 186, 200, 0.88)';
      ctx.lineWidth = Math.max(1.15, R * 0.019);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (hubR * 0.98), Math.sin(a) * (hubR * 0.98));
      ctx.lineTo(Math.cos(endAng) * spokeOuter, Math.sin(endAng) * spokeOuter);
      ctx.stroke();

      // Machined spoke nipple where spoke meets rim
      ctx.fillStyle = '#dce4ee';
      ctx.beginPath();
      ctx.arc(
        Math.cos(endAng) * (spokeOuter * 0.985),
        Math.sin(endAng) * (spokeOuter * 0.985),
        Math.max(1.0, R * 0.017),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Subtle crisp inner rim bead ring to lock the spoke ends cleanly into the real rim
    ctx.strokeStyle = 'rgba(210, 220, 232, 0.34)';
    ctx.lineWidth = Math.max(1.1, R * 0.018);
    ctx.beginPath();
    ctx.arc(0, 0, spokeOuter, 0, Math.PI * 2);
    ctx.stroke();

    // 3) Scalloped motocross wave brake rotor (0.29R .. 0.43R)
    const rotorR = R * 0.43;
    const rotorIn = R * 0.305;
    const rotorMid = (rotorR + rotorIn) * 0.5;
    const rotorGrad = ctx.createRadialGradient(0, 0, rotorIn, 0, 0, rotorR);
    rotorGrad.addColorStop(0, '#8d98a8');
    rotorGrad.addColorStop(0.55, '#c2ccd8');
    rotorGrad.addColorStop(1, '#98a3b2');
    ctx.strokeStyle = rotorGrad;
    ctx.lineWidth = Math.max(2.2, rotorR - rotorIn);
    ctx.beginPath();
    ctx.arc(0, 0, rotorMid, 0, Math.PI * 2);
    ctx.stroke();

    // Outer wave-disc petal notches
    ctx.strokeStyle = 'rgba(18, 24, 32, 0.72)';
    ctx.lineWidth = Math.max(1.2, R * 0.022);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.18;
      ctx.beginPath();
      ctx.arc(0, 0, rotorR * 1.01, a, a + 0.22);
      ctx.stroke();
    }

    // 6 curved CNC rotor carrier arms from hub to disc
    ctx.strokeStyle = '#9aa5b5';
    ctx.lineWidth = Math.max(1.6, R * 0.034);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (hubR * 0.88), Math.sin(a) * (hubR * 0.88));
      ctx.quadraticCurveTo(
        Math.cos(a + 0.08) * (hubR * 1.25),
        Math.sin(a + 0.08) * (hubR * 1.25),
        Math.cos(a + 0.2) * (rotorIn * 1.03),
        Math.sin(a + 0.2) * (rotorIn * 1.03)
      );
      ctx.stroke();
    }

    // 12 ventilated rotor cooling slots
    ctx.fillStyle = '#171d26';
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rotorMid, Math.sin(a) * rotorMid, Math.max(1.1, R * 0.021), 0, Math.PI * 2);
      ctx.fill();
    }

    // 4) Center CNC hub flange + 6 stainless bolts
    ctx.fillStyle = '#222933';
    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(205, 216, 228, 0.58)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.fillStyle = '#d6dfea';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (hubR * 0.72), Math.sin(a) * (hubR * 0.72), Math.max(1.15, R * 0.023), 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (style === 'rim_bolts') {
    // Preserve original detailed wheel/rotor while adding subtle machined Torx hub bolts for crisp rotation cue
    const boltRing = R * 0.34;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.fillStyle = 'rgba(202, 212, 224, 0.75)';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * boltRing, Math.sin(a) * boltRing, Math.max(1.1, R * 0.032), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Subtle dark sidewall molding clipped cleanly inside real tire rubber (zero bright streaks or spiky artifacts)
  ctx.globalCompositeOperation = 'source-atop';
  const lugCount = style === 'moto_spokes' ? 12 : 8;
  ctx.strokeStyle = 'rgba(24, 30, 38, 0.26)';
  ctx.lineWidth = Math.max(1.1, R * 0.03);
  ctx.lineCap = 'round';
  for (let i = 0; i < lugCount; i++) {
    const a = (i * Math.PI * 2) / lugCount;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (R * 0.84), Math.sin(a) * (R * 0.84));
    ctx.lineTo(Math.cos(a) * (R * 0.91), Math.sin(a) * (R * 0.91));
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Refines (cx, cy) within a tight ±3% radius window using unobstructed outer-tire silhouette
 * rays so even studio photos with slight axle drift become 100% dead-centered before circularizing.
 */
function refineWheelCenter(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  cx: number,
  cy: number,
  R: number,
  ellipseX: number,
  mask: PrecomputedMask
): { cx: number; cy: number } {
  const sample: [number, number, number, number] = [0, 0, 0, 0];
  let sumCos = 0;
  let sumSin = 0;
  let sumR = 0;
  let count = 0;
  const rays = 36;

  for (let i = 0; i < rays; i++) {
    const ang = (i * Math.PI * 2) / rays;
    const deg = (ang * 180) / Math.PI;
    // Skip bottom floor contact patch (60..120 deg) where real tires flatten slightly
    if (deg > 60 && deg < 120) continue;

    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    // Skip angles occluded by swingarm/fork/fender at the outer tire rim
    if (getOcclusion(ca * R * 0.9 * ellipseX, sa * R * 0.9, R * 0.9, mask, 4.0, 0.24) > 0.05) {
      continue;
    }

    // Walk inward from 1.08R to 0.78R to find the true outer tire silhouette edge
    let edgeR = -1;
    for (let frac = 1.08; frac >= 0.78; frac -= 0.015) {
      const fx = cx + ca * R * frac * ellipseX;
      const fy = cy + sa * R * frac;
      sampleBilinear(srcData, srcW, srcH, fx, fy, sample);
      const minCh = Math.min(sample[0], sample[1], sample[2]);
      const sat = Math.max(sample[0], sample[1], sample[2]) - minCh;
      const isWhiteHalo = minCh > 155 && sat < 30;
      if (sample[3] > 140 && !isWhiteHalo) {
        edgeR = R * frac;
        break;
      }
    }
    if (edgeR > 0) {
      sumR += edgeR;
      sumCos += edgeR * ca;
      sumSin += edgeR * sa;
      count++;
    }
  }

  if (count < 12) return { cx, cy };
  const meanR = sumR / count;
  // First-harmonic Fourier offset gives exact geometric center shift of an off-center circle
  let shiftX = (2 / count) * (sumCos - meanR * 0);
  let shiftY = (2 / count) * (sumSin - meanR * 0);
  // Subtract bias from non-uniform ray sampling (since occluded/bottom angles were skipped)
  let biasCos = 0;
  let biasSin = 0;
  for (let i = 0; i < rays; i++) {
    const ang = (i * Math.PI * 2) / rays;
    const deg = (ang * 180) / Math.PI;
    if (deg > 60 && deg < 120) continue;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    if (getOcclusion(ca * R * 0.9 * ellipseX, sa * R * 0.9, R * 0.9, mask, 4.0, 0.24) > 0.05) {
      continue;
    }
    biasCos += ca;
    biasSin += sa;
  }
  shiftX = ((sumCos - meanR * biasCos) * 2) / count;
  shiftY = ((sumSin - meanR * biasSin) * 2) / count;

  // Clamp shift conservatively so we never wander away from the true axle bolt
  const maxShift = R * 0.032;
  shiftX = Math.max(-maxShift, Math.min(maxShift, shiftX));
  shiftY = Math.max(-maxShift, Math.min(maxShift, shiftY));

  return {
    cx: cx + shiftX * ellipseX,
    cy: cy + shiftY,
  };
}

function resolveRefinedWheelSpec(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  spec: WheelCircleSpec
): WheelCircleSpec {
  const rawCx = spec.cx * srcW;
  const rawCy = spec.cy * srcH;
  const R = spec.rH * srcH;
  const ellipseX = spec.ellipseX ?? 1;
  const mask = buildMask(spec, R);
  const refined = refineWheelCenter(srcData, srcW, srcH, rawCx, rawCy, R, ellipseX, mask);
  return {
    ...spec,
    cx: refined.cx / srcW,
    cy: refined.cy / srcH,
  };
}

/**
 * Extracts the wheel from the original scooter PNG and enforces exact mathematical rotational
 * symmetry (12-fold circularization on the outer rim & rubber tire + K-fold spoke symmetry on
 * the inner hub/rotor) so EVERY wheel rolls 100% concentrically with ZERO eccentric wobble!
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
  const ellipseX = spec.ellipseX ?? 1;
  const mask = buildMask(spec, R);

  const isMoto = spec.rotorStyle === 'moto_spokes';
  const maxR = R * (isMoto ? 0.992 : 0.996);
  const canvasRadius = R * 1.02;
  const size = Math.max(16, Math.ceil(canvasRadius * 2) + 2);
  const half = size * 0.5;
  // Exact padScale so drawImage(-rDraw, -rDraw, rDraw*2, rDraw*2) matches body pixel scale 1:1
  const padScale = half / R;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, padScale };

  const outImg = ctx.createImageData(size, size);
  const out = outImg.data;

  const symCount = Math.max(5, Math.round(360 / (spec.symmetryDeg ?? 60)));
  const outerRingSym = 12; // 12-fold circular symmetry for rim & tire eliminates all flat-spots & lighting wobble
  const sampleC: [number, number, number, number] = [0, 0, 0, 0];
  const centerCleanR = R * ((spec.hubKeepR ?? 0.2) + 0.03);
  const cleanInnerPx = spec.cleanInnerR ? R * spec.cleanInnerR : 0;
  const tireSymStartR = cleanInnerPx > 0 ? cleanInnerPx : R * 0.58;

  for (let y = 0; y < size; y++) {
    const dy = y + 0.5 - half;
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - half;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) continue;

      const idx = (y * size + x) * 4;

      // Clear eccentric 3D-offset inner chain/sprocket/rotor zone before baking dead-centered spokes/disc
      if (cleanInnerPx > 0 && dist < cleanInnerPx) {
        continue;
      }

      // Center axle core is covered by stationary axle bolt/swingarm tip on bodyCanvas
      if (dist < centerCleanR) {
        out[idx] = 28;
        out[idx + 1] = 33;
        out[idx + 2] = 41;
        out[idx + 3] = 255;
        continue;
      }

      const baseAng = Math.atan2(dy, dx);
      const isOuterRing = dist >= tireSymStartR;
      const folds = isOuterRing ? outerRingSym : symCount;
      const step = (Math.PI * 2) / folds;

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      let validSamples = 0;

      // Fallback tracker if every fold happens to be near an arm/fender
      let bestOcc = 99;
      let fbR = 0;
      let fbG = 0;
      let fbB = 0;
      let fbA = 0;

      for (let k = 0; k < folds; k++) {
        const candAng = baseAng + k * step;
        // On the outermost rubber edge, skip the bottom studio floor flat-spot (68..112 deg)
        if (dist > R * 0.84) {
          const normDeg = (((candAng * 180) / Math.PI) % 360 + 360) % 360;
          if (normDeg > 68 && normDeg < 112) continue;
        }

        const cdx = Math.cos(candAng) * dist * ellipseX;
        const cdy = Math.sin(candAng) * dist;
        const fx = cx + cdx;
        const fy = cy + cdy;
        if (fx < 1 || fy < 1 || fx >= srcW - 2 || fy >= srcH - 2) continue;

        const candOcc = getOcclusion(cdx, cdy, dist, mask, 5.5, 0.24);
        sampleBilinear(srcData, srcW, srcH, fx, fy, sampleC);

        let sr = sampleC[0];
        let sg = sampleC[1];
        let sb = sampleC[2];
        let sa = sampleC[3];

        // Strip studio white background halo & honeycomb white artifacts BEFORE averaging
        if (sa > 0) {
          const maxCh = Math.max(sr, sg, sb);
          const minCh = Math.min(sr, sg, sb);
          const sat = maxCh - minCh;
          if (dist > R * 0.73 && minCh > 135 && sat < 34) {
            sa = 0;
          } else if (
            !spec.preserveBrightSpokes &&
            ((sa < 235 && minCh > 155 && sat < 30) || (minCh > 232 && sat < 18))
          ) {
            sa = 0;
          } else if (spec.preserveBrightSpokes && sa < 210 && minCh > 220 && sat < 15) {
            sa = 0;
          }
        }

        if (candOcc < bestOcc && sa > 5) {
          bestOcc = candOcc;
          fbR = sr;
          fbG = sg;
          fbB = sb;
          fbA = sa;
        }

        if (candOcc <= 0.03) {
          if (sa > 1) {
            sumR += sr * sa;
            sumG += sg * sa;
            sumB += sb * sa;
            sumA += sa;
          }
          validSamples++;
        }
      }

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      if (validSamples > 0 && sumA > 0.5) {
        r = sumR / sumA;
        g = sumG / sumA;
        b = sumB / sumA;
        a = sumA / validSamples;
        // Keep outer rubber rim crisp & solid where majority of angles have tire rubber
        if (isOuterRing && dist < maxR - 2.0 && a > 120) {
          a = Math.min(255, a * 1.18);
        }
      } else if (bestOcc < 99) {
        r = fbR;
        g = fbG;
        b = fbB;
        a = fbA;
      }

      // Clean circular anti-alias fade on the outermost 1.8px edge
      if (dist > maxR - 1.8) {
        a *= Math.max(0, (maxR - dist) / 1.8);
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
  const ellipseX = spec.ellipseX ?? 1;
  const punchR = R * 1.038;
  const hubR = R * (spec.hubKeepR ?? 0.2);
  const mask = buildMask(spec, R);

  const maxRx = Math.max(punchR, punchR * ellipseX);
  const x0 = Math.max(0, Math.floor(cx - maxRx - 2));
  const x1 = Math.min(w - 1, Math.ceil(cx + maxRx + 2));
  const y0 = Math.max(0, Math.floor(cy - punchR - 2));
  const y1 = Math.min(h - 1, Math.ceil(cy + punchR + 2));

  for (let y = y0; y <= y1; y++) {
    const dy = y + 0.5 - cy;
    for (let x = x0; x <= x1; x++) {
      const idx = (y * w + x) * 4;
      const origA = bodyData[idx + 3];
      if (origA === 0) continue;

      const dx = x + 0.5 - cx;
      const distCirc = Math.hypot(dx, dy);
      const distEllip = ellipseX !== 1 ? Math.hypot(dx / ellipseX, dy) : distCirc;
      const dist = Math.min(distCirc, distEllip);
      if (dist >= punchR) continue;

      let keep = getOcclusion(dx, dy, distCirc, mask, 0, 0.14);

      // Keep center axle nut/bolt stationary on top
      if (distCirc <= hubR) {
        keep = 1;
      } else if (distCirc < hubR + 2) {
        keep = Math.max(keep, 1 - (distCirc - hubR) / 2);
      }

      if (dist > punchR - 2.2) {
        keep = Math.max(keep, (dist - (punchR - 2.2)) / 2.2);
      }

      if (keep < 0.999) {
        bodyData[idx + 3] = Math.round(origA * keep);
      }
    }
  }
}

export function disposeScooterRig(rig: PreparedScooterRig | undefined | null) {
  if (!rig) return;
  try {
    rig.body.width = 0;
    rig.body.height = 0;
    rig.rearWheel.width = 0;
    rig.rearWheel.height = 0;
    rig.frontWheel.width = 0;
    rig.frontWheel.height = 0;
  } catch {
    // Ignore canvas disposal errors
  }
}

function hasOpaquePixels(canvas: HTMLCanvasElement): boolean {
  if (!canvas || canvas.width < 4 || canvas.height < 4) return false;
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    // Sample stride of 16 pixels for sub-millisecond check
    let opaque = 0;
    for (let i = 3; i < data.length; i += 64) {
      if (data[i] > 120) {
        opaque++;
        if (opaque >= 12) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function prepareScooterWheelRig(
  id: ScooterId,
  img: HTMLImageElement
): PreparedScooterRig | null {
  const cfg = SCOOTER_WHEEL_CONFIGS[id];
  if (!cfg || !img.naturalWidth || !img.naturalHeight) return null;

  try {
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

    const rearSpec = resolveRefinedWheelSpec(cleanSrc, w, h, cfg.rear);
    const frontSpec = resolveRefinedWheelSpec(cleanSrc, w, h, cfg.front);

    const rearBuilt = buildUntouchedWheelCanvas(cleanSrc, w, h, rearSpec);
    const frontBuilt = buildUntouchedWheelCanvas(cleanSrc, w, h, frontSpec);

    // Guarantee both wheels actually rendered non-empty pixels (prevents invisible wheels on mobile GPU limits!)
    if (!hasOpaquePixels(rearBuilt.canvas) || !hasOpaquePixels(frontBuilt.canvas)) {
      body.width = 0;
      body.height = 0;
      rearBuilt.canvas.width = 0;
      rearBuilt.canvas.height = 0;
      frontBuilt.canvas.width = 0;
      frontBuilt.canvas.height = 0;
      return null;
    }

    punchWheelFromBody(srcImg.data, w, h, rearSpec);
    punchWheelFromBody(srcImg.data, w, h, frontSpec);
    bCtx.putImageData(srcImg, 0, 0);

    return {
      body,
      rearWheel: rearBuilt.canvas,
      frontWheel: frontBuilt.canvas,
      rear: {
        cx: rearSpec.cx,
        cy: rearSpec.cy,
        rH: rearSpec.rH,
        padScale: rearBuilt.padScale,
      },
      front: {
        cx: frontSpec.cx,
        cy: frontSpec.cy,
        rH: frontSpec.rH,
        padScale: frontBuilt.padScale,
      },
    };
  } catch {
    // Graceful fallback to raw sprite if canvas readback fails on restricted WebView
    return null;
  }
}
