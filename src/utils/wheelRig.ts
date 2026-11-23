import {
  getScooter,
  type ScooterId,
  type ScooterPaint,
} from '../data/scooters';

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
  /** Keep real outer knobby tire lugs instead of shaving or 12-fold blurring them smooth */
  preserveKnobby?: boolean;
  /** Preferred unoccluded sector center angle (deg) for sharp real-rotor/spoke/knobby extraction */
  sectorDeg?: number;
  arms: ArmKeep[];
  caliper?: CaliperKeep;
  fender?: FenderArcKeep;
}

export interface ScooterWheelConfig {
  rear: WheelCircleSpec;
  front: WheelCircleSpec;
}

/**
 * Pixel-measured exact wheel circles, swingarm/fork keep-masks & crisp wheel rigs
 * for all 16 scooters & pitbikes.
 */
export const SCOOTER_WHEEL_CONFIGS: Record<ScooterId, ScooterWheelConfig> = {
  c3: {
    rear: {
      cx: 0.1098,
      cy: 0.8767,
      rH: 0.0853,
      ellipseX: 0.985,
      symmetryDeg: 60,
      hubKeepR: 0.19,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.62,
      cleanInnerR: 0.64,
      arms: [{ deg: -4, halfW: 0.26 }],
      fender: { startDeg: -165, endDeg: -12, minR: 0.91 },
    },
    front: {
      cx: 0.8972,
      cy: 0.9090,
      rH: 0.0863,
      ellipseX: 1.005,
      symmetryDeg: 60,
      hubKeepR: 0.19,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.59,
      cleanInnerR: 0.61,
      arms: [{ deg: -98, halfW: 0.24 }],
      fender: { startDeg: -168, endDeg: -38, minR: 0.90 },
    },
  },
  g2: {
    rear: {
      cx: 0.1216,
      cy: 0.8915,
      rH: 0.1046,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.54,
      cleanInnerR: 0.56,
      arms: [{ deg: -16, halfW: 0.30, len: 1.35 }],
      fender: { startDeg: -175, endDeg: -45, minR: 0.90 },
    },
    front: {
      cx: 0.8922,
      cy: 0.8905,
      rH: 0.1057,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.54,
      cleanInnerR: 0.56,
      arms: [{ deg: -162, halfW: 0.28, len: 1.35 }],
      fender: { startDeg: -155, endDeg: -95, minR: 0.94 },
    },
  },
  gm: {
    rear: {
      cx: 0.1120,
      cy: 0.9005,
      rH: 0.0955,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.62,
      cleanInnerR: 0.64,
      arms: [{ deg: -12, halfW: 0.32, len: 1.35 }],
      caliper: { deg: -115, dist: 0.56, rad: 0.28 },
      fender: { startDeg: -175, endDeg: -38, minR: 0.90 },
    },
    front: {
      cx: 0.8967,
      cy: 0.9009,
      rH: 0.0973,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.55,
      cleanInnerR: 0.56,
      arms: [{ deg: -156, halfW: 0.30, len: 1.35 }],
      fender: { startDeg: -162, endDeg: -45, minR: 0.90 },
    },
  },
  m2: {
    rear: {
      cx: 0.1038,
      cy: 0.9068,
      rH: 0.0825,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.56,
      cleanInnerR: 0.57,
      arms: [{ deg: -1, halfW: 0.38, len: 1.35 }],
      fender: { startDeg: -152, endDeg: -18, minR: 0.94 },
    },
    front: {
      cx: 0.8972,
      cy: 0.9082,
      rH: 0.0810,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.19,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.56,
      cleanInnerR: 0.57,
      arms: [{ deg: -98, halfW: 0.24 }],
      fender: { startDeg: -170, endDeg: -26, minR: 0.90 },
    },
  },
  g77: {
    rear: {
      cx: 0.1322,
      cy: 0.8835,
      rH: 0.1105,
      ellipseX: 0.995,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.54,
      cleanInnerR: 0.55,
      arms: [{ deg: -2, halfW: 0.36 }],
      fender: { startDeg: 158, endDeg: -12, minR: 0.82 },
    },
    front: {
      cx: 0.8927,
      cy: 0.8924,
      rH: 0.1043,
      ellipseX: 1.004,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.55,
      cleanInnerR: 0.57,
      arms: [{ deg: -99, halfW: 0.22 }],
      fender: { startDeg: -168, endDeg: -32, minR: 0.90 },
    },
  },
  wish01: {
    rear: {
      cx: 0.1566,
      cy: 0.7897,
      rH: 0.2100,
      ellipseX: 1.007,
      symmetryDeg: 60,
      hubKeepR: 0.13,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.635,
      spokeOuterR: 0.648,
      preserveBrightSpokes: true,
      preserveKnobby: true,
      sectorDeg: 145,
      arms: [
        { deg: -11, halfW: 0.17 },
        { deg: 3, halfW: 0.14, len: 1.15 },
      ],
      caliper: { deg: -55, dist: 0.36, rad: 0.17 },
    },
    front: {
      cx: 0.8421,
      cy: 0.7822,
      rH: 0.2135,
      ellipseX: 0.975,
      symmetryDeg: 60,
      hubKeepR: 0.13,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.712,
      spokeOuterR: 0.725,
      preserveBrightSpokes: true,
      preserveKnobby: true,
      sectorDeg: 20,
      arms: [{ deg: -110, halfW: 0.15 }],
      caliper: { deg: 170, dist: 0.34, rad: 0.16 },
    },
  },
  wish02pro: {
    rear: {
      cx: 0.1758,
      cy: 0.7525,
      rH: 0.2425,
      ellipseX: 0.996,
      symmetryDeg: 60,
      hubKeepR: 0.125,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.725,
      spokeOuterR: 0.738,
      preserveBrightSpokes: true,
      preserveKnobby: true,
      sectorDeg: 145,
      arms: [
        { deg: -16, halfW: 0.18 },
        { deg: 6, halfW: 0.13, len: 1.15 },
      ],
      caliper: { deg: 174, dist: 0.44, rad: 0.22 },
    },
    front: {
      cx: 0.8248,
      cy: 0.7364,
      rH: 0.2528,
      ellipseX: 0.950,
      symmetryDeg: 60,
      hubKeepR: 0.125,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.770,
      spokeOuterR: 0.782,
      preserveBrightSpokes: true,
      preserveKnobby: true,
      sectorDeg: 20,
      arms: [{ deg: -112, halfW: 0.145 }],
      caliper: { deg: 168, dist: 0.34, rad: 0.16 },
    },
  },
  surron: {
    rear: {
      cx: 0.1715,
      cy: 0.7308,
      rH: 0.2735,
      ellipseX: 1.016,
      symmetryDeg: 60,
      hubKeepR: 0.12,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.768,
      spokeOuterR: 0.780,
      preserveBrightSpokes: true,
      preserveKnobby: true,
      sectorDeg: 145,
      arms: [
        { deg: -18, halfW: 0.16 },
        { deg: 6, halfW: 0.12, len: 1.12 },
      ],
      caliper: { deg: -48, dist: 0.35, rad: 0.15 },
    },
    front: {
      cx: 0.8288,
      cy: 0.7346,
      rH: 0.2725,
      ellipseX: 1.015,
      symmetryDeg: 60,
      hubKeepR: 0.12,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.768,
      spokeOuterR: 0.780,
      preserveBrightSpokes: true,
      preserveKnobby: true,
      sectorDeg: 20,
      arms: [{ deg: -114, halfW: 0.135 }],
      caliper: { deg: 165, dist: 0.34, rad: 0.15 },
    },
  },
  starkvarg: {
    rear: {
      cx: 0.1610,
      cy: 0.7363,
      rH: 0.2580,
      ellipseX: 1.011,
      symmetryDeg: 60,
      hubKeepR: 0.125,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.688,
      spokeOuterR: 0.702,
      preserveBrightSpokes: true,
      preserveKnobby: true,
      sectorDeg: 145,
      arms: [{ deg: -14, halfW: 0.165 }],
      caliper: { deg: -60, dist: 0.34, rad: 0.16 },
    },
    front: {
      cx: 0.8342,
      cy: 0.7293,
      rH: 0.2650,
      ellipseX: 0.997,
      symmetryDeg: 60,
      hubKeepR: 0.125,
      rotorStyle: 'moto_spokes',
      cleanInnerR: 0.748,
      spokeOuterR: 0.760,
      preserveBrightSpokes: true,
      preserveKnobby: true,
      sectorDeg: 20,
      arms: [{ deg: -115, halfW: 0.145 }],
      caliper: { deg: 162, dist: 0.35, rad: 0.16 },
    },
  },
  f3: {
    rear: {
      cx: 0.1111,
      cy: 0.8966,
      rH: 0.0997,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.55,
      cleanInnerR: 0.56,
      arms: [{ deg: -16, halfW: 0.30, len: 1.35 }],
      fender: { startDeg: -175, endDeg: -32, minR: 0.88 },
    },
    front: {
      cx: 0.8947,
      cy: 0.8966,
      rH: 0.0997,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.55,
      cleanInnerR: 0.56,
      arms: [{ deg: -154, halfW: 0.30, len: 1.35 }],
      fender: { startDeg: -155, endDeg: -35, minR: 0.90 },
    },
  },
  g2max: {
    rear: {
      cx: 0.1050,
      cy: 0.9002,
      rH: 0.0979,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.58,
      cleanInnerR: 0.60,
      arms: [{ deg: -18, halfW: 0.30, len: 1.35 }],
      caliper: { deg: -65, dist: 0.56, rad: 0.26 },
    },
    front: {
      cx: 0.8931,
      cy: 0.8989,
      rH: 0.0993,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.55,
      cleanInnerR: 0.56,
      arms: [
        { deg: -152, halfW: 0.28, len: 1.35 },
        { deg: -112, halfW: 0.20, len: 1.25 },
      ],
    },
  },
  teverun: {
    rear: {
      cx: 0.1077,
      cy: 0.9064,
      rH: 0.0908,
      ellipseX: 1.004,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.58,
      cleanInnerR: 0.60,
      arms: [
        { deg: -12, halfW: 0.30 },
        { deg: -145, halfW: 0.20 },
      ],
      caliper: { deg: -88, dist: 0.56, rad: 0.32 },
      fender: { startDeg: 168, endDeg: -30, minR: 0.86 },
    },
    front: {
      cx: 0.9016,
      cy: 0.9073,
      rH: 0.0919,
      ellipseX: 0.986,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.58,
      cleanInnerR: 0.60,
      arms: [{ deg: -156, halfW: 0.28 }],
      caliper: { deg: -108, dist: 0.54, rad: 0.28 },
      fender: { startDeg: -145, endDeg: -40, minR: 0.87 },
    },
  },
  g2ultra: {
    rear: {
      cx: 0.1207,
      cy: 0.8994,
      rH: 0.0960,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.55,
      cleanInnerR: 0.56,
      arms: [{ deg: -15, halfW: 0.28, len: 1.35 }],
      fender: { startDeg: -175, endDeg: -38, minR: 0.90 },
    },
    front: {
      cx: 0.8944,
      cy: 0.9037,
      rH: 0.0940,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.55,
      cleanInnerR: 0.56,
      arms: [{ deg: -145, halfW: 0.28, len: 1.35 }],
      fender: { startDeg: -155, endDeg: -85, minR: 0.95 },
    },
  },
  g2pro: {
    rear: {
      cx: 0.1673,
      cy: 0.8909,
      rH: 0.1012,
      ellipseX: 1.015,
      symmetryDeg: 60,
      hubKeepR: 0.22,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.59,
      cleanInnerR: 0.61,
      arms: [{ deg: -31, halfW: 0.29 }],
      caliper: { deg: -88, dist: 0.56, rad: 0.30 },
    },
    front: {
      cx: 0.8893,
      cy: 0.8891,
      rH: 0.1053,
      ellipseX: 0.990,
      symmetryDeg: 60,
      hubKeepR: 0.22,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.59,
      cleanInnerR: 0.61,
      arms: [{ deg: -58, halfW: 0.28 }],
      caliper: { deg: -108, dist: 0.54, rad: 0.30 },
    },
  },
  thunder3: {
    rear: {
      cx: 0.1326,
      cy: 0.8903,
      rH: 0.1022,
      ellipseX: 0.990,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.58,
      cleanInnerR: 0.60,
      arms: [{ deg: -40, halfW: 0.26 }],
      caliper: { deg: -102, dist: 0.56, rad: 0.28 },
      fender: { startDeg: -175, endDeg: -45, minR: 0.86 },
    },
    front: {
      cx: 0.8855,
      cy: 0.8926,
      rH: 0.0988,
      ellipseX: 1.008,
      symmetryDeg: 60,
      hubKeepR: 0.21,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.57,
      cleanInnerR: 0.59,
      arms: [{ deg: -138, halfW: 0.24 }],
      fender: { startDeg: -145, endDeg: -42, minR: 0.88 },
    },
  },
  g4max: {
    rear: {
      cx: 0.1158,
      cy: 0.8916,
      rH: 0.1078,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.59,
      cleanInnerR: 0.61,
      arms: [{ deg: -10, halfW: 0.31, len: 1.35 }],
      fender: { startDeg: 156, endDeg: -26, minR: 0.96 },
    },
    front: {
      cx: 0.8537,
      cy: 0.8932,
      rH: 0.1078,
      ellipseX: 1.0,
      symmetryDeg: 60,
      hubKeepR: 0.2,
      rotorStyle: 'g2pro_disc',
      rotorScale: 0.59,
      cleanInnerR: 0.61,
      arms: [{ deg: -145, halfW: 0.30, len: 1.35 }],
      caliper: { deg: -135, dist: 0.49, rad: 0.19 },
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
    // Realistic motocross spoked wheel: fine metallic crossed stainless spokes, brass/steel nipples seated
    // flush into a crisp dark inner rim bead, subtle recessed gunmetal wave rotor & CNC hub.
    const spokeOuter = R * (spec.spokeOuterR ?? 0.65);
    const hubR = R * 0.195;

    // 1) Far-side crossed stainless wire spokes
    ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const a = (i * Math.PI * 2) / 18;
      const twist = i % 2 === 0 ? 0.27 : -0.27;
      ctx.strokeStyle = 'rgba(105, 116, 130, 0.78)';
      ctx.lineWidth = Math.max(0.9, R * 0.012);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (hubR * 0.94), Math.sin(a) * (hubR * 0.94));
      ctx.lineTo(Math.cos(a + twist) * spokeOuter, Math.sin(a + twist) * spokeOuter);
      ctx.stroke();
    }

    // 2) Near-side stainless steel wire spokes + nipples seated inside the rim bed
    for (let i = 0; i < 18; i++) {
      const a = (i * Math.PI * 2) / 18 + Math.PI / 18;
      const twist = i % 2 === 0 ? -0.26 : 0.26;
      const endAng = a + twist;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(198, 208, 220, 0.90)' : 'rgba(154, 165, 180, 0.85)';
      ctx.lineWidth = Math.max(1.0, R * 0.0135);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (hubR * 0.96), Math.sin(a) * (hubR * 0.96));
      ctx.lineTo(Math.cos(endAng) * spokeOuter, Math.sin(endAng) * spokeOuter);
      ctx.stroke();

      ctx.fillStyle = '#c8d2df';
      ctx.beginPath();
      ctx.arc(
        Math.cos(endAng) * (spokeOuter * 0.985),
        Math.sin(endAng) * (spokeOuter * 0.985),
        Math.max(0.9, R * 0.013),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Crisp inner rim bead seam seal (eliminates any sub-pixel halo along real rim inner edge)
    ctx.strokeStyle = 'rgba(16, 20, 26, 0.82)';
    ctx.lineWidth = Math.max(1.6, R * 0.024);
    ctx.beginPath();
    ctx.arc(0, 0, spokeOuter, 0, Math.PI * 2);
    ctx.stroke();

    // 3) Subtle recessed gunmetal wave brake rotor (0.24R .. 0.37R)
    const rotorR = R * 0.37;
    const rotorIn = R * 0.255;
    const rotorMid = (rotorR + rotorIn) * 0.5;
    const rotorGrad = ctx.createRadialGradient(0, 0, rotorIn, 0, 0, rotorR);
    rotorGrad.addColorStop(0, '#5a6472');
    rotorGrad.addColorStop(0.55, '#8c97a6');
    rotorGrad.addColorStop(1, '#687280');
    ctx.strokeStyle = rotorGrad;
    ctx.lineWidth = Math.max(2.0, rotorR - rotorIn);
    ctx.beginPath();
    ctx.arc(0, 0, rotorMid, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(16, 21, 28, 0.72)';
    ctx.lineWidth = Math.max(1.0, R * 0.018);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.18;
      ctx.beginPath();
      ctx.arc(0, 0, rotorR * 1.01, a, a + 0.22);
      ctx.stroke();
    }

    ctx.strokeStyle = '#6f7a89';
    ctx.lineWidth = Math.max(1.4, R * 0.028);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (hubR * 0.86), Math.sin(a) * (hubR * 0.86));
      ctx.quadraticCurveTo(
        Math.cos(a + 0.08) * (hubR * 1.18),
        Math.sin(a + 0.08) * (hubR * 1.18),
        Math.cos(a + 0.2) * (rotorIn * 1.03),
        Math.sin(a + 0.2) * (rotorIn * 1.03)
      );
      ctx.stroke();
    }

    ctx.fillStyle = '#141922';
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rotorMid, Math.sin(a) * rotorMid, Math.max(1.0, R * 0.017), 0, Math.PI * 2);
      ctx.fill();
    }

    // 4) Center CNC hub flange + 6 stainless bolts
    ctx.fillStyle = '#1d232d';
    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(170, 182, 198, 0.5)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.fillStyle = '#bac4d2';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (hubR * 0.72), Math.sin(a) * (hubR * 0.72), Math.max(1.0, R * 0.02), 0, Math.PI * 2);
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

  // Clamp shift tightly since base centers are already pixel-fitted
  const maxShift = R * 0.008;
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

