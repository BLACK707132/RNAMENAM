import { useEffect, useRef } from 'react';
import { getScooter, SCOOTERS, type ScooterId, type ScooterSpec } from '../data/scooters';
import { getHelmet, type HelmetId } from '../data/helmets';
import { drawStyledRider, getOutfit, type OutfitId } from '../data/outfits';
import { prepareScooterWheelRig, type PreparedScooterRig } from '../utils/wheelRig';
import { sound } from '../utils/sound';

export type GameMode = 'menu' | 'shop' | 'helmets' | 'outfits' | 'play' | 'crash';

interface FloatingMsg {
  t: string;
  l: number;
  color?: string;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface DustPuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  grow: number;
  life: number;
  maxLife: number;
}

interface Pt {
  x: number;
  y: number;
}

interface RiderPose {
  seated: boolean;
  hip: Pt;
  shoulder: Pt;
  head: Pt;
  backKnee: Pt;
  backFoot: Pt;
  frontKnee: Pt;
  frontFoot: Pt;
  backElbow: Pt;
  backHand: Pt;
  frontElbow: Pt;
  frontHand: Pt;
}

interface RagdollNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  invMass: number;
  r: number; // collision radius in screen px
}

interface RagdollLink {
  a: number;
  b: number;
  len: number;
  minOnly?: boolean;
  stiffness: number;
}

interface RagdollState {
  active: boolean;
  seated: boolean;
  nodes: RagdollNode[];
  links: RagdollLink[];
}

interface CrashScooter {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // degrees, matches sim.a convention
  angVel: number; // deg/s
  scrapeTimer: number;
}

interface GameCanvasProps {
  mode: GameMode;
  scooterId: ScooterId;
  helmetId: HelmetId;
  outfitId: OutfitId;
  coins: number;
  bestRun: number;
  vip: boolean;
  gasRef: React.MutableRefObject<boolean>;
  brakeRef: React.MutableRefObject<boolean>;
  oneHandRef: React.MutableRefObject<boolean>;
  kneeRef: React.MutableRefObject<boolean>;
  stemFootRef: React.MutableRefObject<boolean>;
  runTrigger: number;
  onBankCoins: (amount: number) => void;
  onNewBest: (best: number) => void;
  onCrashFinish: (lostCoins: number) => void;
  onCrashStart: () => void;
}

const BUILDINGS = Array.from({ length: 22 }, (_, i) => ({
  w: 68 + ((i * 37) % 5) * 18,
  h: 135 + ((i * 53) % 7) * 28,
  shade: i % 3 === 0 ? '#4d6b80' : i % 3 === 1 ? '#56768c' : '#466378',
}));

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  pts: number[],
  color: string,
  width: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) {
    ctx.lineTo(pts[i], pts[i + 1]);
  }
  ctx.stroke();
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  r: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();
}