function stripStudioWhite(
  sr: number,
  sg: number,
  sb: number,
  sa: number,
  dist: number,
  R: number,
  spec: WheelCircleSpec
): number {
  if (sa <= 0) return 0;
  const maxCh = Math.max(sr, sg, sb);
  const minCh = Math.min(sr, sg, sb);
  const sat = maxCh - minCh;
  if (dist > R * 0.74 && minCh > 135 && sat < 34) {
    return 0;
  }
  if (spec.cleanInnerR) {
    // Everything outside cleanInnerR is rim/tire: strip bright studio fringe cleanly
    if (minCh > 165 && sat < 24 && dist < R * (spec.cleanInnerR + 0.06)) {
      return 0;
    }
    if (sa < 220 && minCh > 180 && sat < 20) {
      return 0;
    }
    return sa;
  }
  if (!spec.preserveBrightSpokes) {
    if ((sa < 245 && minCh > 150 && sat < 28) || (minCh > 195 && sat < 22)) {
      return 0;
    }
  } else if (sa < 215 && minCh > 205 && sat < 18) {
    return 0;
  }
  return sa;
}

/**
 * Extracts the wheel from the original scooter PNG with crisp single-sector rotor/spoke
 * reconstruction (zero blurry 6-way averaging) and clean circular/knobby tire preservation.
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

  const isKnobby = Boolean(spec.preserveKnobby);
  const maxR = R * (isKnobby ? 1.018 : 0.996);
  const canvasRadius = R * (isKnobby ? 1.04 : 1.02);
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
  const outerRingSym = 12;
  const sampleC: [number, number, number, number] = [0, 0, 0, 0];
  const centerCleanR = R * ((spec.hubKeepR ?? 0.2) + 0.03);
  const cleanInnerPx = spec.cleanInnerR ? R * spec.cleanInnerR : 0;
  const tireSymStartR = cleanInnerPx > 0 ? cleanInnerPx : R * 0.72;
  const sectorStep = (Math.PI * 2) / symCount;
  const sectorCenterRad = ((spec.sectorDeg ?? 90) * Math.PI) / 180;
  const sectorStartRad = sectorCenterRad - sectorStep * 0.5;
  const useSharpSector = spec.sectorDeg !== undefined;

  for (let y = 0; y < size; y++) {
    const dy = y + 0.5 - half;
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - half;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) continue;

      const idx = (y * size + x) * 4;

      if (cleanInnerPx > 0 && dist < cleanInnerPx) {
        continue;
      }

      if (dist < centerCleanR) {
        out[idx] = 28;
        out[idx + 1] = 33;
        out[idx + 2] = 41;
        out[idx + 3] = 255;
        continue;
      }

      const baseAng = Math.atan2(dy, dx);
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      if (isKnobby) {
        // 18-fold crisp sector tiling from a 100% unoccluded clean tire/rim arc:
        // preserves sharp real knobby treads & colored rims while guaranteeing ZERO 8-мерка wobble,
        // ZERO bottom flat-spot, ZERO arm notches, and ZERO swingarm smudges!
        const knobbyFolds = 18;
        const kStep = (Math.PI * 2) / knobbyFolds;
        const kStart = sectorCenterRad - kStep * 0.5;
        const rawDelta = baseAng - kStart;
        const phase = ((rawDelta % kStep) + kStep) % kStep;
        const candAng = kStart + phase;
        const cdx = Math.cos(candAng) * dist * ellipseX;
        const cdy = Math.sin(candAng) * dist;
        const fx = cx + cdx;
        const fy = cy + cdy;
        if (fx >= 1 && fy >= 1 && fx < srcW - 2 && fy < srcH - 2) {
          sampleBilinear(srcData, srcW, srcH, fx, fy, sampleC);
          r = sampleC[0];
          g = sampleC[1];
          b = sampleC[2];
          a = stripStudioWhite(r, g, b, sampleC[3], dist, R, spec);

          // Tiny 2.2-degree edge crossfade across the sector seam so adjacent lugs join seamlessly
          const seamRad = 0.038;
          if (phase < seamRad || phase > kStep - seamRad) {
            const altAng = phase < seamRad ? candAng + kStep : candAng - kStep;
            const adx = Math.cos(altAng) * dist * ellipseX;
            const ady = Math.sin(altAng) * dist;
            const afx = cx + adx;
            const afy = cy + ady;
            if (afx >= 1 && afy >= 1 && afx < srcW - 2 && afy < srcH - 2) {
              const s2: [number, number, number, number] = [0, 0, 0, 0];
              sampleBilinear(srcData, srcW, srcH, afx, afy, s2);
              const a2 = stripStudioWhite(s2[0], s2[1], s2[2], s2[3], dist, R, spec);
              const t =
                phase < seamRad
                  ? (seamRad - phase) / (seamRad * 2)
                  : (phase - (kStep - seamRad)) / (seamRad * 2);
              const w1 = 1 - t;
              const totA = a * w1 + a2 * t;
              if (totA > 1) {
                r = (r * a * w1 + s2[0] * a2 * t) / totA;
                g = (g * a * w1 + s2[1] * a2 * t) / totA;
                b = (b * a * w1 + s2[2] * a2 * t) / totA;
                a = totA;
              } else {
                a = 0;
              }
            }
          }
        }
      } else if (useSharpSector && dist < tireSymStartR) {
        // Sharp single-sector extraction centered around clean unoccluded bottom sector (zero 6-way blur!)
        const rawDelta = baseAng - sectorStartRad;
        const phase = ((rawDelta % sectorStep) + sectorStep) % sectorStep;
        const candAng = sectorStartRad + phase;
        const cdx = Math.cos(candAng) * dist * ellipseX;
        const cdy = Math.sin(candAng) * dist;
        const fx = cx + cdx;
        const fy = cy + cdy;

        const candOcc =
          fx >= 1 && fy >= 1 && fx < srcW - 2 && fy < srcH - 2
            ? getOcclusion(cdx, cdy, dist, mask, 5.5, 0.24)
            : 1;

        if (candOcc <= 0.03) {
          sampleBilinear(srcData, srcW, srcH, fx, fy, sampleC);
          r = sampleC[0];
          g = sampleC[1];
          b = sampleC[2];
          a = stripStudioWhite(r, g, b, sampleC[3], dist, R, spec);

          // Tiny 3.5-degree edge crossfade right across the sector seam so repeats join invisibly
          const seamRad = 0.06;
          if (phase < seamRad || phase > sectorStep - seamRad) {
            const altAng = phase < seamRad ? candAng + sectorStep : candAng - sectorStep;
            const adx = Math.cos(altAng) * dist * ellipseX;
            const ady = Math.sin(altAng) * dist;
            const afx = cx + adx;
            const afy = cy + ady;
            if (
              afx >= 1 &&
              afy >= 1 &&
              afx < srcW - 2 &&
              afy < srcH - 2 &&
              getOcclusion(adx, ady, dist, mask, 5.5, 0.24) <= 0.03
            ) {
              const s2: [number, number, number, number] = [0, 0, 0, 0];
              sampleBilinear(srcData, srcW, srcH, afx, afy, s2);
              const a2 = stripStudioWhite(s2[0], s2[1], s2[2], s2[3], dist, R, spec);
              const t = phase < seamRad ? (seamRad - phase) / (seamRad * 2) : (phase - (sectorStep - seamRad)) / (seamRad * 2);
              const w1 = 1 - t;
              const totA = a * w1 + a2 * t;
              if (totA > 1) {
                r = (r * a * w1 + s2[0] * a2 * t) / totA;
                g = (g * a * w1 + s2[1] * a2 * t) / totA;
                b = (b * a * w1 + s2[2] * a2 * t) / totA;
                a = totA;
              } else {
                a = 0;
              }
            }
          }
        } else {
          // Fallback to cleanest unoccluded fold if primary sector hits a caliper/arm
          let bestOcc = 99;
          for (let k = 0; k < symCount; k++) {
            const altAng = baseAng + k * sectorStep;
            const adx = Math.cos(altAng) * dist * ellipseX;
            const ady = Math.sin(altAng) * dist;
            const afx = cx + adx;
            const afy = cy + ady;
            if (afx < 1 || afy < 1 || afx >= srcW - 2 || afy >= srcH - 2) continue;
            const occ = getOcclusion(adx, ady, dist, mask, 5.5, 0.24);
            if (occ < bestOcc) {
              bestOcc = occ;
              sampleBilinear(srcData, srcW, srcH, afx, afy, sampleC);
              r = sampleC[0];
              g = sampleC[1];
              b = sampleC[2];
              a = stripStudioWhite(r, g, b, sampleC[3], dist, R, spec);
              if (occ <= 0.03) break;
            }
          }
        }
      } else {
        const isOuterRing = dist >= tireSymStartR;
        const folds = isOuterRing ? outerRingSym : symCount;
        const step = (Math.PI * 2) / folds;

        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let sumA = 0;
        let validSamples = 0;

        let bestOcc = 99;
        let fbR = 0;
        let fbG = 0;
        let fbB = 0;
        let fbA = 0;

        for (let k = 0; k < folds; k++) {
          const candAng = baseAng + k * step;
          if (dist > R * 0.84) {
            const normDeg = (((candAng * 180) / Math.PI) % 360 + 360) % 360;
            if (normDeg > 66 && normDeg < 114) continue;
          }

          const cdx = Math.cos(candAng) * dist * ellipseX;
          const cdy = Math.sin(candAng) * dist;
          const fx = cx + cdx;
          const fy = cy + cdy;
          if (fx < 1 || fy < 1 || fx >= srcW - 2 || fy >= srcH - 2) continue;

          const candOcc = getOcclusion(cdx, cdy, dist, mask, 5.5, 0.24);
          sampleBilinear(srcData, srcW, srcH, fx, fy, sampleC);

          const sr = sampleC[0];
          const sg = sampleC[1];
          const sb = sampleC[2];
          const sa = stripStudioWhite(sr, sg, sb, sampleC[3], dist, R, spec);

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

        if (validSamples > 0 && sumA > 0.5) {
          r = sumR / sumA;
          g = sumG / sumA;
          b = sumB / sumA;
          a = sumA / validSamples;
          if (isOuterRing && dist < maxR - 2.0 && a > 120) {
            a = Math.min(255, a * 1.18);
          }
        } else if (bestOcc < 99) {
          r = fbR;
          g = fbG;
          b = fbB;
          a = fbA;
        }
      }

      if (!isKnobby && dist > maxR - 1.8) {
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
  const punchR = R * (spec.preserveKnobby ? 1.095 : 1.068);
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

function parseHexRgb(hex: string | undefined): [number, number, number] | null {
  if (!hex || typeof hex !== 'string') return null;
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixRgb(
  r: number,
  g: number,
  b: number,
  tr: number,
  tg: number,
  tb: number,
  weight: number
): [number, number, number] {
  const w = Math.max(0, Math.min(1, weight));
  return [
    Math.round(r + (tr - r) * w),
    Math.round(g + (tg - g) * w),
    Math.round(b + (tb - b) * w),
  ];
}

function paintWithTone(
  r: number,
  g: number,
  b: number,
  targetRgb: [number, number, number],
  lum: number,
  norm: number,
  blendWeight: number,
  specularBoost = 0.28
): [number, number, number] {
  const tLum = (0.299 * targetRgb[0] + 0.587 * targetRgb[1] + 0.114 * targetRgb[2]) / 255;
  // Adaptive shadow floor so bright paints (white, yellow, cyan, red) stay crisp & bright on dark anodized frames,
  // while dark paints (black, graphite) keep deep satin shadows
  const shadowFloor = 0.24 + 0.52 * Math.min(1, tLum * 1.15);
  const highlightSpan = 1.06 - shadowFloor;
  const clampedNorm = Math.max(0, Math.min(1.25, norm));
  const shade = shadowFloor + highlightSpan * Math.pow(Math.min(1, clampedNorm), 0.72) + Math.max(0, clampedNorm - 1) * 0.18;
  // Crisp white specular edge sheen on metallic bevels
  const spec = lum > 135 ? Math.min(0.42, ((lum - 135) / 120) * specularBoost) : 0;
  const tr = Math.min(255, targetRgb[0] * shade + (255 - targetRgb[0] * shade) * spec);
  const tg = Math.min(255, targetRgb[1] * shade + (255 - targetRgb[1] * shade) * spec);
  const tb = Math.min(255, targetRgb[2] * shade + (255 - targetRgb[2] * shade) * spec);
  return mixRgb(r, g, b, tr, tg, tb, blendWeight);
}

export function applyScooterPaintToPixels(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  id: ScooterId,
  paint?: ScooterPaint
) {
  if (!paint) return;
  const spec = getScooter(id);
  const singleMode = spec.paintMode === 'single';
  const pRgb = parseHexRgb(paint.primary);
  const sRgb = singleMode ? null : parseHexRgb(paint.secondary);
  if (!pRgb && !sRgb) return;

  const cfg = SCOOTER_WHEEL_CONFIGS[id];
  const rCx = cfg ? cfg.rear.cx * w : -9999;
  const rCy = cfg ? cfg.rear.cy * h : -9999;
  const rRad = cfg ? cfg.rear.rH * h * 1.04 : 0;
  const fCx = cfg ? cfg.front.cx * w : -9999;
  const fCy = cfg ? cfg.front.cy * h : -9999;
  const fRad = cfg ? cfg.front.rH * h * 1.04 : 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      if (a < 20) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const diff = mx - mn;
      const sat = mx > 0 ? diff / mx : 0;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Smooth chromatic weight down to anti-aliased fringe (eliminates orange/purple outline halos)
      const chromaDiffW = Math.max(0, Math.min(1, (diff - 10) / 22));
      const chromaSatW = Math.max(0, Math.min(1, (sat - 0.08) / 0.14));
      const chromaValW = Math.max(0, Math.min(1, (mx - 24) / 26));
      const chromaStrength = chromaDiffW * chromaSatW * chromaValW;
      const isChromatic = chromaStrength > 0.18;

      if (singleMode) {
        // Kugoo G2 Pro: 1 custom frame/bugel color (chromatic purple areas)
        if (pRgb && isChromatic) {
          const val = Math.max(0, Math.min(1.15, (mx - 24) / 210));
          const [nr, ng, nb] = paintWithTone(r, g, b, pRgb, lum, val, chromaStrength, 0.34);
          data[idx] = nr;
          data[idx + 1] = ng;
          data[idx + 2] = nb;
        }
        continue;
      }

      // Skip F3's glowing cyan underglow strip so only painted accents change
      if (spec.skipCyanLed && chromaStrength > 0.12 && g > r + 35 && b > r + 40 && b > 110) {
        continue;
      }

      // Secondary accent color (chromatic parts everywhere including rim stripes)
      if (sRgb && isChromatic) {
        const val = Math.max(0, Math.min(1.15, (mx - 24) / 210));
        const [nr, ng, nb] = paintWithTone(r, g, b, sRgb, lum, val, chromaStrength, 0.34);
        data[idx] = nr;
        data[idx + 1] = ng;
        data[idx + 2] = nb;
        continue;
      }

      // Never recolor black rubber tires inside wheel circles with primary body paint
      const inWheel =
        (cfg &&
          (Math.hypot(x - rCx, y - rCy) <= rRad || Math.hypot(x - fCx, y - fCy) <= fRad)) ||
        false;
      if (inWheel) continue;

      if (spec.twoToneMono) {
        // Two-tone monochrome sprites (C3, Sur-Ron, Stark VARG):
        // lum 18..118 = primary body/frame; lum 110..248 = secondary fairing/silver/fork
        if (pRgb && chromaStrength < 0.35 && lum >= 16 && lum < 120) {
          const norm = Math.max(0, Math.min(1.2, (lum - 14) / 86));
          const edgeLow = Math.min(1, (lum - 16) / 14);
          const edgeHigh = lum > 106 ? Math.max(0, (120 - lum) / 14) : 1;
          const [nr, ng, nb] = paintWithTone(
            r,
            g,
            b,
            pRgb,
            lum,
            norm,
            edgeLow * edgeHigh * (1 - chromaStrength * 0.6),
            0.24
          );
          data[idx] = nr;
          data[idx + 1] = ng;
          data[idx + 2] = nb;
        } else if (sRgb && chromaStrength < 0.35 && lum >= 108 && lum <= 250) {
          const norm = Math.max(0, Math.min(1.2, (lum - 98) / 132));
          const edgeLow = lum < 122 ? Math.max(0, (lum - 108) / 14) : 1;
          const [nr, ng, nb] = paintWithTone(
            r,
            g,
            b,
            sRgb,
            lum,
            norm,
            edgeLow * (1 - chromaStrength * 0.6),
            0.3
          );
          data[idx] = nr;
          data[idx + 1] = ng;
          data[idx + 2] = nb;
        }
        continue;
      }

      // Standard dual-color scooter/pitbike: primary paints neutral frame/body/stem/fenders (lum 17..235)
      if (pRgb && chromaStrength < 0.45 && lum >= 17 && lum <= 238) {
        const norm = Math.max(0, Math.min(1.22, (lum - 16) / 96));
        const edgeLow = Math.min(1, (lum - 17) / 12);
        const edgeHigh = lum > 214 ? Math.max(0, (238 - lum) / 24) : 1;
        const neutralMask = 1 - chromaStrength * 0.7;
        const [nr, ng, nb] = paintWithTone(
          r,
          g,
          b,
          pRgb,
          lum,
          norm,
          edgeLow * edgeHigh * neutralMask,
          0.26
        );
        data[idx] = nr;
        data[idx + 1] = ng;
        data[idx + 2] = nb;
      }
    }
  }
}

export function renderPaintedScooterCanvas(
  img: HTMLImageElement,
  id: ScooterId,
  paint?: ScooterPaint,
  targetCanvas?: HTMLCanvasElement | null
): HTMLCanvasElement | null {
  if (!img || !img.naturalWidth || !img.naturalHeight) return null;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const cv = targetCanvas ?? document.createElement('canvas');
  if (cv.width !== w) cv.width = w;
  if (cv.height !== h) cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  if (paint && (paint.primary || paint.secondary)) {
    const imgData = ctx.getImageData(0, 0, w, h);
    applyScooterPaintToPixels(imgData.data, w, h, id, paint);
    ctx.putImageData(imgData, 0, 0);
  }
  return cv;
}

export function prepareScooterWheelRig(
  id: ScooterId,
  img: HTMLImageElement,
  paint?: ScooterPaint
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
    if (paint && (paint.primary || paint.secondary)) {
      applyScooterPaintToPixels(srcImg.data, w, h, id, paint);
    }
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