export function GameCanvas({
  mode,
  scooterId,
  helmetId,
  outfitId,
  coins,
  bestRun,
  vip,
  gasRef,
  brakeRef,
  oneHandRef,
  kneeRef,
  stemFootRef,
  runTrigger,
  onBankCoins,
  onNewBest,
  onCrashFinish,
  onCrashStart,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Partial<Record<ScooterId, HTMLImageElement>>>({});
  const rigsRef = useRef<Partial<Record<ScooterId, PreparedScooterRig>>>({});

  // Keep latest props in refs for 60fps loop without restarting rAF
  const modeRef = useRef<GameMode>(mode);
  const scooterIdRef = useRef<ScooterId>(scooterId);
  const helmetIdRef = useRef<HelmetId>(helmetId);
  const outfitIdRef = useRef<OutfitId>(outfitId);
  const coinsRef = useRef<number>(coins);
  const bestRunRef = useRef<number>(bestRun);
  const vipRef = useRef<boolean>(vip);
  const onBankCoinsRef = useRef(onBankCoins);
  const onNewBestRef = useRef(onNewBest);
  const onCrashFinishRef = useRef(onCrashFinish);
  const onCrashStartRef = useRef(onCrashStart);

  modeRef.current = mode;
  scooterIdRef.current = scooterId;
  helmetIdRef.current = helmetId;
  outfitIdRef.current = outfitId;
  coinsRef.current = coins;
  bestRunRef.current = bestRun;
  vipRef.current = vip;
  onBankCoinsRef.current = onBankCoins;
  onNewBestRef.current = onNewBest;
  onCrashFinishRef.current = onCrashFinish;
  onCrashStartRef.current = onCrashStart;

  // Mutable simulation state
  const simRef = useRef({
    W: 800,
    H: 600,
    u: 1,
    t: 0,
    a: 0,
    w: 0,
    pend: 0,
    lost: 0,
    wheelieM: 0,
    off: 0,
    rearSpin: 0,
    frontSpin: 0,
    frontSpinVel: 0,
    spd: 90,
    kmh: 12,
    oh: 0,
    ohTime: 0,
    knee: 0,
    stem: 0,
    ct: 0,
    shown: false,
    msgs: [] as FloatingMsg[],
    sparks: [] as Spark[],
    dust: [] as DustPuff[],
    shake: 0,
    slowMo: 0,
    bugelScraping: false,
    bugelContactX: 0,
    bugelContactY: 0,
    bugelScrapeGlow: 0,
    ragdoll: { active: false, seated: false, nodes: [], links: [] } as RagdollState,
    crashScooter: {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      angVel: 0,
      scrapeTimer: 0,
    } as CrashScooter,
  });

  // Preload all transparent scooter sprites & build real-pixel spinning wheel rigs
  useEffect(() => {
    SCOOTERS.forEach((sc) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        imagesRef.current[sc.id] = img;
        const rig = prepareScooterWheelRig(sc.id, img);
        if (rig) rigsRef.current[sc.id] = rig;
      };
      img.onerror = () => {
        const fb = new Image();
        fb.onload = () => {
          imagesRef.current[sc.id] = fb;
        };
        fb.src = sc.originalSrc;
      };
      img.src = sc.spriteSrc;
    });
  }, []);

  // Reset run physics when starting a new run or returning to menu/shop
  useEffect(() => {
    const sim = simRef.current;
    if (mode === 'play') {
      sim.a = 0;
      sim.w = 0;
      sim.pend = 0;
      sim.lost = 0;
      sim.wheelieM = 0;
      sim.oh = 0;
      sim.ohTime = 0;
      sim.knee = 0;
      sim.stem = 0;
      sim.ct = 0;
      sim.shown = false;
      sim.msgs = [];
      sim.sparks = [];
      sim.dust = [];
      sim.shake = 0;
      sim.slowMo = 0;
      sim.ragdoll.active = false;
      sim.crashScooter.active = false;
    } else if (mode === 'menu' || mode === 'shop' || mode === 'helmets' || mode === 'outfits') {
      sim.a = 0;
      sim.w = 0;
      sim.pend = 0;
      sim.wheelieM = 0;
      sim.oh = 0;
      sim.ohTime = 0;
      sim.knee = 0;
      sim.stem = 0;
      sim.shown = false;
      sim.msgs = [];
      sim.sparks = [];
      sim.dust = [];
      sim.shake = 0;
      sim.slowMo = 0;
      sim.ragdoll.active = false;
      sim.crashScooter.active = false;
    }
  }, [mode, runTrigger]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = (cv.width = Math.max(1, Math.floor(cv.clientWidth * dpr)));
      const H = (cv.height = Math.max(1, Math.floor(cv.clientHeight * dpr)));
      simRef.current.W = W;
      simRef.current.H = H;
      simRef.current.u = Math.max(0.25, Math.min(W / 430, H / 800));
    };

    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    let lastTime = 0;

    const getMetrics = (s: ScooterSpec) => {
      const drawH = s.spriteH;
      const drawW = drawH * s.aspect;
      const imgX = -s.rearX * drawW;
      const imgY = -s.rearY * drawH;
      const wheelBottom = (s.bottomY - s.rearY) * drawH;
      const frontWheelX = imgX + s.frontX * drawW;
      const frontWheelY = (s.frontY - s.rearY) * drawH;
      const deckY = imgY + s.deckY * drawH;
      const backFootX = imgX + s.backFootX * drawW;
      const frontFootX = imgX + s.frontFootX * drawW;
      const gripX = imgX + s.gripX * drawW;
      const gripY = imgY + s.gripY * drawH;
      const seatX = s.seatX !== undefined ? imgX + s.seatX * drawW : (backFootX + frontFootX) * 0.48;
      const seatY = s.seatY !== undefined ? imgY + s.seatY * drawH : deckY - 70;
      return {
        drawW,
        drawH,
        imgX,
        imgY,
        wheelBottom,
        frontWheelX,
        frontWheelY,
        deckY,
        backFootX,
        frontFootX,
        gripX,
        gripY,
        seatX,
        seatY,
      };
    };

    const getRiderPose = (
      s: ScooterSpec,
      m: ReturnType<typeof getMetrics>,
      leanDeg = 0,
      oneHand = 0,
      ohTime = 0,
      knee = 0,
      stemFoot = 0
    ): RiderPose => {
      // Smooth Wheelie Life style ease & natural sweeping arm/leg arcs
      const oh = Math.max(0, Math.min(1, oneHand));
      const ohEase = oh * oh * (3 - 2 * oh);
      const kn = Math.max(0, Math.min(1, knee));
      const knEase = kn * kn * (3 - 2 * kn);
      const st = Math.max(0, Math.min(1, stemFoot));
      const stEase = st * st * (3 - 2 * st);
      const swingArc = Math.sin(ohEase * Math.PI);
      const liftArc = Math.sin(stEase * Math.PI);
      const waveY = Math.sin(ohTime * 6.5) * 4.5 * ohEase;
      const waveX = Math.cos(ohTime * 3.8) * 3.2 * ohEase;

      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

      if (s.seated) {
        // Seated moto / One-Knee on seat / Foot on Steering Column (рулевая колонка)
        const hipX = m.seatX - ohEase * 4 + knEase * 4 - stEase * 4;
        const hipY = m.seatY - 5 - knEase * 27 - stEase * 2;
        const baseKneeX = hipX + (m.frontFootX - hipX) * 0.72 + 13;
        const baseKneeY = m.seatY - 5 + (m.deckY - (m.seatY - 5)) * 0.36;

        const backKneeX = lerp(baseKneeX - 4, m.backFootX + 10, knEase);
        const backKneeY = lerp(baseKneeY, m.deckY - 38, knEase);
        const backFootX = lerp(m.backFootX, m.backFootX - 6, knEase);
        const backFootY = m.deckY - 2;

        // Steering column anchor (higher & deeper onto the front steering tube, below handlebars/display)
        const stemBaseX = m.frontWheelX - 10;
        const stemBaseY = m.deckY - 22;
        const stemFootX = lerp(m.gripX, stemBaseX, 0.34) + 2;
        const stemFootY = lerp(m.gripY, stemBaseY, 0.34);

        const knFrontKneeX = lerp(baseKneeX, m.seatX + 12, knEase);
        const knFrontKneeY = lerp(baseKneeY + 2, m.seatY - 5, knEase);
        const knFrontFootX = lerp(m.frontFootX, m.seatX - 22, knEase);
        const knFrontFootY = lerp(m.deckY - 2, m.seatY - 10, knEase);

        const frontKneeX = lerp(knFrontKneeX, lerp(hipX, stemFootX, 0.5) + 6, stEase);
        const frontKneeY = lerp(knFrontKneeY, stemFootY - 14, stEase);
        const frontFootX = lerp(knFrontFootX, stemFootX, stEase) - liftArc * 5;
        const frontFootY = lerp(knFrontFootY, stemFootY, stEase) - liftArc * 10;

        // Laid-back Wheelie Life swagger lean while riding one-handed or foot-on-stem
        const shoulderX = hipX + 17 + leanDeg * 0.16 - ohEase * 13 - knEase * 2 - stEase * 5;
        const shoulderY = Math.min(hipY - 56, m.gripY + 2 - knEase * 16) + ohEase * 2;
        const headX = shoulderX + 5 - ohEase * 2 - stEase * 1.5;
        const headY = shoulderY - 26;

        // Supporting arm tightens naturally on the handlebar
        const backElbowX = (shoulderX + m.gripX) * 0.5 + 1;
        const backElbowY = (shoulderY + m.gripY) * 0.5 + (8 - ohEase * 4);

        const baseElbowX = (shoulderX + m.gripX) * 0.5 - 2;
        const baseElbowY = (shoulderY + m.gripY) * 0.5 + 11;
        const ohElbowX = shoulderX - 26;
        const ohElbowY = shoulderY - 14 + waveY * 0.45;
        const ohHandX = shoulderX - 43 + waveX;
        const ohHandY = shoulderY - 45 + waveY;

        return {
          seated: true,
          hip: { x: hipX, y: hipY },
          shoulder: { x: shoulderX, y: shoulderY },
          head: { x: headX, y: headY },
          backKnee: { x: backKneeX, y: backKneeY },
          backFoot: { x: backFootX, y: backFootY },
          frontKnee: { x: frontKneeX, y: frontKneeY },
          frontFoot: { x: frontFootX, y: frontFootY },
          backElbow: { x: backElbowX, y: backElbowY },
          backHand: { x: m.gripX, y: m.gripY },
          frontElbow: {
            x: baseElbowX + (ohElbowX - baseElbowX) * ohEase - swingArc * 6,
            y: baseElbowY + (ohElbowY - baseElbowY) * ohEase + swingArc * 12,
          },
          frontHand: {
            x: m.gripX + (ohHandX - m.gripX) * ohEase - swingArc * 10,
            y: m.gripY + (ohHandY - m.gripY) * ohEase + swingArc * 18,
          },
        };
      }

      const stemH = Math.max(120, m.deckY - m.gripY);
      const standHipX = (m.backFootX + m.frontFootX) * 0.48 - ohEase * 5 - stEase * 7;
      const standHipY = m.deckY - stemH * 0.59 + ohEase * 2 - stEase * 2;
      // Dropping onto one knee: hips drop lower over the rear deck while torso stays upright
      const hipX = lerp(standHipX, m.backFootX + 4 - ohEase * 4, knEase);
      const hipY = lerp(standHipY, m.deckY - stemH * 0.34 + ohEase * 2, knEase);

      // Far leg stays planted firmly on the rear tail for wheelie balance
      const backFootX = lerp(m.backFootX - stEase * 5, m.backFootX - 8, knEase);
      const backFootY = m.deckY - 3;
      const backKneeX = lerp(m.backFootX + 10 - ohEase * 2 - stEase * 3, m.backFootX + 14, knEase);
      const backKneeY = lerp(m.deckY - stemH * 0.31 + stEase * 2, m.deckY - stemH * 0.25, knEase);

      // Steering column / gooseneck target («рулевая / гусак» — higher & deeper into the steering shaft, clearly below БК)
      const stemBaseX = m.frontWheelX - 14;
      const stemBaseY = m.deckY - 6;
      const stemFootX = lerp(m.gripX, stemBaseX, 0.36) + 2;
      const stemFootY = lerp(m.gripY, stemBaseY, 0.36);

      // Near leg: normal standing, one-knee on deck, or lifted & planted squarely onto the steering column
      const knFrontKneeX = lerp(m.frontFootX + 2 - ohEase * 2, m.frontFootX - 5, knEase);
      const knFrontKneeY = lerp(m.deckY - stemH * 0.30, m.deckY - 6, knEase);
      const knFrontFootX = lerp(m.frontFootX, m.backFootX + 4, knEase);
      const knFrontFootY = lerp(m.deckY - 3, m.deckY - 13, knEase);

      const frontKneeX = lerp(knFrontKneeX, lerp(hipX, stemFootX, 0.46) + 10, stEase);
      const frontKneeY = lerp(knFrontKneeY, Math.min(hipY - 12, stemFootY - 16), stEase);
      const frontFootX = lerp(knFrontFootX, stemFootX, stEase) - liftArc * 5;
      const frontFootY = lerp(knFrontFootY, stemFootY, stEase) - liftArc * 10;

      // Classic Wheelie Life laid-back balance-point torso lean
      const shoulderX = lerp(
        standHipX + 4 + leanDeg * 0.14 - ohEase * 15 - stEase * 6,
        hipX + 10 + leanDeg * 0.12 - ohEase * 12,
        knEase
      );
      const shoulderY = lerp(
        m.deckY - stemH * 1.03 + ohEase * 3 + stEase * 2,
        m.deckY - stemH * 0.82 + ohEase * 3,
        knEase
      );
      const headX = shoulderX + 4 - ohEase * 2.5 - stEase * 1.5;
      const headY = shoulderY - 27;

      // Left/supporting arm locks straighter onto handlebar grip while leaning back
      const backElbowX = (shoulderX + m.gripX) * 0.5 + 1;
      const backElbowY = (shoulderY + m.gripY) * 0.5 + (8 - ohEase * 4.5 - stEase * 2);

      const baseElbowX = (shoulderX + m.gripX) * 0.5 - 3;
      const baseElbowY = (shoulderY + m.gripY) * 0.5 + (12 - stEase * 2);
      // High, wide Wheelie Life One-Hander arm throw & chill float
      const ohElbowX = shoulderX - 27;
      const ohElbowY = shoulderY - 14 + waveY * 0.45;
      const ohHandX = shoulderX - 44 + waveX;
      const ohHandY = shoulderY - 47 + waveY;

      return {
        seated: false,
        hip: { x: hipX, y: hipY },
        shoulder: { x: shoulderX, y: shoulderY },
        head: { x: headX, y: headY },
        backKnee: { x: backKneeX, y: backKneeY },
        backFoot: { x: backFootX, y: backFootY },
        frontKnee: { x: frontKneeX, y: frontKneeY },
        frontFoot: { x: frontFootX, y: frontFootY },
        backElbow: { x: backElbowX, y: backElbowY },
        backHand: { x: m.gripX, y: m.gripY },
        frontElbow: {
          x: baseElbowX + (ohElbowX - baseElbowX) * ohEase - swingArc * 6,
          y: baseElbowY + (ohElbowY - baseElbowY) * ohEase + swingArc * 12,
        },
        frontHand: {
          x: m.gripX + (ohHandX - m.gripX) * ohEase - swingArc * 10,
          y: m.gripY + (ohHandY - m.gripY) * ohEase + swingArc * 18,
        },
      };
    };

    const drawRider = (
      s: ScooterSpec,
      m: ReturnType<typeof getMetrics>,
      wheelieAngle = 0,
      oneHand = 0,
      ohTime = 0,
      knee = 0,
      stemFoot = 0
    ) => {
      const leanDeg = Math.min(25, wheelieAngle * 0.35);
      const p = getRiderPose(s, m, leanDeg, oneHand, ohTime, knee, stemFoot);
      const kn = Math.max(0, Math.min(1, knee));
      const knEase = kn * kn * (3 - 2 * kn);
      const st = Math.max(0, Math.min(1, stemFoot));
      const stEase = st * st * (3 - 2 * st);
      // Counter-rotate head forward so rider looks FORWARD down the road while doing a wheelie (not backward/up!)
      const wheelieRad = (Math.max(0, wheelieAngle) * Math.PI) / 180;
      const lookForward = Math.min(1.42, wheelieRad * 0.9);
      drawStyledRider(
        ctx,
        {
          ...p,
          headAngle: lookForward + 0.04 * knEase + 0.03 * stEase,
          flatFeet: true,
          kneeling: knEase,
          frontFootAngle: stEase > 0.01 ? -0.52 * stEase : undefined,
        },
        1.16,
        getOutfit(outfitIdRef.current),
        s.accent,
        getHelmet(helmetIdRef.current)
      );
    };

    const emitDust = (x: number, y: number, count: number, spread = 1) => {
      const sim = simRef.current;
      const u = sim.u;
      for (let i = 0; i < count; i++) {
        sim.dust.push({
          x: x + (Math.random() - 0.5) * 14 * u * spread,
          y: y - Math.random() * 4 * u,
          vx: ((Math.random() - 0.5) * 95 - 35) * u * spread,
          vy: -(25 + Math.random() * 75) * u * spread,
          r: (5 + Math.random() * 7) * u,
          grow: (18 + Math.random() * 16) * u,
          life: 0.38 + Math.random() * 0.28,
          maxLife: 0.66,
        });
      }
    };

    const emitSparks = (x: number, y: number, count: number, dirX = -1) => {
      const sim = simRef.current;
      const u = sim.u;
      for (let i = 0; i < count; i++) {
        const colors = ['#fff5b8', '#ffd34d', '#ff7a1a', '#ff4d2e'];
        sim.sparks.push({
          x: x + (Math.random() - 0.5) * 6 * u,
          y: y - 2 * u,
          vx: (dirX * (70 + Math.random() * 180) + (Math.random() - 0.5) * 90) * u,
          vy: -(75 + Math.random() * 195) * u,
          life: 0.24 + Math.random() * 0.28,
          maxLife: 0.52,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const spawnCrashPhysics = (s: ScooterSpec, m: ReturnType<typeof getMetrics>) => {
      const sim = simRef.current;
      const { W, H, u } = sim;
      const ry = H * 0.64;
      const pivotX = W * 0.36;
      const pivotY = ry - m.wheelBottom * u;
      const rad = (-sim.a * Math.PI) / 180;
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);

      const toWorld = (pt: Pt): Pt => ({
        x: pivotX + (pt.x * cosR - pt.y * sinR) * u,
        y: pivotY + (pt.x * sinR + pt.y * cosR) * u,
      });

      const pose = getRiderPose(
        s,
        m,
        Math.min(25, sim.a * 0.35),
        sim.oh,
        sim.ohTime,
        sim.knee,
        sim.stem
      );
      const pts: Pt[] = [
        toWorld(pose.hip),        // 0
        toWorld(pose.shoulder),   // 1
        toWorld(pose.head),       // 2
        toWorld(pose.backKnee),   // 3
        toWorld(pose.backFoot),   // 4
        toWorld(pose.frontKnee),  // 5
        toWorld(pose.frontFoot),  // 6
        toWorld(pose.backElbow),  // 7
        toWorld(pose.backHand),   // 8
        toWorld(pose.frontElbow), // 9
        toWorld(pose.frontHand),  // 10
      ];

      const invMasses = [0.45, 0.52, 0.72, 1.0, 1.25, 1.0, 1.25, 1.2, 1.45, 1.2, 1.45];
      const radii = [11, 11, 14.5, 6.5, 6, 6.5, 6, 5.5, 5, 5.5, 5];

      // Center of mass for natural backward tumble angular impulse
      const hipW = pts[0];
      const baseVx = -(95 + Math.min(60, sim.spd * 0.14)) * u;
      const baseVy = -(175 + Math.min(80, Math.abs(sim.w) * 0.65)) * u;
      const tumbleAngVel = -5.6; // rad/s backward flip

      const nodes: RagdollNode[] = pts.map((pt, idx) => {
        const rx = pt.x - hipW.x;
        const ryOff = pt.y - hipW.y;
        // Tangential velocity from backward flip around pelvis + slight natural limb scatter
        const jitterX = (Math.random() - 0.5) * 32 * u;
        const jitterY = (Math.random() - 0.5) * 28 * u;
        return {
          x: pt.x,
          y: pt.y,
          vx: baseVx - tumbleAngVel * ryOff + jitterX,
          vy: baseVy + tumbleAngVel * rx + jitterY,
          invMass: invMasses[idx],
          r: radii[idx] * u * 1.16,
        };
      });

      const dist = (i: number, j: number) => Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      const links: RagdollLink[] = [
        // Rigid skeleton bones
        { a: 0, b: 1, len: dist(0, 1), stiffness: 1 }, // hip -> shoulder
        { a: 1, b: 2, len: dist(1, 2), stiffness: 1 }, // shoulder -> head
        { a: 0, b: 3, len: dist(0, 3), stiffness: 1 }, // hip -> backKnee
        { a: 3, b: 4, len: dist(3, 4), stiffness: 1 }, // backKnee -> backFoot
        { a: 0, b: 5, len: dist(0, 5), stiffness: 1 }, // hip -> frontKnee
        { a: 5, b: 6, len: dist(5, 6), stiffness: 1 }, // frontKnee -> frontFoot
        { a: 1, b: 7, len: dist(1, 7), stiffness: 1 }, // shoulder -> backElbow
        { a: 7, b: 8, len: dist(7, 8), stiffness: 1 }, // backElbow -> backHand
        { a: 1, b: 9, len: dist(1, 9), stiffness: 1 }, // shoulder -> frontElbow
        { a: 9, b: 10, len: dist(9, 10), stiffness: 1 }, // frontElbow -> frontHand
        // Soft anatomical anti-collapse bracing (keeps spine/neck/limbs bending organically)
        { a: 0, b: 2, len: dist(0, 2) * 0.78, minOnly: true, stiffness: 0.4 },
        { a: 1, b: 3, len: dist(1, 3) * 0.55, minOnly: true, stiffness: 0.2 },
        { a: 1, b: 5, len: dist(1, 5) * 0.55, minOnly: true, stiffness: 0.2 },
      ];

      sim.ragdoll = {
        active: true,
        seated: pose.seated,
        nodes,
        links,
      };

      // Launch scooter forward & upward out from under the rider (authentic loop-out!)
      sim.crashScooter = {
        active: true,
        x: pivotX,
        y: pivotY,
        vx: (118 + Math.min(115, sim.spd * 0.28)) * u,
        vy: -205 * u,
        angle: sim.a,
        angVel: 255 + Math.random() * 65,
        scrapeTimer: 0,
      };

      sim.shake = 7.5 * u;
      sim.slowMo = 0.22;
      emitSparks(pivotX, ry, 10, -1);
      emitDust(pivotX, ry, 5, 1.1);
    };

    const drawRagdoll = (s: ScooterSpec, rag: RagdollState) => {
      if (!rag.active || rag.nodes.length < 11) return;
      const u = simRef.current.u;
      const ry = simRef.current.H * 0.64;
      const [
        hip,
        shoulder,
        head,
        backKnee,
        backFoot,
        frontKnee,
        frontFoot,
        backElbow,
        backHand,
        frontElbow,
        frontHand,
      ] = rag.nodes;

      // Dynamic ground shadow beneath the tumbling ragdoll
      let minX = hip.x;
      let maxX = hip.x;
      let minDistY = 9999;
      for (const n of rag.nodes) {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        const d = Math.max(0, ry - n.y);
        if (d < minDistY) minDistY = d;
      }
      const shadowAlpha = Math.max(0.1, 0.34 - (minDistY / (220 * u)) * 0.24);
      ctx.fillStyle = `rgba(0,0,0,${shadowAlpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(
        (minX + maxX) * 0.5,
        ry + 4 * u,
        Math.max(24 * u, (maxX - minX) * 0.56),
        7 * u,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Render articulated ragdoll wearing the exact equipped streetwear outfit + helmet
      const neckAngle = Math.atan2(head.y - shoulder.y, head.x - shoulder.x) + Math.PI / 2;
      drawStyledRider(
        ctx,
        {
          hip,
          shoulder,
          head,
          backKnee,
          backFoot,
          frontKnee,
          frontFoot,
          backElbow,
          backHand,
          frontElbow,
          frontHand,
          headAngle: neckAngle,
          flatFeet: false,
        },
        u * 1.16,
        getOutfit(outfitIdRef.current),
        s.accent,
        getHelmet(helmetIdRef.current)
      );
    };

    const drawScooterAndRider = (s: ScooterSpec, withRider: boolean, wheelieAngle: number) => {
      const m = getMetrics(s);
      const sim = simRef.current;
      const rig = rigsRef.current[s.id];
      const sprite = imagesRef.current[s.id];

      // Draw real-pixel spinning wheels BEHIND the real swingarms, forks & scooter body!
      if (rig) {
        ctx.save();
        if (s.baseTiltDeg !== 0) {
          ctx.rotate((s.baseTiltDeg * Math.PI) / 180);
        }

        // 1) Real spinning rear wheel
        const rCx = m.imgX + rig.rear.cx * m.drawW;
        const rCy = m.imgY + rig.rear.cy * m.drawH;
        const rDraw = rig.rear.rH * m.drawH * rig.rear.padScale;
        ctx.save();
        ctx.translate(rCx, rCy);
        ctx.rotate(sim.rearSpin);
        ctx.drawImage(rig.rearWheel, -rDraw, -rDraw, rDraw * 2, rDraw * 2);
        ctx.restore();

        // 2) Real spinning front wheel
        const fCx = m.imgX + rig.front.cx * m.drawW;
        const fCy = m.imgY + rig.front.cy * m.drawH;
        const fDraw = rig.front.rH * m.drawH * rig.front.padScale;
        ctx.save();
        ctx.translate(fCx, fCy);
        ctx.rotate(sim.frontSpin);
        ctx.drawImage(rig.frontWheel, -fDraw, -fDraw, fDraw * 2, fDraw * 2);
        ctx.restore();

        // 3) Real scooter body, swingarms, forks, calipers & fenders ON TOP
        ctx.drawImage(rig.body, m.imgX, m.imgY, m.drawW, m.drawH);
        ctx.restore();
      } else if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        ctx.save();
        if (s.baseTiltDeg !== 0) {
          ctx.rotate((s.baseTiltDeg * Math.PI) / 180);
        }
        ctx.drawImage(sprite, m.imgX, m.imgY, m.drawW, m.drawH);
        ctx.restore();
      } else {
        // Minimal silhouette fallback while sprite loads (first few ms)
        ctx.lineCap = 'round';
        drawCircle(ctx, 0, 0, 22, '#14181f');
        drawCircle(ctx, m.frontWheelX, 0, 22, '#14181f');
        ctx.fillStyle = '#222';
        ctx.fillRect(10, -10, m.frontWheelX - 28, 12);
        drawPolyline(ctx, [m.frontWheelX - 4, 0, m.gripX, m.gripY], '#222', 7);
      }

      // Draw rider standing/kneeling on the scooter deck & holding handlebars
      if (withRider) {
        drawRider(
          s,
          m,
          wheelieAngle,
          sim.oh,
          sim.ohTime,
          sim.knee,
          sim.stem
        );
      }
    };

    const update = (dt: number) => {
      const sim = simRef.current;
      sim.t += dt;
      const curMode = modeRef.current;
      const s = getScooter(scooterIdRef.current);

      const gasOn = gasRef.current;
      const brkOn = brakeRef.current;
      const targetSpd =
        curMode === 'play'
          ? (gasOn ? 310 + s.power * 75 : brkOn ? 140 : 250 + s.power * 45) + sim.a * 3.2
          : curMode === 'crash'
            ? 0
            : 95;
      sim.spd += (targetSpd - sim.spd) * Math.min(1, dt * (curMode === 'crash' ? 5.5 : 3.2));
      sim.off += (sim.spd * dt * sim.u) / 2.2;

      // Exact no-slip angular velocity per wheel using actual measured rig radii (rear drives; front coasts in mid-air!)
      const mWheel = getMetrics(s);
      const rigWheel = rigsRef.current[s.id];
      const rearR = Math.max(12, rigWheel ? rigWheel.rear.rH * mWheel.drawH : mWheel.wheelBottom);
      const frontR = Math.max(12, rigWheel ? rigWheel.front.rH * mWheel.drawH : mWheel.wheelBottom);
      const roadLinearVel = sim.spd / 2.2;
      const rearSlipMult =
        curMode === 'play'
          ? gasOn
            ? 1.18
            : brkOn
              ? 0.42
              : 1.0
          : 1.0;
      const rearAngVel = (roadLinearVel / rearR) * rearSlipMult;
      const frontGroundAngVel = roadLinearVel / frontR;

      sim.rearSpin = (sim.rearSpin + rearAngVel * dt) % (Math.PI * 2);
      if (curMode === 'play' && sim.a > 6) {
        const drag = brkOn ? 6.8 : 0.55;
        sim.frontSpinVel *= Math.exp(-drag * dt);
        sim.frontSpin = (sim.frontSpin + sim.frontSpinVel * dt) % (Math.PI * 2);
      } else {
        // Smooth spin-up match when front wheel touches back down onto asphalt
        sim.frontSpinVel += (frontGroundAngVel - sim.frontSpinVel) * Math.min(1, dt * 16);
        sim.frontSpin = (sim.frontSpin + sim.frontSpinVel * dt) % (Math.PI * 2);
      }

      // Realistic scooter speedometer (km/h) responsive to gas, brake, wheelie, and scooter model
      const targetKmh =
        curMode === 'play'
          ? Math.min(
              s.maxKmh,
              (gasOn ? s.maxKmh * 0.88 : brkOn ? s.maxKmh * 0.25 : s.maxKmh * 0.56) +
                (sim.a / 102) * (s.maxKmh * 0.14)
            )
          : curMode === 'crash'
            ? 0
            : Math.round(s.maxKmh * 0.32);
      const kmhRate = curMode === 'crash' ? 6 : brkOn ? 4.8 : gasOn ? 2.6 : 1.8;
      sim.kmh += (targetKmh - sim.kmh) * Math.min(1, dt * kmhRate);
      if (sim.kmh < 0.2 && curMode === 'crash') sim.kmh = 0;

      if (curMode === 'play') {
        // Smooth Wheelie Life One-Hander (Ванхенд) & One-Knee (Колено) blend
        const ohTarget = oneHandRef.current ? 1 : 0;
        sim.oh += (ohTarget - sim.oh) * Math.min(1, dt * 10);
        if (sim.oh > 0.05) sim.ohTime += dt;

        const kneeTarget = kneeRef.current ? 1 : 0;
        sim.knee += (kneeTarget - sim.knee) * Math.min(1, dt * 11);

        const stemTarget = stemFootRef.current ? 1 : 0;
        sim.stem += (stemTarget - sim.stem) * Math.min(1, dt * 11);

        // Authentic wheelie physics up to 12 o'clock (90°) and loop-out at 13 o'clock (102°)
        const ohLift = sim.a > 10 ? sim.oh * 5.2 : 0;
        const kneeLift = sim.a > 10 ? sim.knee * 2.4 : 0;
        const stemLift = sim.a > 10 ? sim.stem * 2.8 : 0;
        const grav =
          sim.a <= 88
            ? (24 * sim.a) / 52
            : (24 * 88) / 52 - (sim.a - 88) * 5.2;
        sim.w +=
          ((gasOn ? 58 * s.power : 0) + ohLift + kneeLift + stemLift - (brkOn ? 115 : 0) - grav) *
          dt;
        sim.w -= sim.w * 0.92 * dt;
        sim.a += sim.w * dt;
        if (sim.a < 0) {
          sim.a = 0;
          sim.w = 0;
        }

        // Exact physical G2 Pro stunt bugel (бугель) asphalt contact & scrape (чирк)
        let bugelScraping = false;
        const mNow = getMetrics(s);
        const ryPlay = sim.H * 0.64;
        if (s.bugelX !== undefined && s.bugelY !== undefined && sim.a > 50) {
          const bLocalX = mNow.imgX + s.bugelX * mNow.drawW;
          const bLocalY = mNow.imgY + s.bugelY * mNow.drawH;
          const rad = (-sim.a * Math.PI) / 180;
          const cosR = Math.cos(rad);
          const sinR = Math.sin(rad);
          const pivotX = sim.W * 0.36;
          const pivotY = ryPlay - mNow.wheelBottom * sim.u;
          const tipX = pivotX + (bLocalX * cosR - bLocalY * sinR) * sim.u;
          const tipY = pivotY + (bLocalX * sinR + bLocalY * cosR) * sim.u;

          if (tipY >= ryPlay - 3.5 * sim.u) {
            bugelScraping = true;
            sim.bugelContactX = tipX;
            sim.bugelContactY = ryPlay;
            sim.bugelScrapeGlow = Math.min(1, sim.bugelScrapeGlow + dt * 10);

            // Real stunt bugel rides on the asphalt (cushions rotation in 80°..95° sweet spot!)
            if (sim.a < 95 && sim.w > 0) {
              sim.w *= Math.max(0.18, 1 - dt * 9.5);
            }
            if (sim.a >= 82 && sim.a <= 94 && !brkOn) {
              // Slight spring-back friction from steel bar gliding over asphalt
              sim.w -= (sim.a - 82) * 1.45 * dt;
            }

            // Continuous dense molten spark fountain directly from the bugel tip!
            const sparkCount = gasOn ? 3 : 2;
            const sparkColors = ['#ffffff', '#fff7c2', '#ffd34d', '#ff922b', '#ff5a1f'];
            for (let si = 0; si < sparkCount; si++) {
              if (Math.random() < 0.85) {
                sim.sparks.push({
                  x: tipX + (Math.random() - 0.5) * 4 * sim.u,
                  y: ryPlay - (1 + Math.random() * 2) * sim.u,
                  vx: -(180 + Math.random() * 250 + sim.spd * 0.45) * sim.u,
                  vy: -(24 + Math.random() * 145) * sim.u,
                  life: 0.24 + Math.random() * 0.26,
                  maxLife: 0.5,
                  color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
                });
              }
            }

            // Crisp metallic asphalt scrape sound
            sound.playScrape(gasOn ? 0.95 : 0.65);
          }
        }
        sim.bugelScraping = bugelScraping;
        if (!bugelScraping) {
          sim.bugelScrapeGlow = Math.max(0, sim.bugelScrapeGlow - dt * 7);
        }

        // Rear tire smoke on hard throttle takeoff
        if (gasOn && sim.a < 28 && Math.random() < dt * 12) {
          sim.dust.push({
            x: sim.W * 0.36 - 8 * sim.u,
            y: ryPlay - 1 * sim.u,
            vx: -(85 + Math.random() * 65) * sim.u,
            vy: -(12 + Math.random() * 26) * sim.u,
            r: (4 + Math.random() * 5) * sim.u,
            grow: (16 + Math.random() * 14) * sim.u,
            life: 0.28 + Math.random() * 0.18,
            maxLife: 0.46,
          });
        }

        if (sim.a > 12) {
          const rate = sim.a < 50 ? 6 : sim.a < 78 ? 16 : 38;
          const hasOh = sim.oh > 0.45;
          const hasKnee = sim.knee > 0.45;
          const hasStem = sim.stem > 0.45;
          const trickBonus =
            hasOh && hasStem
              ? 1.75
              : hasOh && hasKnee
                ? 1.65
                : hasStem
                  ? 1.4
                  : hasOh
                    ? 1.35
                    : hasKnee
                      ? 1.3
                      : 1;
          const scrapeBonus = bugelScraping ? 1.45 : 1;
          const vipMult = vipRef.current ? 2 : 1;
          sim.pend += rate * s.multiplier * trickBonus * scrapeBonus * vipMult * dt;
          sim.wheelieM += (sim.kmh / 3.6) * dt;

          // Emit crisp sparks from rear tail scrape on regular scooters (non-bugel) at high 12 o'clock angle
          if (!bugelScraping && sim.a > 72 && Math.random() < dt * (sim.a > 86 ? 34 : 18)) {
            sim.sparks.push({
              x: sim.W * 0.36 - 12 * sim.u,
              y: ryPlay - 2 * sim.u,
              vx: -(120 + Math.random() * 155) * sim.u,
              vy: -(40 + Math.random() * 125) * sim.u,
              life: 0.3 + Math.random() * 0.22,
              maxLife: 0.52,
              color: sim.a > 86 ? '#ff4d2e' : '#ffd34d',
            });
          }
        } else {
          if (sim.pend > 0 && sim.a < 4) {
            const banked = Math.floor(sim.pend);
            sim.pend = 0;
            sim.wheelieM = 0;
            if (banked > 0) {
              if (banked > bestRunRef.current) {
                bestRunRef.current = banked;
                onNewBestRef.current(banked);
                sim.msgs.push({ t: `🏆 РЕКОРД +${banked}`, l: 1.55, color: '#ffd34d' });
              } else {
                sim.msgs.push({ t: '+' + banked, l: 1.25, color: '#6dff8a' });
              }
              sound.playCoinBank(banked);
              onBankCoinsRef.current(banked);
            }
          }
        }

        // Loop-out & crash at 13 o'clock (102°)
        if (sim.a >= 102 && !sim.ragdoll.active) {
          modeRef.current = 'crash';
          sim.ct = 0;
          sim.lost = Math.floor(sim.pend);
          sim.pend = 0;
          sim.wheelieM = 0;
          sim.shown = false;
          spawnCrashPhysics(s, getMetrics(s));
          sound.playCrash();
          onCrashStartRef.current();
        }
      } else if (curMode === 'crash') {
        sim.ct += dt;
        // Brief dramatic slow-motion right at loop-out & initial impact
        if (sim.slowMo > 0) {
          sim.slowMo = Math.max(0, sim.slowMo - dt);
        }
        const timeScale = sim.slowMo > 0 ? 0.48 : 1;
        const simDt = Math.min(dt * timeScale, 0.034);
        const u = sim.u;
        const ry = sim.H * 0.64;
        const groundY = ry + 4 * u;

        // 1) Update articulated PBD ragdoll rider (2 substeps for crisp, stable bones)
        if (sim.ragdoll.active && simDt > 0.0001) {
          const subSteps = 2;
          const sdt = simDt / subSteps;
          const nodes = sim.ragdoll.nodes;
          const links = sim.ragdoll.links;
          const gravity = 1650 * u;

          for (let step = 0; step < subSteps; step++) {
            const prevX = nodes.map((n) => n.x);
            const prevY = nodes.map((n) => n.y);
            const prevVy = nodes.map((n) => n.vy);

            for (const n of nodes) {
              n.vy += gravity * sdt;
              n.x += n.vx * sdt;
              n.y += n.vy * sdt;
            }

            // Distance & anti-collapse constraint relaxation
            for (let iter = 0; iter < 6; iter++) {
              for (const lk of links) {
                const a = nodes[lk.a];
                const b = nodes[lk.b];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const d = Math.hypot(dx, dy) || 0.0001;
                if (lk.minOnly && d >= lk.len) continue;
                const diff = ((d - lk.len) / d) * lk.stiffness;
                const invSum = a.invMass + b.invMass || 1;
                const wa = a.invMass / invSum;
                const wb = b.invMass / invSum;
                a.x += dx * diff * wa;
                a.y += dy * diff * wa;
                b.x -= dx * diff * wb;
                b.y -= dy * diff * wb;
              }
              // Keep joints above asphalt surface during relaxation
              for (const n of nodes) {
                const floor = groundY - n.r;
                if (n.y > floor) n.y = floor;
              }
            }

            // Derive post-constraint velocities + realistic asphalt bounce & sliding friction
            for (let i = 0; i < nodes.length; i++) {
              const n = nodes[i];
              n.vx = (n.x - prevX[i]) / sdt;
              n.vy = (n.y - prevY[i]) / sdt;

              const floor = groundY - n.r;
              if (n.y >= floor - 0.5) {
                const impactVy = prevVy[i];
                if (impactVy > 105 * u) {
                  n.vy = -impactVy * (i === 2 ? 0.34 : 0.25);
                  // Heavy torso/head/hip impact sparks camera shake, dust, and muffled thud
                  if (impactVy > 180 * u && (i === 0 || i === 1 || i === 2)) {
                    sim.shake = Math.min(11 * u, Math.max(sim.shake, (impactVy / (45 * u)) * u));
                    emitDust(n.x, ry + 3 * u, 3, 0.85);
                    sound.playImpact(Math.min(1, impactVy / (460 * u)), false);
                  }
                } else if (n.vy > 0) {
                  n.vy = 0;
                }
                // Strong asphalt friction while sliding
                const slideFriction = Math.pow(0.06, sdt);
                n.vx *= slideFriction;
                if (Math.abs(n.vx) > 65 * u && Math.random() < sdt * 8) {
                  emitDust(n.x, ry + 3 * u, 1, 0.5);
                }
              } else {
                // Subtle air drag
                n.vx *= 1 - 0.35 * sdt;
                n.vy *= 1 - 0.2 * sdt;
              }

              // Soft horizontal viewport guards so the tumbling rider stays clearly visible on screen
              const minScreenX = 22 * u;
              const maxScreenX = Math.max(minScreenX + 40 * u, sim.W - 22 * u);
              if (n.x < minScreenX) {
                n.x = minScreenX;
                if (n.vx < 0) n.vx *= -0.25;
              } else if (n.x > maxScreenX) {
                n.x = maxScreenX;
                if (n.vx > 0) n.vx *= -0.25;
              }
            }
          }
        }

        // 2) Update independent flying & tumbling scooter physics
        const cs = sim.crashScooter;
        if (cs.active && simDt > 0.0001) {
          const m = getMetrics(s);
          cs.vy += 1620 * u * simDt;
          cs.x += cs.vx * simDt;
          cs.y += cs.vy * simDt;
          cs.angle += cs.angVel * simDt;

          // Multi-point contact check (rear wheel, front wheel, handlebar top, deck)
          const rad = (-cs.angle * Math.PI) / 180;
          const cosR = Math.cos(rad);
          const sinR = Math.sin(rad);
          const contactLocal: Pt[] = [
            { x: 0, y: m.wheelBottom },
            { x: m.frontWheelX, y: m.wheelBottom },
            { x: m.gripX, y: m.gripY },
            { x: m.frontWheelX * 0.48, y: m.deckY },
          ];

          let maxPen = 0;
          let hitX = cs.x;
          let hitIdx = 0;
          for (let i = 0; i < contactLocal.length; i++) {
            const p = contactLocal[i];
            const wx = cs.x + (p.x * cosR - p.y * sinR) * u;
            const wy = cs.y + (p.x * sinR + p.y * cosR) * u;
            const pen = wy - (ry + 3 * u);
            if (pen > maxPen) {
              maxPen = pen;
              hitX = wx;
              hitIdx = i;
            }
          }

          if (maxPen > 0) {
            cs.y -= maxPen;
            const dx = hitX - cs.x;
            const angVelRad = (cs.angVel * Math.PI) / 180;
            const vContactY = cs.vy - dx * angVelRad;

            if (vContactY > 0) {
              const impact = vContactY;
              cs.vy = Math.min(cs.vy, -impact * 0.34);
              // Torque impulse from off-center contact flips scooter naturally
              cs.angVel += (dx / (92 * u)) * (impact / u) * 0.42;
              cs.angVel *= 0.76;
              cs.vx *= 0.87;

              if (impact > 95 * u) {
                const metallic = hitIdx >= 2;
                emitSparks(hitX, ry + 1 * u, metallic ? 10 : 6, cs.vx >= 0 ? -1 : 1);
                emitDust(hitX, ry + 3 * u, 3, 0.9);
                sim.shake = Math.min(12 * u, Math.max(sim.shake, (impact / (52 * u)) * u));
                sound.playImpact(Math.min(1, impact / (420 * u)), metallic);
              }
            }

            // Continuous asphalt scraping sparks & friction while sliding fast
            cs.vx *= Math.pow(0.24, simDt);
            cs.angVel *= Math.pow(0.18, simDt);
            cs.scrapeTimer -= simDt;
            if (Math.abs(cs.vx) > 55 * u && cs.scrapeTimer <= 0) {
              cs.scrapeTimer = 0.045;
              emitSparks(hitX, ry + 1 * u, 2, cs.vx >= 0 ? -1 : 1);
            }
          }
        }

        if (sim.ct > 1.85 && !sim.shown) {
          sim.shown = true;
          onCrashFinishRef.current(sim.lost);
        }
      }

      // Exponentially damp camera shake
      if (sim.shake > 0.1) {
        sim.shake *= Math.exp(-11 * dt);
      } else {
        sim.shake = 0;
      }

      // Update floating coin messages
      for (let i = sim.msgs.length - 1; i >= 0; i--) {
        sim.msgs[i].l -= dt;
        if (sim.msgs[i].l <= 0) sim.msgs.splice(i, 1);
      }

      // Update sparks (bounce off asphalt!)
      const rySpark = sim.H * 0.64 + 2 * sim.u;
      for (let i = sim.sparks.length - 1; i >= 0; i--) {
        const p = sim.sparks[i];
        p.life -= dt;
        p.vy += 580 * sim.u * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y > rySpark) {
          p.y = rySpark;
          p.vy *= -0.45;
          p.vx *= 0.72;
        }
        if (p.life <= 0) sim.sparks.splice(i, 1);
      }

      // Update asphalt dust puffs
      for (let i = sim.dust.length - 1; i >= 0; i--) {
        const d = sim.dust[i];
        d.life -= dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vx *= Math.pow(0.25, dt);
        d.vy *= Math.pow(0.3, dt);
        d.r += d.grow * dt;
        if (d.life <= 0) sim.dust.splice(i, 1);
      }
    };

    const draw = () => {
      const sim = simRef.current;
      const { W, H, u } = sim;
      if (W < 4 || H < 4 || u <= 0.01) return;
      const curMode = modeRef.current;
      const s = getScooter(scooterIdRef.current);
      const m = getMetrics(s);
      const ry = H * 0.64;

      // Apply damped camera shake to world scene (HUD stays razor sharp)
      ctx.save();
      if (sim.shake > 0.15) {
        const sx = (Math.random() - 0.5) * 2 * sim.shake;
        const sy = (Math.random() - 0.5) * 2 * sim.shake;
        ctx.translate(sx, sy);
      }

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.52);
      sky.addColorStop(0, '#5a829e');
      sky.addColorStop(0.65, '#9ab9cf');
      sky.addColorStop(1, '#c8dce8');
      ctx.fillStyle = sky;
      ctx.fillRect(-20, -20, W + 40, H + 40);

      // Parallax city skyline
      const totalW = BUILDINGS.reduce((acc, b) => acc + b.w + 6, 0) * u;
      let bx = -((sim.off * 0.15) % totalW);
      while (bx < W) {
        for (let i = 0; i < BUILDINGS.length; i++) {
          const b = BUILDINGS[i];
          if (bx < W) {
            const bw = b.w * u;
            const bh = b.h * u;
            ctx.fillStyle = b.shade;
            ctx.fillRect(bx, H * 0.5 - bh, bw, bh);
            ctx.fillStyle = 'rgba(255,255,255,0.24)';
            for (let j = 0; j < bh / (24 * u) - 1; j++) {
              for (let k = 0; k < bw / (20 * u) - 0.5; k++) {
                if ((i + j + k) % 3) {
                  ctx.fillRect(
                    bx + (6 + k * 20) * u,
                    H * 0.5 - bh + (10 + j * 24) * u,
                    8 * u,
                    11 * u
                  );
                }
              }
            }
          }
          bx += (b.w + 6) * u;
        }
      }

      // Sidewalk & streetlight poles
      ctx.fillStyle = '#d9a15a';
      ctx.fillRect(-20, H * 0.5, W + 40, H * 0.036);
      ctx.fillStyle = '#6c737c';
      for (let k = -1; k < W / (220 * u) + 1; k++) {
        const px = k * 220 * u - ((sim.off * 0.6) % (220 * u));
        ctx.fillRect(px, H * 0.494, 12 * u, H * 0.044);
      }

      // Asphalt road
      ctx.fillStyle = '#45494f';
      ctx.fillRect(-20, H * 0.535, W + 40, H * 0.245);
      // Yellow curb stripe
      ctx.fillStyle = '#e8d02a';
      ctx.fillRect(-20, H * 0.54, W + 40, 4 * u);
      // Dashed lane divider
      ctx.fillStyle = '#e5e7eb';
      for (let k = -1; k < W / (160 * u) + 1; k++) {
        ctx.fillRect(
          k * 160 * u - (sim.off % (160 * u)),
          H * 0.7,
          90 * u,
          6 * u
        );
      }

      // Foreground verge
      ctx.fillStyle = '#9c8356';
      ctx.fillRect(-20, H * 0.78, W + 40, H * 0.22 + 20);

      if (curMode === 'crash' && sim.crashScooter.active) {
        const cs = sim.crashScooter;
        // Dynamic ground shadow under the flying/tumbling scooter
        const scHeight = Math.max(0, ry - cs.y);
        const scShadowAlpha = Math.max(0.1, 0.34 - (scHeight / (260 * u)) * 0.24);
        ctx.fillStyle = `rgba(0,0,0,${scShadowAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(cs.x + 28 * u, ry + 3 * u, 64 * u, 8 * u, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tumbling detached scooter
        ctx.save();
        ctx.translate(cs.x, cs.y);
        ctx.scale(u, u);
        ctx.rotate((-cs.angle * Math.PI) / 180);
        drawScooterAndRider(s, false, cs.angle);
        ctx.restore();

        // Articulated ragdoll rider with motocross helmet
        drawRagdoll(s, sim.ragdoll);
      } else {
        // Ground shadow (shifts slightly as front wheel lifts)
        const liftFactor = Math.max(0.45, Math.cos((sim.a * Math.PI) / 180));
        const shadowSpan = m.frontWheelX * u * 0.62 * liftFactor;
        ctx.fillStyle = 'rgba(0,0,0,0.34)';
        ctx.beginPath();
        ctx.ellipse(
          W * 0.36 + shadowSpan * 0.78,
          ry + 2 * u,
          Math.max(40 * u, shadowSpan * 1.15),
          8 * u,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Underglow reflection on road for Kugoo F3
        if (s.underglow) {
          const glowGrad = ctx.createRadialGradient(
            W * 0.36 + shadowSpan * 0.75,
            ry + 2 * u,
            4 * u,
            W * 0.36 + shadowSpan * 0.75,
            ry + 2 * u,
            85 * u * liftFactor
          );
          glowGrad.addColorStop(0, 'rgba(43, 212, 255, 0.45)');
          glowGrad.addColorStop(1, 'rgba(43, 212, 255, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.ellipse(
            W * 0.36 + shadowSpan * 0.75,
            ry + 2 * u,
            85 * u * liftFactor,
            14 * u,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Scooter + Rider (pivoting around rear wheel axle)
        ctx.save();
        ctx.translate(W * 0.36, ry - m.wheelBottom * u);
        ctx.scale(u, u);
        ctx.rotate((-sim.a * Math.PI) / 180);
        drawScooterAndRider(s, true, sim.a);
        ctx.restore();
      }

      // Asphalt dust & tire smoke puffs
      for (const d of sim.dust) {
        const t = Math.max(0, d.life / d.maxLife);
        ctx.globalAlpha = t * 0.36;
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hot molten friction flash & road streak right under G2 Pro bugel contact point!
      if (curMode === 'play' && sim.bugelScrapeGlow > 0.04) {
        const gA = sim.bugelScrapeGlow;
        const bx = sim.bugelContactX;
        const by = ry - 1 * u;

        // Glowing friction trail behind bugel tip
        const trailGrad = ctx.createLinearGradient(bx - 52 * u, by, bx + 4 * u, by);
        trailGrad.addColorStop(0, 'rgba(255, 106, 26, 0)');
        trailGrad.addColorStop(0.65, `rgba(255, 180, 50, ${(0.55 * gA).toFixed(2)})`);
        trailGrad.addColorStop(1, `rgba(255, 255, 235, ${(0.95 * gA).toFixed(2)})`);
        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = 3.5 * u;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx - 52 * u, by);
        ctx.lineTo(bx + 2 * u, by);
        ctx.stroke();

        // White-hot radial contact core
        const hotGrad = ctx.createRadialGradient(bx, by, 1 * u, bx, by, 16 * u);
        hotGrad.addColorStop(0, `rgba(255, 255, 255, ${(0.95 * gA).toFixed(2)})`);
        hotGrad.addColorStop(0.4, `rgba(255, 211, 77, ${(0.65 * gA).toFixed(2)})`);
        hotGrad.addColorStop(1, 'rgba(255, 106, 26, 0)');
        ctx.fillStyle = hotGrad;
        ctx.beginPath();
        ctx.arc(bx, by, 16 * u, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sparks (elongated velocity streaks for crisp metallic feel)
      for (const p of sim.sparks) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.6 * u;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.026, p.y - p.vy * 0.026);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // In-game Canvas HUD (shown during active play & crash)
      if (curMode === 'play' || curMode === 'crash') {
        const bw = 300 * u;
        const bh = 12 * u;
        const b0 = (W - bw) / 2;
        const by = 72 * u;
        const maxGaugeDeg = 102;
        const zoneColors = ['#5d7a8a', '#3dcf5a', '#e8b923', '#ff6a1a', '#e0372c'];
        const bounds = [0, 12, 50, 78, 94, maxGaugeDeg];

        // Gauge backing shadow
        ctx.fillStyle = 'rgba(10, 14, 20, 0.45)';
        ctx.fillRect(b0 - 3 * u, by - 3 * u, bw + 6 * u, bh + 6 * u);

        zoneColors.forEach((col, i) => {
          ctx.fillStyle = col;
          ctx.fillRect(
            b0 + (bounds[i] / maxGaugeDeg) * bw,
            by,
            ((bounds[i + 1] - bounds[i]) / maxGaugeDeg) * bw,
            bh
          );
        });

        // Angle pointer triangle
        const pxx = b0 + (Math.min(sim.a, maxGaugeDeg) / maxGaugeDeg) * bw;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(pxx, by + bh + 2 * u);
        ctx.lineTo(pxx - 8 * u, by + bh + 16 * u);
        ctx.lineTo(pxx + 8 * u, by + bh + 16 * u);
        ctx.closePath();
        ctx.fill();

        // Angle label + zone text (non-hue-only cue) with crisp sky contrast shadow
        const zoneLabel = sim.bugelScraping
          ? ' · ⚡ ЧИРК БУГЕЛЕМ! ×1.45'
          : sim.a >= 94
            ? ' · 13 ОКЛОК!'
            : sim.a >= 78
              ? ' · 12 ОКЛОК ×6'
              : sim.a >= 50
                ? ' · ПРОФИ'
                : sim.a > 12
                  ? ' · ВИЛЛИ'
                  : '';
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 4 * u;
        ctx.shadowOffsetY = 1.5 * u;
        ctx.textAlign = 'center';
        ctx.fillStyle = sim.bugelScraping ? '#ffd34d' : '#ffffff';
        ctx.font = `700 ${21 * u}px "Rubik", system-ui, sans-serif`;
        ctx.fillText(`угол ${Math.round(sim.a)}°${zoneLabel}`, W / 2, by - 13 * u);

        // Coins counter (top-left) + VIP x2 badge when active
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${22 * u}px "JetBrains Mono", monospace`;
        ctx.fillText(`🪙 ${Math.floor(coinsRef.current).toLocaleString('ru-RU')}`, 16 * u, 40 * u);
        if (vipRef.current) {
          ctx.fillStyle = '#ffd34d';
          ctx.font = `800 ${13 * u}px "Rubik", system-ui, sans-serif`;
          ctx.fillText('👑 VIP ×2 МОНЕТЫ', 18 * u, 60 * u);
        }
        ctx.restore();

        // Speedometer dial (non-overlapping on both mobile portrait and wide desktop)
        const gaugeR = 44 * u;
        const isWide = W > 640 * u;
        const gx = isWide ? 66 * u : 58 * u;
        const gy = isWide ? 116 * u : 158 * u;
        const startAng = Math.PI * 0.78;
        const sweep = Math.PI * 1.44;
        const ratio = Math.max(0, Math.min(1, sim.kmh / s.maxKmh));
        const endAng = startAng + sweep;
        const valAng = startAng + sweep * ratio;

        ctx.save();
        // Dial backing
        ctx.fillStyle = 'rgba(13, 18, 25, 0.74)';
        ctx.beginPath();
        ctx.arc(gx, gy, gaugeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1.5 * u;
        ctx.stroke();

        // Background track arc
        const arcR = gaugeR - 8 * u;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 6 * u;
        ctx.beginPath();
        ctx.arc(gx, gy, arcR, startAng, endAng);
        ctx.stroke();

        // Active speed arc (color shifts green -> amber -> orange/red near max speed)
        const speedCol =
          ratio > 0.82 ? '#ff4d2e' : ratio > 0.55 ? '#ff991a' : s.underglow ? '#2bd4ff' : '#3dcf5a';
        if (ratio > 0.01) {
          ctx.strokeStyle = speedCol;
          ctx.lineWidth = 6 * u;
          ctx.beginPath();
          ctx.arc(gx, gy, arcR, startAng, valAng);
          ctx.stroke();
        }

        // Subtle tick marks along the dial
        for (let t = 0; t <= 8; t++) {
          const ta = startAng + (sweep * t) / 8;
          const r1 = arcR - 5.5 * u;
          const r2 = arcR - (t % 2 === 0 ? 10 * u : 8 * u);
          ctx.strokeStyle = t / 8 <= ratio ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)';
          ctx.lineWidth = (t % 2 === 0 ? 1.8 : 1.1) * u;
          ctx.beginPath();
          ctx.moveTo(gx + Math.cos(ta) * r1, gy + Math.sin(ta) * r1);
          ctx.lineTo(gx + Math.cos(ta) * r2, gy + Math.sin(ta) * r2);
          ctx.stroke();
        }

        // Glowing needle dot on arc tip
        const nx = gx + Math.cos(valAng) * arcR;
        const ny = gy + Math.sin(valAng) * arcR;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nx, ny, 3.6 * u, 0, Math.PI * 2);
        ctx.fill();

        // Digital speed number + unit
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 ${24 * u}px "JetBrains Mono", monospace`;
        ctx.fillText(String(Math.round(sim.kmh)), gx, gy - 2 * u);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
        ctx.font = `700 ${10 * u}px "Manrope", system-ui, sans-serif`;
        ctx.fillText('км/ч', gx, gy + 17 * u);
        ctx.restore();
        ctx.textBaseline = 'alphabetic';

        // Pending trick coins + wheelie distance in meters
        ctx.textAlign = 'center';
        if (sim.pend > 0) {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 4 * u;
          ctx.fillStyle = '#ffd34d';
          ctx.font = `800 ${28 * u}px "JetBrains Mono", monospace`;
          const mLabel = sim.wheelieM >= 1 ? ` · ${Math.floor(sim.wheelieM)}м` : '';
          ctx.fillText(`+${Math.floor(sim.pend)}${mLabel}`, W / 2, by + 48 * u);
          ctx.restore();
        }

        // Active Stunt callout (One-Hander, One-Knee, Foot-on-Steering-Column, or Combo)
        const hasOh = sim.oh > 0.45;
        const hasKnee = sim.knee > 0.45;
        const hasStem = sim.stem > 0.45;
        if (curMode === 'play' && (hasOh || hasKnee || hasStem)) {
          const trickText =
            sim.a > 12
              ? hasOh && hasStem
                ? '1 РУКА + РУЛЕВАЯ ×1.75'
                : hasOh && hasKnee
                  ? '1 РУКА + КОЛЕНО ×1.65'
                  : hasStem
                    ? 'НОГА НА РУЛЕВОЙ ×1.4'
                    : hasOh
                      ? 'ВАНХЕНД ×1.35'
                      : 'НА КОЛЕНЕ ×1.3'
              : hasOh && hasStem
                ? '1 РУКА + РУЛЕВАЯ'
                : hasOh && hasKnee
                  ? '1 РУКА + КОЛЕНО'
                  : hasStem
                    ? 'НОГА НА РУЛЕВОЙ'
                    : hasOh
                      ? 'ВАНХЕНД'
                      : 'НА КОЛЕНЕ';
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 4 * u;
          ctx.fillStyle =
            sim.a > 12
              ? (hasOh && (hasKnee || hasStem))
                ? '#ffd34d'
                : hasStem
                  ? '#34d399'
                  : hasKnee
                    ? '#38bdf8'
                    : '#ff8b4a'
              : 'rgba(255,255,255,0.85)';
          ctx.font = `900 ${15 * u}px "Rubik", system-ui, sans-serif`;
          ctx.fillText(trickText, W / 2, by + (sim.pend > 0 ? 74 : 46) * u);
          ctx.restore();
        }

        // First-moment hint when grounded
        if (curMode === 'play' && sim.a < 1 && sim.pend === 0) {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 4 * u;
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.font = `600 ${19 * u}px "Manrope", system-ui, sans-serif`;
          ctx.fillText('Держи ГАЗ, чтобы поднять колесо', W / 2, H * 0.29);
          ctx.restore();
        }

        // Floating banked coin & Fever/Record messages
        for (const msg of sim.msgs) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, msg.l);
          ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
          ctx.shadowBlur = 6 * u;
          ctx.fillStyle = msg.color || '#6dff8a';
          ctx.font = `800 ${36 * u}px "JetBrains Mono", monospace`;
          ctx.fillText(msg.t, W / 2, H * 0.4 - (1.25 - msg.l) * 60 * u);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }
    };

    const loop = (time: number) => {
      if (lastTime === 0) lastTime = time;
      const dt = Math.min(Math.max(0, (time - lastTime) / 1000), 0.05);
      lastTime = time;
      update(dt);
      draw();
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [gasRef, brakeRef, oneHandRef, kneeRef, stemFootRef]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full"
      aria-label="Игровое поле Стант на самокате"
    />
  );
}
