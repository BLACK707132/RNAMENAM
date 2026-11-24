import { memo, useEffect, useRef } from 'react';
import {
  getEffectiveScooterStats,
  getScooter,
  getScooterLight,
  getScooterUnderglowHex,
  SCOOTERS,
  type AkbId,
  type LightId,
  type ScooterId,
  type ScooterPaintMap,
  type ScooterSpec,
  type UnderglowId,
} from '../data/scooters';
import { getHelmet, type HelmetId } from '../data/helmets';
import { drawStyledRider, getOutfit, type OutfitId } from '../data/outfits';
import type { MapId, TimeOfDay, WeatherId } from '../data/maps';
import {
  SCOOTER_WHEEL_CONFIGS,
  disposeScooterRig,
  prepareScooterWheelRig,
  renderPaintedScooterCanvas,
  type PreparedScooterRig,
} from '../utils/wheelRig';
import { sound } from '../utils/sound';

const SCOOTER_IMAGE_CACHE: Partial<Record<ScooterId, HTMLImageElement>> = {};
const SCOOTER_IMAGE_INFLIGHT: Partial<Record<ScooterId, Promise<HTMLImageElement | null>>> = {};

export function loadScooterImageCached(
  sc: ScooterSpec,
  highPriority = false
): Promise<HTMLImageElement | null> {
  const existing = SCOOTER_IMAGE_CACHE[sc.id];
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return Promise.resolve(existing);
  }
  const pending = SCOOTER_IMAGE_INFLIGHT[sc.id];
  if (pending) return pending;

  const cleanSpriteSrc = sc.spriteSrc.split('?')[0];
  const cleanOriginalSrc = sc.originalSrc.split('?')[0];
  const candidates = Array.from(
    new Set([sc.spriteSrc, cleanSpriteSrc, sc.originalSrc, cleanOriginalSrc].filter(Boolean))
  );

  const task = new Promise<HTMLImageElement | null>((resolve) => {
    let idx = 0;
    let round = 0;

    const tryNext = () => {
      if (idx >= candidates.length) {
        round += 1;
        if (round >= 2) {
          delete SCOOTER_IMAGE_INFLIGHT[sc.id];
          resolve(null);
          return;
        }
        idx = 0;
        window.setTimeout(tryNext, 350);
        return;
      }

      const src = candidates[idx++];
      const img = new Image();
      img.decoding = 'async';
      if (highPriority && 'fetchPriority' in img) {
        (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high';
      }
      img.onload = async () => {
        try {
          if (typeof img.decode === 'function') {
            await img.decode();
          }
        } catch {
          // Image is already loaded even if decode throws
        }
        if (img.naturalWidth > 0) {
          SCOOTER_IMAGE_CACHE[sc.id] = img;
          delete SCOOTER_IMAGE_INFLIGHT[sc.id];
          resolve(img);
        } else {
          tryNext();
        }
      };
      img.onerror = () => {
        tryNext();
      };
      img.src = src;
    };

    tryNext();
  });

  SCOOTER_IMAGE_INFLIGHT[sc.id] = task;
  return task;
}

let allScootersPreloadStarted = false;
function preloadAllScooterSprites(priorityId: ScooterId) {
  if (typeof window === 'undefined' || allScootersPreloadStarted) return;
  allScootersPreloadStarted = true;
  const others = SCOOTERS.filter((s) => s.id !== priorityId);
  let i = 0;
  const step = () => {
    if (i >= others.length) return;
    const batch = others.slice(i, i + 2);
    i += 2;
    Promise.all(batch.map((s) => loadScooterImageCached(s, false))).finally(() => {
      window.setTimeout(step, 50);
    });
  };
  window.setTimeout(step, 40);
}

function hexToRgbTuple(hex: string): string {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = parseInt(full, 16);
  if (!Number.isFinite(num)) return '43, 212, 255';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

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
  alpha?: number;
  color?: string;
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
  frontFootAngle?: number;
  backFootAngle?: number;
  hideBackLeg?: boolean;
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
  comX: number;
  comY: number;
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
  mapId: MapId;
  timeOfDay: TimeOfDay;
  weather?: WeatherId;
  coins: number;
  bestRun: number;
  vip: boolean;
  paints?: ScooterPaintMap;
  lightId?: LightId;
  underglowId?: UnderglowId;
  akbId?: AkbId;
  hasVesc?: boolean;
  hasSecondMotor?: boolean;
  gasRef: React.MutableRefObject<boolean>;
  brakeRef: React.MutableRefObject<boolean>;
  oneHandRef: React.MutableRefObject<boolean>;
  noHandsRef: React.MutableRefObject<boolean>;
  kneeRef: React.MutableRefObject<boolean>;
  stemFootRef: React.MutableRefObject<boolean>;
  flamingoRef?: React.MutableRefObject<boolean>;
  runTrigger: number;
  paused?: boolean;
  onBankCoins: (amount: number) => void;
  onNewBest: (best: number) => void;
  onCrashFinish: (lostCoins: number) => void;
  onCrashStart: () => void;
  onAutoReleaseNoHands?: () => void;
}

const BUILDINGS = Array.from({ length: 22 }, (_, i) => ({
  w: 68 + ((i * 37) % 5) * 18,
  h: 135 + ((i * 53) % 7) * 28,
  shade: i % 3 === 0 ? '#4d6b80' : i % 3 === 1 ? '#56768c' : '#466378',
  nightShade: i % 3 === 0 ? '#121b2d' : i % 3 === 1 ? '#17233a' : '#0f1726',
}));

const STARS = Array.from({ length: 38 }, (_, i) => ({
  x: ((i * 97 + 13) % 100) / 100,
  y: ((i * 43 + 7) % 42) / 100,
  r: 0.9 + (i % 3) * 0.65,
  phase: i * 1.17,
}));

const ROAD_STREAKS = Array.from({ length: 26 }, (_, i) => ({
  offset: ((i * 193) % 1000) / 1000,
  laneY: ((i * 67 + 19) % 100) / 100,
  len: 16 + (i % 5) * 9,
  bright: i % 3 === 0,
}));

const WIND_LINES = Array.from({ length: 8 }, (_, i) => ({
  seed: ((i * 173 + 29) % 1000) / 1000,
  yFrac: i < 4 ? 0.12 + ((i * 23) % 28) / 100 : 0.72 + (((i - 4) * 19) % 22) / 100,
  len: 32 + (i % 4) * 12,
  speedMult: 1.3 + (i % 3) * 0.25,
}));

const WEATHER_DROPS = Array.from({ length: 76 }, (_, i) => ({
  xFrac: ((i * 173 + 37) % 1000) / 1000,
  yFrac: ((i * 257 + 71) % 1000) / 1000,
  len: 14 + (i % 5) * 5,
  speed: 1.45 + (i % 4) * 0.28,
  alpha: 0.24 + (i % 4) * 0.08,
}));

const WEATHER_FLAKES = Array.from({ length: 68 }, (_, i) => ({
  xFrac: ((i * 197 + 53) % 1000) / 1000,
  yFrac: ((i * 311 + 89) % 1000) / 1000,
  r: 1.4 + (i % 4) * 0.8,
  speed: 0.24 + (i % 5) * 0.06,
  sway: 14 + (i % 4) * 8,
  phase: i * 0.83,
}));

export const GameCanvas = memo(function GameCanvas({
  mode,
  scooterId,
  helmetId,
  outfitId,
  mapId,
  timeOfDay,
  weather = 'clear',
  coins,
  bestRun,
  vip,
  paints = {},
  lightId = 'stock',
  underglowId = 'default',
  akbId = 'stock',
  hasVesc = false,
  hasSecondMotor = false,
  gasRef,
  brakeRef,
  oneHandRef,
  noHandsRef,
  kneeRef,
  stemFootRef,
  flamingoRef,
  runTrigger,
  paused = false,
  onBankCoins,
  onNewBest,
  onCrashFinish,
  onCrashStart,
  onAutoReleaseNoHands,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Partial<Record<ScooterId, HTMLImageElement>>>({});
  const rigsRef = useRef<Partial<Record<ScooterId, PreparedScooterRig>>>({});
  const rigPaintKeyRef = useRef<Partial<Record<ScooterId, string>>>({});
  const paintedFallbackRef = useRef<Partial<Record<ScooterId, HTMLCanvasElement>>>({});
  const rigOrderRef = useRef<ScooterId[]>([]);

  // Keep latest props in refs for 60fps loop without restarting rAF
  const modeRef = useRef<GameMode>(mode);
  const pausedRef = useRef<boolean>(paused);
  const scooterIdRef = useRef<ScooterId>(scooterId);
  const helmetIdRef = useRef<HelmetId>(helmetId);
  const outfitIdRef = useRef<OutfitId>(outfitId);
  const mapIdRef = useRef<MapId>(mapId);
  const timeOfDayRef = useRef<TimeOfDay>(timeOfDay);
  const weatherRef = useRef<WeatherId>(weather);
  const coinsRef = useRef<number>(coins);
  const bestRunRef = useRef<number>(bestRun);
  const vipRef = useRef<boolean>(vip);
  const paintsRef = useRef<ScooterPaintMap>(paints);
  const lightIdRef = useRef<LightId>(lightId);
  const underglowIdRef = useRef<UnderglowId>(underglowId);
  const akbIdRef = useRef<AkbId>(akbId);
  const hasVescRef = useRef<boolean>(hasVesc);
  const hasSecondMotorRef = useRef<boolean>(hasSecondMotor);
  const onBankCoinsRef = useRef(onBankCoins);
  const onNewBestRef = useRef(onNewBest);
  const onCrashFinishRef = useRef(onCrashFinish);
  const onCrashStartRef = useRef(onCrashStart);
  const onAutoReleaseNoHandsRef = useRef(onAutoReleaseNoHands);

  modeRef.current = mode;
  pausedRef.current = paused;
  scooterIdRef.current = scooterId;
  helmetIdRef.current = helmetId;
  outfitIdRef.current = outfitId;
  mapIdRef.current = mapId;
  timeOfDayRef.current = timeOfDay;
  weatherRef.current = weather;
  coinsRef.current = coins;
  bestRunRef.current = bestRun;
  vipRef.current = vip;
  paintsRef.current = paints;
  lightIdRef.current = lightId;
  underglowIdRef.current = underglowId;
  akbIdRef.current = akbId;
  hasVescRef.current = hasVesc;
  hasSecondMotorRef.current = hasSecondMotor;
  onBankCoinsRef.current = onBankCoins;
  onNewBestRef.current = onNewBest;
  onCrashFinishRef.current = onCrashFinish;
  onCrashStartRef.current = onCrashStart;
  onAutoReleaseNoHandsRef.current = onAutoReleaseNoHands;

  // Mutable simulation state
  const simRef = useRef({
    W: 800,
    H: 600,
    u: 1,
    camX: 0,
    thrustShift: 0,
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
    nh: 0,
    nhTime: 0,
    knee: 0,
    stem: 0,
    flamingo: 0,
    ct: 0,
    shown: false,
    msgs: [] as FloatingMsg[],
    sparks: [] as Spark[],
    dust: [] as DustPuff[],
    shake: 0,
    slowMo: 0,
    fenderScraping: false,
    fenderContactX: 0,
    fenderContactY: 0,
    fenderScrapeGlow: 0,
    burnout: 0,
    launchSurge: 0,
    launchCooldown: 0,
    prevThrottle: false,
    wasBurnout: false,
    rearSusp: 0,
    rearSuspVel: 0,
    frontSusp: 0,
    frontSuspVel: 0,
    ragdoll: { active: false, seated: false, nodes: [], links: [] } as RagdollState,
    crashScooter: {
      active: false,
      x: 0,
      y: 0,
      comX: 0,
      comY: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      angVel: 0,
      scrapeTimer: 0,
    } as CrashScooter,
  });

  const activePaint = paints[scooterId];
  const scForKey = getScooter(scooterId);
  const activePaintKey = `${scooterId}:${activePaint?.primary ?? ''}:${activePaint?.secondary ?? ''}:${scForKey.skipCyanLed ? underglowId : ''}`;

  // Lazily load & cache scooter sprites globally while keeping a 2-slot LRU wheel rig cache
  useEffect(() => {
    let cancelled = false;
    const sc = getScooter(scooterId);
    const paint = paints[scooterId];
    const f3UnderglowOverride = sc.skipCyanLed
      ? underglowId === 'default'
        ? undefined
        : underglowId === 'off'
          ? null
          : getScooterUnderglowHex(sc, underglowId)
      : undefined;
    const paintKey = `${sc.id}:${paint?.primary ?? ''}:${paint?.secondary ?? ''}:${sc.skipCyanLed ? underglowId : ''}`;

    const storeRig = (id: ScooterId, rig: PreparedScooterRig | null) => {
      if (cancelled || !rig) return;
      const existing = rigsRef.current[id];
      if (existing && existing !== rig) {
        disposeScooterRig(existing);
      }
      rigsRef.current[id] = rig;
      rigPaintKeyRef.current[id] = paintKey;
      rigOrderRef.current = rigOrderRef.current.filter((item) => item !== id);
      rigOrderRef.current.push(id);
      while (rigOrderRef.current.length > 2) {
        const oldest = rigOrderRef.current.shift();
        if (oldest && oldest !== scooterIdRef.current) {
          const oldRig = rigsRef.current[oldest];
          if (oldRig) {
            disposeScooterRig(oldRig);
            delete rigsRef.current[oldest];
            delete rigPaintKeyRef.current[oldest];
          }
        }
      }
    };

    const existingRig = rigsRef.current[sc.id];
    if (
      existingRig &&
      rigPaintKeyRef.current[sc.id] === paintKey &&
      existingRig.body.width > 0 &&
      existingRig.rearWheel.width > 0 &&
      existingRig.frontWheel.width > 0
    ) {
      rigOrderRef.current = rigOrderRef.current.filter((item) => item !== sc.id);
      rigOrderRef.current.push(sc.id);
      preloadAllScooterSprites(sc.id);
      return;
    }

    loadScooterImageCached(sc, true).then((img) => {
      preloadAllScooterSprites(sc.id);
      if (!img) return;
      imagesRef.current[sc.id] = img;
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        const rig = prepareScooterWheelRig(sc.id, img, paint, f3UnderglowOverride);
        storeRig(sc.id, rig);
        if (!rig && (paint?.primary || paint?.secondary || f3UnderglowOverride !== undefined)) {
          const fb = renderPaintedScooterCanvas(img, sc.id, paint, undefined, f3UnderglowOverride);
          if (fb) paintedFallbackRef.current[sc.id] = fb;
        } else {
          delete paintedFallbackRef.current[sc.id];
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [scooterId, activePaintKey, underglowId]);

  // Free all offscreen wheel-rig canvases on unmount
  useEffect(() => {
    return () => {
      const rigs = rigsRef.current;
      for (const key of Object.keys(rigs) as ScooterId[]) {
        const rig = rigs[key];
        if (rig) {
          disposeScooterRig(rig);
          delete rigs[key];
        }
      }
      rigPaintKeyRef.current = {};
      paintedFallbackRef.current = {};
      rigOrderRef.current = [];
    };
  }, []);

  // Reset run physics when starting a new run or returning to menu/shop
  useEffect(() => {
    const sim = simRef.current;
    if (mode === 'play') {
      sim.a = 0;
      sim.w = 0;
      sim.kmh = 8;
      sim.spd = 90;
      sim.pend = 0;
      sim.lost = 0;
      sim.wheelieM = 0;
      sim.oh = 0;
      sim.ohTime = 0;
      sim.nh = 0;
      sim.nhTime = 0;
      sim.knee = 0;
      sim.stem = 0;
      sim.flamingo = 0;
      sim.ct = 0;
      sim.shown = false;
      sim.msgs = [];
      sim.sparks = [];
      sim.dust = [];
      sim.shake = 0;
      sim.slowMo = 0;
      sim.thrustShift = 0;
      sim.burnout = 0;
      sim.launchSurge = 0;
      sim.launchCooldown = 0;
      sim.prevThrottle = false;
      sim.wasBurnout = false;
      sim.fenderScraping = false;
      sim.fenderScrapeGlow = 0;
      sim.rearSusp = 0;
      sim.rearSuspVel = 0;
      sim.frontSusp = 0;
      sim.frontSuspVel = 0;
      sim.ragdoll.active = false;
      sim.crashScooter.active = false;
    } else if (mode === 'menu' || mode === 'shop' || mode === 'helmets' || mode === 'outfits') {
      sim.a = 0;
      sim.w = 0;
      sim.pend = 0;
      sim.wheelieM = 0;
      sim.oh = 0;
      sim.ohTime = 0;
      sim.nh = 0;
      sim.nhTime = 0;
      sim.knee = 0;
      sim.stem = 0;
      sim.flamingo = 0;
      sim.shown = false;
      sim.msgs = [];
      sim.sparks = [];
      sim.dust = [];
      sim.shake = 0;
      sim.slowMo = 0;
      sim.thrustShift = 0;
      sim.burnout = 0;
      sim.launchSurge = 0;
      sim.launchCooldown = 0;
      sim.prevThrottle = false;
      sim.wasBurnout = false;
      sim.fenderScraping = false;
      sim.fenderScrapeGlow = 0;
      sim.rearSusp = 0;
      sim.rearSuspVel = 0;
      sim.frontSusp = 0;
      sim.frontSuspVel = 0;
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
      const cssW = cv.clientWidth || window.innerWidth || 390;
      const cssH = cv.clientHeight || window.innerHeight || 700;
      const nextW = Math.max(1, Math.floor(cssW * dpr));
      const nextH = Math.max(1, Math.floor(cssH * dpr));
      if (
        cv.width === nextW &&
        cv.height === nextH &&
        simRef.current.W === nextW &&
        simRef.current.H === nextH
      ) {
        return;
      }
      const W = (cv.width = nextW);
      const H = (cv.height = nextH);
      simRef.current.W = W;
      simRef.current.H = H;
      simRef.current.u = Math.max(0.25, Math.min(W / 430, H / 800));
      simRef.current.camX = 0;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    vv?.addEventListener('resize', resize);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(cv);

    const getCamera = () => {
      const sim = simRef.current;
      const { W, H, u } = sim;
      const isPortrait = W < H;
      const curSpec = getScooter(scooterIdRef.current);
      const curDrawW = curSpec.spriteH * curSpec.aspect;
      // On portrait phones keep asphalt higher (above GAS/BRAKE touch buttons) and adapt scale to wide pitbikes (Stark VARG / Sur-Ron) so nothing ever clips off-screen
      const ry = isPortrait ? H * 0.59 : H * 0.64;
      const portraitFitW = Math.max(500, curDrawW * 1.72);
      const scScale = isPortrait
        ? Math.min(u, W / portraitFitW, (H * 0.40) / 285)
        : Math.min(u, W / Math.max(620, curDrawW * 1.95), (H * 0.46) / 270);
      const wheelieT = Math.min(1, Math.max(0, sim.a / 88));
      const targetPivotX = isPortrait
        ? W * (0.28 + wheelieT * 0.34)
        : W * (0.36 + wheelieT * 0.05);
      const pivotX = sim.camX > 1 ? sim.camX : targetPivotX;
      return { ry, scScale, pivotX, targetPivotX, isPortrait };
    };

    let rafId = 0;
    let lastTime = 0;

    const getMetrics = (s: ScooterSpec) => {
      const drawH = s.spriteH;
      const drawW = drawH * s.aspect;
      // Pin wheelie pivot (0, 0) & asphalt contact directly to pixel-measured rear wheel center/radius so tires never sink, float, or bob during wheelies
      const wheelCfg = SCOOTER_WHEEL_CONFIGS[s.id];
      const rearX = wheelCfg ? wheelCfg.rear.cx : s.rearX;
      const rearY = wheelCfg ? wheelCfg.rear.cy : s.rearY;
      const frontX = wheelCfg ? wheelCfg.front.cx : s.frontX;
      const frontY = wheelCfg ? wheelCfg.front.cy : s.frontY;
      const imgX = -rearX * drawW;
      const imgY = -rearY * drawH;
      const wheelBottom = wheelCfg ? wheelCfg.rear.rH * drawH : (s.bottomY - s.rearY) * drawH;
      const frontWheelX = imgX + frontX * drawW;
      const frontWheelY = (frontY - rearY) * drawH;
      const deckY = imgY + s.deckY * drawH;
      const backFootX = imgX + s.backFootX * drawW;
      const backFootY = s.backFootY !== undefined ? imgY + s.backFootY * drawH : deckY - 3;
      const frontFootX = imgX + s.frontFootX * drawW;
      const gripX = imgX + s.gripX * drawW;
      const gripY = imgY + s.gripY * drawH;
      const seatX = s.seatX !== undefined ? imgX + s.seatX * drawW : (backFootX + frontFootX) * 0.48;
      const seatY = s.seatY !== undefined ? imgY + s.seatY * drawH : deckY - 70;
      const headlightX =
        s.headlightX !== undefined
          ? imgX + s.headlightX * drawW
          : s.seated
            ? gripX + 0.095 * drawW
            : Math.max(gripX + 10, (gripX + frontWheelX) * 0.52);
      const headlightY =
        s.headlightY !== undefined
          ? imgY + s.headlightY * drawH
          : gripY + (deckY - gripY) * 0.24;
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
        backFootY,
        frontFootX,
        gripX,
        gripY,
        seatX,
        seatY,
        headlightX,
        headlightY,
      };
    };

    const getRiderPose = (
      s: ScooterSpec,
      m: ReturnType<typeof getMetrics>,
      leanDeg = 0,
      oneHand = 0,
      ohTime = 0,
      knee = 0,
      stemFoot = 0,
      noHands = 0,
      nhTime = 0,
      suspDip = 0,
      flamingo = 0
    ): RiderPose => {
      // Smooth Wheelie Life style ease & natural sweeping arm/leg arcs
      const nh = Math.max(0, Math.min(1, noHands));
      const nhEase = nh * nh * (3 - 2 * nh);
      const oh = Math.max(0, Math.min(1, oneHand));
      const ohEase = oh * oh * (3 - 2 * oh) * (1 - nhEase);
      const kn = Math.max(0, Math.min(1, knee));
      const knEase = kn * kn * (3 - 2 * kn);
      const st = Math.max(0, Math.min(1, stemFoot));
      const stEase = st * st * (3 - 2 * st);
      const fl = s.seated ? Math.max(0, Math.min(1, flamingo)) : 0;
      const flEase = fl * fl * (3 - 2 * fl);
      const swingArc = Math.sin(ohEase * Math.PI);
      const nhArc = Math.sin(nhEase * Math.PI);
      const liftArc = Math.sin(stEase * Math.PI);
      const waveY = Math.sin(ohTime * 6.5) * 4.5 * ohEase;
      const waveX = Math.cos(ohTime * 3.8) * 3.2 * ohEase;
      const nhWaveY = Math.sin(nhTime * 8.2) * 3.8 * nhEase;
      const nhWaveX = Math.cos(nhTime * 5.1) * 2.6 * nhEase;

      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

      if (s.seated) {
        // Seated moto / One-Knee on seat / Both Legs on Steering Column / Flamingo (standing 1-peg) / No-Hander
        const baseSeatedHipX = m.seatX - ohEase * 4 - nhEase * 6 + knEase * 4 - stEase * 7;
        const baseSeatedHipY = m.seatY - 5 - knEase * 27 - stEase * 3;
        const flHipX = m.backFootX + 2 - ohEase * 4 - nhEase * 6;
        const flHipY = m.seatY - 19;
        const hipX = lerp(baseSeatedHipX, flHipX, flEase);
        const hipY = lerp(baseSeatedHipY, flHipY, flEase);
        const baseKneeX = hipX + (m.frontFootX - hipX) * 0.72 + 13;
        const baseKneeY = m.seatY - 5 + (m.deckY - (m.seatY - 5)) * 0.36;

        // Steering column anchor (BOTH feet planted high on steering column / bar clamp, staggered for 3D clarity)
        const stemBaseX = m.frontWheelX - 10;
        const stemBaseY = m.deckY - 22;
        const stemFootX = lerp(m.gripX, stemBaseX, 0.30) + 3;
        const stemFootY = lerp(m.gripY, stemBaseY, 0.28);
        const backStemFootX = stemFootX + 5.5;
        const backStemFootY = stemFootY - 8.5;

        const knBackKneeX = lerp(baseKneeX, m.backFootX + 10, knEase);
        const knBackKneeY = lerp(baseKneeY + 2, m.deckY - 38, knEase);
        const knBackFootX = lerp(m.frontFootX, m.backFootX - 6, knEase);
        const knBackFootY = m.deckY - 2;

        const stBackKneeX = lerp(knBackKneeX, lerp(hipX, backStemFootX, 0.52) + 11, stEase);
        const stBackKneeY = lerp(knBackKneeY, backStemFootY - 15, stEase);
        const stBackFootX = lerp(knBackFootX, backStemFootX, stEase) - liftArc * 4;
        const stBackFootY = lerp(knBackFootY, backStemFootY, stEase) - liftArc * 11;

        // Flamingo back leg stands tall on the rear footpeg while front leg tucks high like a flamingo!
        const flBackFootX = m.backFootX;
        const flBackFootY = m.deckY - 2;
        const flBackKneeX = m.backFootX + 7;
        const flBackKneeY = (flHipY + flBackFootY) * 0.52;

        const backKneeX = lerp(stBackKneeX, flBackKneeX, flEase);
        const backKneeY = lerp(stBackKneeY, flBackKneeY, flEase);
        const backFootX = lerp(stBackFootX, flBackFootX, flEase);
        const backFootY = lerp(stBackFootY, flBackFootY, flEase);

        const knFrontKneeX = lerp(baseKneeX, m.seatX + 12, knEase);
        const knFrontKneeY = lerp(baseKneeY + 2, m.seatY - 5, knEase);
        const knFrontFootX = lerp(m.frontFootX, m.seatX - 22, knEase);
        const knFrontFootY = lerp(m.deckY - 2, m.seatY - 10, knEase);

        const stFrontKneeX = lerp(knFrontKneeX, lerp(hipX, stemFootX, 0.48) + 5, stEase);
        const stFrontKneeY = lerp(knFrontKneeY, stemFootY - 12, stEase);
        const stFrontFootX = lerp(knFrontFootX, stemFootX, stEase) - liftArc * 5;
        const stFrontFootY = lerp(knFrontFootY, stemFootY, stEase) - liftArc * 10;

        const flFrontKneeX = flHipX + 25;
        const flFrontKneeY = flHipY - 12;
        const flFrontFootX = flFrontKneeX - 19;
        const flFrontFootY = flFrontKneeY + 22;

        const frontKneeX = lerp(stFrontKneeX, flFrontKneeX, flEase);
        const frontKneeY = lerp(stFrontKneeY, flFrontKneeY, flEase);
        const frontFootX = lerp(stFrontFootX, flFrontFootX, flEase);
        const frontFootY = lerp(stFrontFootY, flFrontFootY, flEase);

        // Upright/laid-back torso lean while riding one-handed, no-handed, flamingo, or both legs on steering column
        const shoulderX =
          hipX + 17 + leanDeg * 0.16 - ohEase * 13 - nhEase * 18 - knEase * 2 - stEase * 6 + flEase * 3;
        const shoulderY =
          Math.min(hipY - 56, m.gripY + 2 - knEase * 16 + flEase * 2) + ohEase * 2 - nhEase * 4 + stEase * 2;
        const headX = shoulderX + 5 - ohEase * 2 - nhEase * 3 - stEase * 2 + flEase;
        const headY = shoulderY - 26;

        // Back arm: grips bar normally, throws wide back-up during No-Hander!
        const gripBackElbowX = (shoulderX + m.gripX) * 0.5 + 1;
        const gripBackElbowY = (shoulderY + m.gripY) * 0.5 + (8 - ohEase * 4);
        const nhBackElbowX = shoulderX - 24;
        const nhBackElbowY = shoulderY - 15 + nhWaveY * 0.5;
        const nhBackHandX = shoulderX - 46 - nhWaveX;
        const nhBackHandY = shoulderY - 43 + nhWaveY;

        // Front arm: grips bar, throws back for 1-Hander, or throws forward-up V-wings for No-Hander!
        const baseElbowX = (shoulderX + m.gripX) * 0.5 - 2;
        const baseElbowY = (shoulderY + m.gripY) * 0.5 + 11;
        const ohElbowX = shoulderX - 26;
        const ohElbowY = shoulderY - 14 + waveY * 0.45;
        const ohHandX = shoulderX - 43 + waveX;
        const ohHandY = shoulderY - 45 + waveY;

        const nhFrontElbowX = shoulderX + 22;
        const nhFrontElbowY = shoulderY - 18 - nhWaveY * 0.45;
        const nhFrontHandX = shoulderX + 44 + nhWaveX;
        const nhFrontHandY = shoulderY - 46 - nhWaveY;

        const fElbowAfterOhX = baseElbowX + (ohElbowX - baseElbowX) * ohEase - swingArc * 6;
        const fElbowAfterOhY = baseElbowY + (ohElbowY - baseElbowY) * ohEase + swingArc * 12;
        const fHandAfterOhX = m.gripX + (ohHandX - m.gripX) * ohEase - swingArc * 10;
        const fHandAfterOhY = m.gripY + (ohHandY - m.gripY) * ohEase + swingArc * 18;

        return {
          seated: true,
          hip: { x: hipX, y: hipY },
          shoulder: { x: shoulderX, y: shoulderY },
          head: { x: headX, y: headY },
          backKnee: { x: backKneeX, y: backKneeY },
          backFoot: { x: backFootX, y: backFootY },
          frontKnee: { x: frontKneeX, y: frontKneeY },
          frontFoot: { x: frontFootX, y: frontFootY },
          backElbow: {
            x: lerp(gripBackElbowX, nhBackElbowX, nhEase) - nhArc * 5,
            y: lerp(gripBackElbowY, nhBackElbowY, nhEase) + nhArc * 8,
          },
          backHand: {
            x: lerp(m.gripX, nhBackHandX, nhEase) - nhArc * 8,
            y: lerp(m.gripY, nhBackHandY, nhEase) + nhArc * 12,
          },
          frontElbow: {
            x: lerp(fElbowAfterOhX, nhFrontElbowX, nhEase) + nhArc * 4,
            y: lerp(fElbowAfterOhY, nhFrontElbowY, nhEase) + nhArc * 6,
          },
          frontHand: {
            x: lerp(fHandAfterOhX, nhFrontHandX, nhEase) + nhArc * 6,
            y: lerp(fHandAfterOhY, nhFrontHandY, nhEase) + nhArc * 10,
          },
          frontFootAngle: stEase > 0.01 || flEase > 0.01 ? -0.52 * stEase + 0.62 * flEase : undefined,
          backFootAngle: stEase > 0.01 ? -0.58 * stEase : undefined,
          hideBackLeg: knEase < 0.03 && stEase < 0.03 && flEase < 0.03,
        };
      }

      const stemH = Math.max(120, m.deckY - m.gripY);
      const dip = Math.max(-1.5, Math.min(5.5, suspDip));
      const standHipX =
        Math.max(m.backFootX + 14, (m.backFootX + m.frontFootX) * 0.54) -
        ohEase * 5 -
        nhEase * 7 -
        stEase * 4;
      const standHipY = m.deckY - stemH * 0.59 + dip + ohEase * 2 + stEase * 2;
      // Dropping onto one knee: hips drop lower over the rear deck while torso stays upright
      const hipX = lerp(standHipX, m.backFootX + 4 - ohEase * 4 - nhEase * 5, knEase);
      const hipY = lerp(standHipY, m.deckY - stemH * 0.34 + dip * 0.6 + ohEase * 2, knEase);

      // Classic standing-scooter «рулевая»: back foot stays planted on rear kicktail/bugel, front foot lifts onto steering column!
      const stemBaseX = m.frontWheelX - 14;
      const stemBaseY = m.deckY - 6;
      const stemFootX = lerp(m.gripX, stemBaseX, 0.38) + 1;
      const stemFootY = lerp(m.gripY, stemBaseY, 0.38);

      // Back leg stands firmly on rear fender kicktail or rear wheelie bugel (G2 Pro)
      const backFootX = lerp(m.backFootX, m.backFootX - 6, knEase) - stEase * 2;
      const backFootY = lerp(m.backFootY, m.deckY - 4.8, knEase);
      const backKneeX = lerp(
        m.backFootX + 10 + dip * 0.45 - ohEase * 2 - stEase * 3,
        m.backFootX + 14,
        knEase
      );
      const backKneeY = lerp(
        backFootY - stemH * 0.28 + dip * 0.55 + stEase * 2,
        m.deckY - stemH * 0.25 + dip * 0.4,
        knEase
      );

      // Front leg: stands cleanly on deck ahead of rear foot, one-knee on deck, or lifted onto steering column
      const knFrontKneeX = lerp(m.frontFootX + 6 + dip * 0.55 - ohEase * 2, m.frontFootX + 1, knEase);
      const knFrontKneeY = lerp(m.deckY - stemH * 0.29 + dip * 0.6, m.deckY - 6, knEase);
      const knFrontFootX = lerp(m.frontFootX, m.backFootX + 4, knEase);
      const knFrontFootY = lerp(m.deckY - 4.8, m.deckY - 13, knEase);

      const frontKneeX = lerp(knFrontKneeX, lerp(hipX, stemFootX, 0.5) + 7, stEase);
      const frontKneeY = lerp(knFrontKneeY, Math.min(hipY - 2, stemFootY - 11), stEase);
      const frontFootX = lerp(knFrontFootX, stemFootX, stEase) - liftArc * 4;
      const frontFootY = lerp(knFrontFootY, stemFootY, stEase) - liftArc * 9;

      // Classic Wheelie Life laid-back balance-point torso lean (extra open chest during No-Hander)
      const shoulderX = lerp(
        standHipX + 11 + leanDeg * 0.14 - ohEase * 15 - nhEase * 17 - stEase * 3,
        hipX + 14 + leanDeg * 0.12 - ohEase * 12 - nhEase * 15,
        knEase
      );
      const shoulderY = lerp(
        m.deckY - stemH * 1.03 + dip * 0.82 + ohEase * 3 - nhEase * 4 + stEase * 2,
        m.deckY - stemH * 0.82 + dip * 0.55 + ohEase * 3 - nhEase * 4,
        knEase
      );
      const headX = shoulderX + 4 - ohEase * 2.5 - nhEase * 3 - stEase * 1;
      const headY = shoulderY - 27;

      // Left/back arm: grips bar normally, throws wide back-up during No-Hander!
      const gripBackElbowX = (shoulderX + m.gripX) * 0.5 + 1;
      const gripBackElbowY = (shoulderY + m.gripY) * 0.5 + (8 - ohEase * 4.5 - stEase * 2);
      const nhBackElbowX = shoulderX - 25;
      const nhBackElbowY = shoulderY - 16 + nhWaveY * 0.5;
      const nhBackHandX = shoulderX - 48 - nhWaveX;
      const nhBackHandY = shoulderY - 45 + nhWaveY;

      const baseElbowX = (shoulderX + m.gripX) * 0.5 - 3;
      const baseElbowY = (shoulderY + m.gripY) * 0.5 + (12 - stEase * 2);
      // High, wide Wheelie Life One-Hander arm throw & chill float
      const ohElbowX = shoulderX - 27;
      const ohElbowY = shoulderY - 14 + waveY * 0.45;
      const ohHandX = shoulderX - 44 + waveX;
      const ohHandY = shoulderY - 47 + waveY;

      // Front arm opens wide forward-up in full «БЕЗ РУК» V-stunt pose!
      const nhFrontElbowX = shoulderX + 23;
      const nhFrontElbowY = shoulderY - 19 - nhWaveY * 0.45;
      const nhFrontHandX = shoulderX + 45 + nhWaveX;
      const nhFrontHandY = shoulderY - 48 - nhWaveY;

      const fElbowAfterOhX = baseElbowX + (ohElbowX - baseElbowX) * ohEase - swingArc * 6;
      const fElbowAfterOhY = baseElbowY + (ohElbowY - baseElbowY) * ohEase + swingArc * 12;
      const fHandAfterOhX = m.gripX + (ohHandX - m.gripX) * ohEase - swingArc * 10;
      const fHandAfterOhY = m.gripY + (ohHandY - m.gripY) * ohEase + swingArc * 18;

      return {
        seated: false,
        hip: { x: hipX, y: hipY },
        shoulder: { x: shoulderX, y: shoulderY },
        head: { x: headX, y: headY },
        backKnee: { x: backKneeX, y: backKneeY },
        backFoot: { x: backFootX, y: backFootY },
        frontKnee: { x: frontKneeX, y: frontKneeY },
        frontFoot: { x: frontFootX, y: frontFootY },
        backElbow: {
          x: lerp(gripBackElbowX, nhBackElbowX, nhEase) - nhArc * 5,
          y: lerp(gripBackElbowY, nhBackElbowY, nhEase) + nhArc * 8,
        },
        backHand: {
          x: lerp(m.gripX, nhBackHandX, nhEase) - nhArc * 8,
          y: lerp(m.gripY, nhBackHandY, nhEase) + nhArc * 12,
        },
        frontElbow: {
          x: lerp(fElbowAfterOhX, nhFrontElbowX, nhEase) + nhArc * 4,
          y: lerp(fElbowAfterOhY, nhFrontElbowY, nhEase) + nhArc * 6,
        },
        frontHand: {
          x: lerp(fHandAfterOhX, nhFrontHandX, nhEase) + nhArc * 6,
          y: lerp(fHandAfterOhY, nhFrontHandY, nhEase) + nhArc * 10,
        },
        backFootAngle:
          s.backFootAngle !== undefined && knEase < 0.99
            ? s.backFootAngle * (1 - knEase)
            : undefined,
      };
    };

    const drawRider = (
      s: ScooterSpec,
      m: ReturnType<typeof getMetrics>,
      wheelieAngle = 0,
      oneHand = 0,
      ohTime = 0,
      knee = 0,
      stemFoot = 0,
      noHands = 0,
      nhTime = 0,
      suspDip = 0,
      flamingo = 0
    ) => {
      const leanDeg = Math.min(25, wheelieAngle * 0.35);
      const p = getRiderPose(
        s,
        m,
        leanDeg,
        oneHand,
        ohTime,
        knee,
        stemFoot,
        noHands,
        nhTime,
        suspDip,
        flamingo
      );
      const kn = Math.max(0, Math.min(1, knee));
      const knEase = kn * kn * (3 - 2 * kn);
      const st = Math.max(0, Math.min(1, stemFoot));
      const stEase = st * st * (3 - 2 * st);
      const fl = s.seated ? Math.max(0, Math.min(1, flamingo)) : 0;
      const flEase = fl * fl * (3 - 2 * fl);
      // Counter-rotate head forward so rider looks FORWARD down the road while doing a wheelie (not backward/up!)
      const wheelieRad = (Math.max(0, wheelieAngle) * Math.PI) / 180;
      const lookForward = Math.min(1.42, wheelieRad * 0.9);
      drawStyledRider(
        ctx,
        {
          ...p,
          headAngle: lookForward + 0.04 * knEase + 0.03 * stEase + 0.03 * flEase,
          flatFeet: true,
          kneeling: knEase,
          frontFootAngle: p.frontFootAngle ?? (stEase > 0.01 ? -0.52 * stEase : undefined),
          backFootAngle: p.backFootAngle ?? (s.seated && stEase > 0.01 ? -0.58 * stEase : undefined),
          hideBackLeg: p.hideBackLeg,
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
      const { u } = sim;
      const { ry, pivotX, scScale } = getCamera();
      const pivotY = ry - m.wheelBottom * scScale;
      const rad = (-sim.a * Math.PI) / 180;
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);

      const toWorld = (pt: Pt): Pt => ({
        x: pivotX + (pt.x * cosR - pt.y * sinR) * scScale,
        y: pivotY + (pt.x * sinR + pt.y * cosR) * scScale,
      });

      const pose = getRiderPose(
        s,
        m,
        Math.min(25, sim.a * 0.35),
        sim.oh,
        sim.ohTime,
        sim.knee,
        sim.stem,
        sim.nh,
        sim.nhTime,
        0,
        sim.flamingo
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
          r: radii[idx] * scScale * 1.16,
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

      // Launch scooter/pitbike cleanly around its Center of Mass (authentic loop-out!)
      const comX = m.frontWheelX * 0.46;
      const comY = s.seated ? (m.seatY + m.deckY) * 0.42 : (m.deckY + m.gripY) * 0.34;
      const comWorld = toWorld({ x: comX, y: comY });
      sim.crashScooter = {
        active: true,
        x: comWorld.x,
        y: comWorld.y,
        comX,
        comY,
        vx: (96 + Math.min(95, sim.spd * 0.24)) * u,
        vy: -155 * u,
        angle: sim.a,
        angVel: 115 + Math.random() * 45,
        scrapeTimer: 0,
      };

      sim.shake = 7.5 * u;
      sim.slowMo = 0.22;
      emitSparks(pivotX, ry, 10, -1);
      emitDust(pivotX, ry, 5, 1.1);
    };

    const drawRagdoll = (s: ScooterSpec, rag: RagdollState) => {
      if (!rag.active || rag.nodes.length < 11) return;
      const { ry, scScale } = getCamera();
      const u = scScale;
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

    const getActiveScrapeSpec = (
      s: ScooterSpec,
      m: ReturnType<typeof getMetrics>
    ): {
      bLocalX: number;
      bLocalY: number;
      kind: 'fender' | 'bugel';
      pad: number;
      touchDeg: number;
      maxCushionDeg: number;
      loopOutDeg: number;
    } | null => {
      if (
        (s.scrapeKind === 'fender' || s.scrapeKind === 'bugel') &&
        s.fenderX !== undefined &&
        s.fenderY !== undefined
      ) {
        const bLocalX = m.imgX + s.fenderX * m.drawW;
        const bLocalY = m.imgY + s.fenderY * m.drawH;
        let touchDeg = 94;
        for (let deg = 72; deg <= 126; deg += 0.5) {
          const rad = (-deg * Math.PI) / 180;
          const clearance = m.wheelBottom - (bLocalX * Math.sin(rad) + bLocalY * Math.cos(rad));
          if (clearance <= 2) {
            touchDeg = deg;
            break;
          }
        }
        return {
          bLocalX,
          bLocalY,
          kind: s.scrapeKind,
          pad: s.scrapePadPx ?? 5.5,
          touchDeg,
          maxCushionDeg: touchDeg + 5.5,
          loopOutDeg: Math.max(102, touchDeg + 8.5),
        };
      }
      return null;
    };

    const drawScooterAndRider = (s: ScooterSpec, withRider: boolean, wheelieAngle: number) => {
      const m = getMetrics(s);
      const sim = simRef.current;
      const rig = rigsRef.current[s.id];
      const sprite = imagesRef.current[s.id] ?? SCOOTER_IMAGE_CACHE[s.id];

      const rigValid = Boolean(
        rig &&
          rig.body.width > 0 &&
          rig.rearWheel.width > 0 &&
          rig.frontWheel.width > 0
      );

      // Locked damped suspension compression: wheels stay 100% round & concentric with swingarms!
      const isCrashRender = !withRider || modeRef.current === 'crash';
      const groundWeight = isCrashRender ? 0 : Math.max(0, Math.min(1, 1 - sim.a / 3.5));
      const rearDrop = isCrashRender ? 0 : Math.max(-1.0, Math.min(2.0, sim.rearSusp * 0.4));
      const frontTargetDrop = isCrashRender ? 0 : Math.max(-1.0, Math.min(2.4, sim.frontSusp * 0.4));
      const frontDrop = rearDrop + (frontTargetDrop - rearDrop) * groundWeight;
      const suspPitch =
        isCrashRender || groundWeight <= 0.01
          ? 0
          : Math.atan2(frontDrop - rearDrop, Math.max(80, m.frontWheelX));
      const riderDip = isCrashRender
        ? 0
        : Math.max(-1.5, Math.min(5.5, sim.rearSusp * 0.65 + sim.frontSusp * 0.6 * groundWeight));

      // Draw real-pixel spinning wheels BEHIND the real swingarms, forks & scooter body
      if (rigValid && rig) {
        ctx.save();
        if (s.baseTiltDeg !== 0) {
          ctx.rotate((s.baseTiltDeg * Math.PI) / 180);
        }
        ctx.translate(0, rearDrop);
        if (suspPitch !== 0) ctx.rotate(suspPitch);

        // 1) Spinning rear wheel (100% circular, zero squash, zero white stripes!)
        const rCx = m.imgX + rig.rear.cx * m.drawW;
        const rCy = m.imgY + rig.rear.cy * m.drawH;
        const rDraw = rig.rear.rH * m.drawH * rig.rear.padScale;
        ctx.save();
        ctx.translate(rCx, rCy);
        ctx.rotate(sim.rearSpin);
        ctx.drawImage(rig.rearWheel, -rDraw, -rDraw, rDraw * 2, rDraw * 2);
        ctx.restore();

        // 2) Spinning front wheel (100% circular, locked concentrically inside front swingarm/fork!)
        const fCx = m.imgX + rig.front.cx * m.drawW;
        const fCy = m.imgY + rig.front.cy * m.drawH;
        const fDraw = rig.front.rH * m.drawH * rig.front.padScale;
        ctx.save();
        ctx.translate(fCx, fCy);
        ctx.rotate(sim.frontSpin);
        ctx.drawImage(rig.frontWheel, -fDraw, -fDraw, fDraw * 2, fDraw * 2);
        ctx.restore();

        // 3) Scooter body, swingarms, forks, calipers & fenders ON TOP
        ctx.drawImage(rig.body, m.imgX, m.imgY, m.drawW, m.drawH);
        ctx.restore();
      } else if (paintedFallbackRef.current[s.id]) {
        ctx.save();
        if (s.baseTiltDeg !== 0) {
          ctx.rotate((s.baseTiltDeg * Math.PI) / 180);
        }
        ctx.translate(0, rearDrop);
        if (suspPitch !== 0) ctx.rotate(suspPitch);
        ctx.drawImage(paintedFallbackRef.current[s.id]!, m.imgX, m.imgY, m.drawW, m.drawH);
        ctx.restore();
      } else if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        ctx.save();
        if (s.baseTiltDeg !== 0) {
          ctx.rotate((s.baseTiltDeg * Math.PI) / 180);
        }
        ctx.translate(0, rearDrop);
        if (suspPitch !== 0) ctx.rotate(suspPitch);
        ctx.drawImage(sprite, m.imgX, m.imgY, m.drawW, m.drawH);
        ctx.restore();
      }

      // Draw rider standing/kneeling on the scooter deck & holding handlebars (riding the suspended chassis!)
      if (withRider) {
        ctx.save();
        ctx.translate(0, rearDrop);
        if (suspPitch !== 0) ctx.rotate(suspPitch);
        drawRider(
          s,
          m,
          wheelieAngle,
          sim.oh,
          sim.ohTime,
          sim.knee,
          sim.stem,
          sim.nh,
          sim.nhTime,
          riderDip,
          sim.flamingo
        );
        ctx.restore();
      }
    };

    const update = (dt: number) => {
      const sim = simRef.current;
      sim.t += dt;
      const curMode = modeRef.current;
      const s = getScooter(scooterIdRef.current);
      const cam = getCamera();
      if (curMode !== 'crash') {
        if (sim.camX <= 1) {
          sim.camX = cam.targetPivotX;
        } else {
          sim.camX += (cam.targetPivotX - sim.camX) * Math.min(1, dt * 8.5);
        }
      }

      const gasOn = gasRef.current;
      const brkOn = brakeRef.current;
      const nhActive = noHandsRef.current;
      const throttleOn = curMode === 'play' && gasOn && !nhActive;
      // Stationary burnout when holding BOTH Gas + Brake while on 2 wheels (not in a wheelie/stunt!)
      const isBurnout = curMode === 'play' && gasOn && brkOn && !nhActive && sim.a < 5;
      sim.burnout += ((isBurnout ? 1 : 0) - sim.burnout) * Math.min(1, dt * (isBurnout ? 7.5 : 5.5));
      if (sim.burnout < 0.005) sim.burnout = 0;

      const effStats = getEffectiveScooterStats(
        s,
        hasVescRef.current,
        hasSecondMotorRef.current,
        akbIdRef.current
      );
      const hasVesc = hasVescRef.current;
      const hasSecondMotor = hasSecondMotorRef.current;
      const vescLaunch = hasVesc ? 1.38 : 1.0;
      const motorLaunch = hasSecondMotor ? 1.72 : 1.0;
      const launchMult = vescLaunch * motorLaunch;
      const lowRatio = Math.max(0, 1 - sim.kmh / Math.max(48, effStats.maxKmh * 0.62));

      // Smooth VESC + 2nd Motor launch impulse ("резкий подрыв с места") without double-tap stutter
      sim.launchCooldown = Math.max(0, sim.launchCooldown - dt);
      const activeDrive = curMode === 'play' && throttleOn && !brkOn && !nhActive;
      const justHitGas = activeDrive && (!sim.prevThrottle || sim.wasBurnout);
      const speedHeadroom = Math.max(0.18, 1 - sim.kmh / Math.max(35, effStats.maxKmh));
      const allowBigLaunch = sim.wasBurnout || (sim.kmh < 22 && sim.launchCooldown <= 0);
      if (justHitGas) {
        const hasUpgrades = hasVesc || hasSecondMotor;
        if (allowBigLaunch && (hasUpgrades || sim.wasBurnout || sim.kmh < 22)) {
          sim.launchCooldown = 0.85;
          const burnoutMult = sim.wasBurnout ? 1.3 : 1.0;
          const surgePeak = Math.min(
            1.45,
            (hasUpgrades ? 0.64 : 0.28) *
              (0.45 + 0.55 * speedHeadroom) *
              Math.min(2.05, launchMult) *
              burnoutMult
          );
          sim.launchSurge = Math.max(sim.launchSurge, surgePeak);

          if (sim.a < 18) {
            const popMult = hasVesc && hasSecondMotor ? 1.3 : hasSecondMotor ? 1.18 : hasVesc ? 1.1 : 0.85;
            sim.w += (4.5 + 6.5 * popMult) * (sim.a < 6 ? 1.1 : 0.65);
          }

          if (hasUpgrades || sim.wasBurnout) {
            const mLaunch = getMetrics(s);
            const { ry: ryLaunch, pivotX: pxLaunch, scScale: scLaunch } = getCamera();
            sim.shake = Math.max(
              sim.shake,
              (hasSecondMotor && hasVesc ? 2.2 : hasSecondMotor ? 1.6 : 1.1) * sim.u
            );
            emitDust(
              pxLaunch - 6 * scLaunch,
              ryLaunch + 1 * scLaunch,
              hasSecondMotor ? 5 : 3,
              0.9
            );
            if (!s.seated && hasVesc && hasSecondMotor && mLaunch.wheelBottom > 0) {
              emitSparks(pxLaunch - 6 * scLaunch, ryLaunch, 4, -1);
            }
          }
        } else if (hasUpgrades) {
          // Rolling re-throttle: silky-smooth power surge with zero frame-skip, shake, or teleport
          sim.launchSurge = Math.max(sim.launchSurge, 0.28 * speedHeadroom);
        }
        // Visible rear shock squat whenever rider hits gas (smooth, no swingarm tear!)
        sim.rearSuspVel += 26 + 22 * sim.launchSurge;
      }
      if (activeDrive) {
        sim.launchSurge = Math.max(0, sim.launchSurge - dt * 2.1);
      } else {
        sim.launchSurge = Math.max(0, sim.launchSurge - dt * 4.8);
      }
      sim.prevThrottle = activeDrive;
      sim.wasBurnout = isBurnout;

      // Smoothly damped G-force squat/pullback so rapid double-taps never jerk the camera/bike
      const sfNow = curMode === 'play' ? Math.max(0, Math.min(1, (sim.kmh - 24) / 96)) : 0;
      const targetThrust =
        throttleOn && !brkOn
          ? -sim.W *
            (0.015 * sfNow +
              0.013 * lowRatio * Math.min(1.9, launchMult) +
              0.011 * sim.launchSurge)
          : 0;
      sim.thrustShift += (targetThrust - sim.thrustShift) * Math.min(1, dt * 7.2);

      // Realistic progressive scooter speedometer (km/h):
      // - Burnout holds the bike in place (0 km/h) while rear tire rips smoke
      // - No-Hands cuts throttle completely: can NEVER accelerate, but keeps rolling forward cleanly on momentum
      const prevKmh = sim.kmh;
      const targetKmh =
        curMode === 'play'
          ? isBurnout
            ? 0
            : brkOn
              ? Math.max(8, effStats.maxKmh * 0.14)
              : nhActive
                ? Math.max(18, effStats.maxKmh * 0.36)
                : throttleOn
                  ? Math.min(effStats.maxKmh, effStats.maxKmh * (0.96 + (sim.a / 102) * 0.06))
                  : Math.max(18, effStats.maxKmh * 0.44)
          : curMode === 'crash'
            ? 0
            : Math.round(Math.min(48, effStats.maxKmh * 0.36));
      const launchRateBonus =
        throttleOn && !brkOn
          ? (lowRatio * 1.65 + sim.launchSurge * 2.2) * effStats.power * launchMult
          : 0;
      const kmhRate =
        curMode === 'crash'
          ? 6.2
          : isBurnout
            ? 8.5
            : brkOn
              ? 5.0
              : nhActive
                ? 0.24
                : throttleOn
                  ? 1.4 + effStats.power * 0.65 + launchRateBonus
                  : 0.78;
      sim.kmh += (targetKmh - sim.kmh) * Math.min(1, dt * kmhRate);
      if (curMode === 'play' && throttleOn && !brkOn && !nhActive && (lowRatio > 0.06 || sim.launchSurge > 0.05)) {
        sim.kmh = Math.min(
          effStats.maxKmh,
          sim.kmh + dt * 42 * effStats.power * launchMult * (lowRatio + 0.55 * sim.launchSurge)
        );
      }
      if (curMode === 'play' && nhActive && sim.kmh > prevKmh) {
        sim.kmh = prevKmh;
      }
      if (sim.kmh < 0.25 && (curMode === 'crash' || isBurnout)) {
        sim.kmh = 0;
      }

      sound.updateMotor({
        active: curMode === 'play' && !pausedRef.current,
        scooterId: s.id,
        kmh: sim.kmh,
        maxKmh: effStats.maxKmh,
        throttleOn,
        brakeOn: brkOn,
        burnout: sim.burnout,
        hasVesc,
        hasSecondMotor,
        launchSurge: sim.launchSurge,
      });

      // World scroll velocity smoothly coupled to real km/h (high top-end feel with zero tap discontinuities)
      const kmhBaseBoost = Math.min(1, sim.kmh / 10) * 110;
      const highSpeedCurve = Math.max(0, sim.kmh - 70) * 3.8;
      const targetSpd =
        curMode === 'crash' || isBurnout
          ? 0
          : kmhBaseBoost +
            sim.kmh * 12.2 +
            highSpeedCurve +
            (throttleOn && !brkOn ? 18 + sim.launchSurge * 65 : 0);
      const spdRate =
        curMode === 'crash' || isBurnout ? 8.0 : 5.8 + sim.launchSurge * 4.5;
      sim.spd += (targetSpd - sim.spd) * Math.min(1, dt * spdRate);
      if (sim.spd < 0.8 && targetSpd === 0) sim.spd = 0;
      sim.off += (sim.spd * dt * sim.u) / 1.38;

      // Exact angular velocity per wheel clamped below Nyquist aliasing threshold (60-deg spoke symmetry)
      const mWheel = getMetrics(s);
      const rigWheel = rigsRef.current[s.id];
      const rearR = Math.max(12, rigWheel ? rigWheel.rear.rH * mWheel.drawH : mWheel.wheelBottom);
      const frontR = Math.max(12, rigWheel ? rigWheel.front.rH * mWheel.drawH : mWheel.wheelBottom);
      const roadLinearVel = Math.min(640, sim.spd / 1.45);
      const rearSlipMult =
        curMode === 'play'
          ? throttleOn
            ? 1.24 + sim.launchSurge * 0.65
            : brkOn
              ? 0.35
              : 1.0
          : 1.0;
      const rearAngVel = isBurnout
        ? (940 / rearR) * (0.85 + 0.3 * effStats.power)
        : (roadLinearVel / rearR) * rearSlipMult;
      const frontGroundAngVel = roadLinearVel / frontR;

      // Clamp per-frame angle step <= 0.34 rad so 60-deg symmetrical hubs never stroboscopically freeze!
      sim.rearSpin = (sim.rearSpin + Math.min(rearAngVel * dt, 0.34)) % (Math.PI * 2);
      const isAwd =
        s.id === 'g4max' ||
        s.id === 'thunder3' ||
        s.id === 'f3' ||
        s.id === 'g2ultra' ||
        s.id === 'gm' ||
        s.id === 'teverun';
      if (isBurnout) {
        // Front brake locks front wheel dead still during burnout!
        sim.frontSpinVel *= Math.exp(-16 * dt);
        sim.frontSpin = (sim.frontSpin + Math.min(sim.frontSpinVel * dt, 0.34)) % (Math.PI * 2);
      } else if (curMode === 'play' && sim.a > 6) {
        if (brkOn) {
          sim.frontSpinVel *= Math.exp(-5.8 * dt);
        } else if (isAwd && throttleOn) {
          // Dual-motor front hub keeps driving smoothly in mid-air while holding gas
          const awdAirVel = frontGroundAngVel * 1.12;
          sim.frontSpinVel += (awdAirVel - sim.frontSpinVel) * Math.min(1, dt * 8);
        } else {
          // Low-friction wheel bearing coast so front wheel stays visibly spinning through wheelies
          sim.frontSpinVel *= Math.exp(-0.14 * dt);
          const minCoast = frontGroundAngVel * 0.38;
          if (sim.frontSpinVel < minCoast) {
            sim.frontSpinVel += (minCoast - sim.frontSpinVel) * Math.min(1, dt * 3);
          }
        }
        sim.frontSpin = (sim.frontSpin + Math.min(sim.frontSpinVel * dt, 0.34)) % (Math.PI * 2);
      } else {
        // Smooth spin-up match when front wheel rolls on asphalt
        sim.frontSpinVel += (frontGroundAngVel - sim.frontSpinVel) * Math.min(1, dt * 16);
        sim.frontSpin = (sim.frontSpin + Math.min(sim.frontSpinVel * dt, 0.34)) % (Math.PI * 2);
      }

      if (curMode === 'play') {
        // Smooth Wheelie Life One-Hander (Ванхенд), No-Hander (Без рук), One-Knee (Колено) & Stem-Foot blends
        const ohTarget = oneHandRef.current && !nhActive ? 1 : 0;
        sim.oh += (ohTarget - sim.oh) * Math.min(1, dt * 10);
        if (sim.oh > 0.05) sim.ohTime += dt;

        const nhTarget = nhActive ? 1 : 0;
        sim.nh += (nhTarget - sim.nh) * Math.min(1, dt * 15);
        if (sim.nh > 0.05) sim.nhTime += dt;

        const kneeTarget = kneeRef.current ? 1 : 0;
        sim.knee += (kneeTarget - sim.knee) * Math.min(1, dt * 11);

        const stemTarget = stemFootRef.current ? 1 : 0;
        sim.stem += (stemTarget - sim.stem) * Math.min(1, dt * 11);

        // Flamingo stunt exclusively for electric pitbikes (s.seated); never active on standing scooters
        const flamingoTarget = s.seated && flamingoRef?.current ? 1 : 0;
        sim.flamingo += (flamingoTarget - sim.flamingo) * Math.min(1, dt * 11);
        if (!s.seated) sim.flamingo = 0;

        // Authentic wheelie physics up to 12 o'clock (90°) and loop-out at 13 o'clock (102°)
        // - Burnout keeps both wheels planted firmly on asphalt
        // - No-Hands («БЕЗ РУК») cuts throttle completely: cannot lift into a wheelie and drops down immediately if raised
        const effectiveGas = throttleOn && !isBurnout;
        const effectiveBrk = brkOn && !nhActive;
        const ohLift = !nhActive && !isBurnout && sim.a > 10 ? sim.oh * 5.2 : 0;
        const kneeLift = !nhActive && !isBurnout && sim.a > 10 ? sim.knee * 2.4 : 0;
        const stemLift = !nhActive && !isBurnout && sim.a > 10 ? sim.stem * 2.8 : 0;
        const flamingoLift = s.seated && !nhActive && !isBurnout && sim.a > 10 ? sim.flamingo * 3.0 : 0;
        const grav =
          sim.a <= 88
            ? (24 * sim.a) / 52
            : Math.max(-28, (24 * 88) / 52 - (sim.a - 88) * 3.8);
        const noHandsDrop = nhActive && sim.a > 0.5 ? 48 + sim.a * 0.58 : 0;

        if (nhActive && sim.w > 0) {
          // Instant loss of upward wheelie momentum the moment hands leave the handlebars
          sim.w *= Math.max(0, 1 - dt * 8.5);
        }

        if (isBurnout) {
          sim.a = Math.max(0, sim.a - dt * 45);
          sim.w = 0;
        } else {
          const prevA = sim.a;
          const prevW = sim.w;
          const angularDamp = 0.92;
          const wheeliePower = Math.pow(effStats.power, 0.58);
          const launchLiftKick =
            sim.a < 20
              ? 1 + (0.38 + 0.34 * Math.min(1.2, sim.launchSurge)) * (1 - sim.a / 20)
              : 1;
          sim.w +=
            ((effectiveGas ? 62 * wheeliePower * launchLiftKick : 0) +
              ohLift +
              kneeLift +
              stemLift +
              flamingoLift -
              (effectiveBrk ? 115 : 0) -
              grav -
              noHandsDrop) *
            dt;
          sim.w -= sim.w * angularDamp * dt;
          sim.a += sim.w * dt;
          if (sim.a < 0) {
            sim.a = 0;
            sim.w = 0;
            // Landing from a wheelie compresses front & rear shocks visibly ("аморты при падении")
            if (prevA > 2.2) {
              const dropImpact = Math.min(1, Math.max(0.22, Math.abs(prevW) / 92 + prevA / 74));
              sim.frontSuspVel += 72 + 110 * dropImpact;
              sim.rearSuspVel += 32 + 46 * dropImpact;
              sim.shake = Math.max(sim.shake, (0.9 + 2.0 * dropImpact) * sim.u);
              if (dropImpact > 0.35) {
                const mDrop = getMetrics(s);
                const { ry: ryDrop, pivotX: pxDrop, scScale: scDrop } = getCamera();
                emitDust(
                  pxDrop + mDrop.frontWheelX * scDrop,
                  ryDrop + 1 * scDrop,
                  Math.round(2 + dropImpact * 4),
                  0.75
                );
              }
            }
          }
          // Wheelie lift compresses rear shock when popping onto the rear wheel
          if (sim.a > 1 && sim.a < 28 && sim.w > 6 && activeDrive) {
            sim.rearSuspVel += 14 * dt * 60 * 0.14;
          }
        }

        // Damped spring-mass suspension physics (rear shock squat & front fork compression/rebound)
        const rearSpringK = 195;
        const rearDampC = 19.5;
        const frontSpringK = 205;
        const frontDampC = 20.0;
        const targetRearSquat =
          (throttleOn && !brkOn ? 1.5 + sim.launchSurge * 1.4 : 0) +
          (sim.a > 8 ? Math.min(2.6, (sim.a / 90) * 2.6) : 0) +
          sim.burnout * 1.6;
        const targetFrontSquat = (brkOn && sim.a < 3 ? 2.2 : 0) - (sim.a > 5 ? 0.6 : 0);
        sim.rearSuspVel +=
          ((targetRearSquat - sim.rearSusp) * rearSpringK - sim.rearSuspVel * rearDampC) * dt;
        sim.rearSusp = Math.max(-2.5, Math.min(5.5, sim.rearSusp + sim.rearSuspVel * dt));
        sim.frontSuspVel +=
          ((targetFrontSquat - sim.frontSusp) * frontSpringK - sim.frontSuspVel * frontDampC) * dt;
        sim.frontSusp = Math.max(-2.5, Math.min(6.0, sim.frontSusp + sim.frontSuspVel * dt));

        // Exact rear fender / bugel asphalt scrape (чирк) — triggers strictly on real physical contact!
        let fenderScraping = false;
        const mNow = getMetrics(s);
        const { ry: ryPlay, pivotX, scScale } = getCamera();
        const activeScrape = getActiveScrapeSpec(s, mNow);
        const loopOutDeg = activeScrape?.loopOutDeg ?? 102;
        if (activeScrape && sim.a >= Math.max(72, activeScrape.touchDeg - 4)) {
          const { bLocalX, bLocalY, pad, touchDeg, maxCushionDeg } = activeScrape;
          const rad = (-sim.a * Math.PI) / 180;
          const cosR = Math.cos(rad);
          const sinR = Math.sin(rad);
          const pivotY = ryPlay - mNow.wheelBottom * scScale;
          const tipX = pivotX + (bLocalX * cosR - bLocalY * sinR) * scScale;
          const tipY = pivotY + (bLocalX * sinR + bLocalY * cosR) * scScale;

          if (tipY >= ryPlay - pad * scScale) {
            fenderScraping = true;
            sim.fenderContactX = tipX;
            sim.fenderContactY = ryPlay;
            sim.fenderScrapeGlow = Math.min(1, sim.fenderScrapeGlow + dt * 10);

            // Real pitbike rear fender rides on the asphalt (cushions rotation smoothly in sweet spot!)
            if (sim.a < maxCushionDeg && sim.w > 0) {
              sim.w *= Math.max(0.14, 1 - dt * 11);
            }
            if (!brkOn && sim.a >= touchDeg - 1 && sim.a <= maxCushionDeg) {
              sim.w -= (sim.a - (touchDeg - 2)) * 2.1 * dt;
            }

            // Continuous dense molten spark fountain directly from the fender tip touching asphalt!
            const sparkCount = throttleOn ? 3 : 2;
            const sparkColors = ['#ffffff', '#fff7c2', '#ffd34d', '#ff922b', '#ff5a1f'];
            for (let si = 0; si < sparkCount; si++) {
              if (Math.random() < 0.85) {
                sim.sparks.push({
                  x: tipX + (Math.random() - 0.5) * 4 * scScale,
                  y: Math.min(ryPlay, tipY) - (1 + Math.random() * 2) * scScale,
                  vx: -(180 + Math.random() * 250 + sim.spd * 0.45) * sim.u,
                  vy: -(24 + Math.random() * 145) * sim.u,
                  life: 0.24 + Math.random() * 0.26,
                  maxLife: 0.5,
                  color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
                });
              }
            }

            // Crisp metallic asphalt scrape sound
            sound.playScrape(throttleOn ? 0.95 : 0.65);
          }
        }
        sim.fenderScraping = fenderScraping;
        if (!fenderScraping) {
          sim.fenderScrapeGlow = Math.max(0, sim.fenderScrapeGlow - dt * 7);
        }

        // Dense billowing white tire smoke, rubber embers & screech sound during Burnout!
        if (isBurnout) {
          sound.playBurnout(0.55 + sim.burnout * 0.45);
          const puffCount = sim.burnout > 0.45 ? 3 : 2;
          for (let bi = 0; bi < puffCount; bi++) {
            if (Math.random() < 0.92 && sim.dust.length < 130) {
              sim.dust.push({
                x: pivotX - (4 + Math.random() * 12) * scScale,
                y: ryPlay - (1 + Math.random() * 5) * scScale,
                vx: -(95 + Math.random() * 145) * sim.u,
                vy: -(28 + Math.random() * 68) * sim.u,
                r: (7 + Math.random() * 8) * scScale,
                grow: (34 + Math.random() * 26) * scScale,
                life: 0.55 + Math.random() * 0.35,
                maxLife: 0.9,
                alpha: 0.62,
                color: Math.random() < 0.55 ? '#f1f5f9' : '#cbd5e1',
              });
            }
          }
          // Occasional burnout embers strictly on electric kick-scooters (pitbike tires stay clean smoke-only)
          if (!s.seated && sim.burnout > 0.35 && Math.random() < dt * 18) {
            sim.sparks.push({
              x: pivotX - 6 * scScale,
              y: ryPlay - 2 * scScale,
              vx: -(140 + Math.random() * 170) * sim.u,
              vy: -(35 + Math.random() * 95) * sim.u,
              life: 0.18 + Math.random() * 0.16,
              maxLife: 0.34,
              color: Math.random() < 0.5 ? '#ff922b' : '#ffd34d',
            });
          }
        } else if (
          throttleOn &&
          !brkOn &&
          sim.a < 28 &&
          Math.random() < dt * (12 + 12 * lowRatio * Math.min(2, launchMult))
        ) {
          // Rear tire smoke on hard throttle takeoff
          sim.dust.push({
            x: pivotX - 8 * scScale,
            y: ryPlay - 1 * scScale,
            vx: -(85 + Math.random() * 75) * sim.u,
            vy: -(12 + Math.random() * 28) * sim.u,
            r: (4.5 + Math.random() * 5.5) * scScale,
            grow: (18 + Math.random() * 16) * scScale,
            life: 0.28 + Math.random() * 0.2,
            maxLife: 0.48,
          });
        }

        if (sim.a > 12) {
          const rate = sim.a < 50 ? 6 : sim.a < 78 ? 16 : 38;
          const hasNoHands = sim.nh > 0.4;
          const hasOh = sim.oh > 0.45 && !hasNoHands;
          const hasKnee = sim.knee > 0.45;
          const hasStem = sim.stem > 0.45;
          const hasFlamingo = s.seated && sim.flamingo > 0.45;
          const trickBonus =
            hasNoHands && hasFlamingo
              ? 2.2
              : hasNoHands && hasStem
                ? 2.15
                : hasNoHands && hasKnee
                  ? 2.0
                  : hasNoHands
                    ? 1.85
                    : hasOh && hasFlamingo
                      ? 1.8
                      : hasOh && hasStem
                        ? 1.75
                        : hasOh && hasKnee
                          ? 1.65
                          : hasFlamingo
                            ? 1.5
                            : hasStem
                              ? 1.4
                              : hasOh
                                ? 1.35
                                : hasKnee
                                  ? 1.3
                                  : 1;
          const scrapeBonus = fenderScraping ? 1.45 : 1;
          const vipMult = vipRef.current ? 2 : 1;
          sim.pend += rate * s.multiplier * trickBonus * scrapeBonus * vipMult * dt;
          sim.wheelieM += (sim.kmh / 3.6) * dt;
        } else {
          if (sim.pend > 0 && sim.a < 4) {
            const banked = Math.floor(sim.pend);
            sim.pend = 0;
            sim.wheelieM = 0;
            if (banked > 0) {
              if (banked > bestRunRef.current) {
                bestRunRef.current = banked;
                onNewBestRef.current(banked);
                sim.msgs.push({
                  t: `🏆 РЕКОРД +${banked}`,
                  l: 1.55,
                  color: '#ffd34d',
                });
              } else {
                sim.msgs.push({ t: `+${banked}`, l: 1.25, color: '#6dff8a' });
              }
              sound.playCoinBank(banked);
              onBankCoinsRef.current(banked);
            }
          }
        }

        // Loop-out & crash past 13 o'clock (or past pitbike rear fender / bugel limit)
        if (sim.a >= loopOutDeg && !sim.ragdoll.active) {
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
        const { ry, scScale } = getCamera();
        const groundY = ry + 4 * scScale;

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

        // 2) Update independent flying & tumbling scooter/pitbike physics around Center of Mass
        const cs = sim.crashScooter;
        if (cs.active && simDt > 0.0001) {
          const m = getMetrics(s);
          const scooterGroundY = ry + 3 * scScale;
          cs.vy += 1620 * u * simDt;
          cs.x += cs.vx * simDt;
          cs.y += cs.vy * simDt;
          cs.angle += cs.angVel * simDt;

          // Full convex hull contact check around vehicle center of mass
          const rad = (-cs.angle * Math.PI) / 180;
          const cosR = Math.cos(rad);
          const sinR = Math.sin(rad);
          const tailPt: Pt =
            s.fenderX !== undefined && s.fenderY !== undefined
              ? { x: m.imgX + s.fenderX * m.drawW, y: m.imgY + s.fenderY * m.drawH }
              : { x: m.imgX + 0.08 * m.drawW, y: s.seated ? m.seatY : m.deckY - 8 };
          const contactLocal: Pt[] = [
            { x: 0, y: m.wheelBottom },
            { x: -m.wheelBottom * 0.72, y: 0 },
            { x: m.frontWheelX, y: m.frontWheelY + m.wheelBottom },
            { x: m.frontWheelX + m.wheelBottom * 0.72, y: m.frontWheelY },
            { x: m.gripX, y: m.gripY },
            tailPt,
            { x: m.frontWheelX * 0.48, y: m.deckY },
          ];

          let maxPen = 0;
          let hitX = cs.x;
          let hitY = cs.y;
          let hitIdx = 0;
          for (let i = 0; i < contactLocal.length; i++) {
            const lx = contactLocal[i].x - cs.comX;
            const ly = contactLocal[i].y - cs.comY;
            const wx = cs.x + (lx * cosR - ly * sinR) * scScale;
            const wy = cs.y + (lx * sinR + ly * cosR) * scScale;
            const pen = wy - scooterGroundY;
            if (pen > maxPen) {
              maxPen = pen;
              hitX = wx;
              hitY = wy;
              hitIdx = i;
            }
          }

          if (maxPen > 0) {
            cs.y -= maxPen;
            hitY -= maxPen;
            const rx = hitX - cs.x;
            const ryOff = hitY - cs.y;
            const angVelRad = (cs.angVel * Math.PI) / 180;
            const vContactX = cs.vx + ryOff * angVelRad;
            const vContactY = cs.vy - rx * angVelRad;

            if (vContactY > 0) {
              const inertia = Math.max(900, 72 * scScale * (72 * scScale));
              const denomN = 1 + (rx * rx) / inertia;
              const restitution = vContactY > 115 * u ? 0.22 : 0;
              const jn = ((1 + restitution) * vContactY) / denomN;

              cs.vy -= jn;
              cs.angVel += ((rx * jn) / inertia) * (180 / Math.PI);

              const denomT = 1 + (ryOff * ryOff) / inertia;
              const mu = 0.44;
              const jtRaw = -vContactX / denomT;
              const jt = Math.max(-mu * jn, Math.min(mu * jn, jtRaw));
              cs.vx += jt;
              cs.angVel -= ((ryOff * jt) / inertia) * (180 / Math.PI);

              if (vContactY > 105 * u) {
                const metallic = hitIdx >= 4;
                emitSparks(hitX, ry + 1 * u, metallic ? 9 : 5, cs.vx >= 0 ? -1 : 1);
                emitDust(hitX, ry + 3 * u, 3, 0.85);
                sim.shake = Math.min(11 * u, Math.max(sim.shake, (vContactY / (55 * u)) * u));
                sound.playImpact(Math.min(1, vContactY / (420 * u)), metallic);
              }
            }

            // Smooth ground slide damping & settle
            cs.vx *= Math.pow(0.22, simDt);
            cs.angVel *= Math.pow(0.08, simDt);
            if (Math.abs(cs.vx) < 12 * u && Math.abs(cs.vy) < 18 * u && Math.abs(cs.angVel) < 18) {
              cs.angVel *= Math.pow(0.01, simDt);
            }
            cs.scrapeTimer -= simDt;
            if (Math.abs(cs.vx) > 55 * u && cs.scrapeTimer <= 0) {
              cs.scrapeTimer = 0.045;
              emitSparks(hitX, ry + 1 * scScale, 2, cs.vx >= 0 ? -1 : 1);
            }
          }

          cs.angVel = Math.max(-260, Math.min(260, cs.angVel));

          // Keep tumbling scooter/pitbike cleanly inside viewport
          const scMargin = 78 * scScale;
          const scMinX = scMargin;
          const scMaxX = Math.max(scMinX + 40 * scScale, sim.W - scMargin);
          if (cs.x < scMinX) {
            cs.x = scMinX;
            if (cs.vx < 0) cs.vx *= -0.25;
          } else if (cs.x > scMaxX) {
            cs.x = scMaxX;
            if (cs.vx > 0) cs.vx *= -0.25;
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
      const rySpark = getCamera().ry + 2 * sim.u;
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
      const curMap = mapIdRef.current;
      const isNight = timeOfDayRef.current === 'night';
      const curWeather = weatherRef.current;
      const s = getScooter(scooterIdRef.current);
      const m = getMetrics(s);
      const { ry, pivotX: basePivotX, scScale } = getCamera();
      const roadShift = ry - H * 0.64;
      const speedFactor =
        curMode === 'play' ? Math.max(0, Math.min(1, (sim.kmh - 28) / 86)) : 0;
      const hyperSpeed =
        curMode === 'play' ? Math.max(0, Math.min(1, (sim.kmh - 95) / 115)) : 0;
      // Smoothly damped G-force thrust pullback (updated in physics loop — never snaps on double-tap!)
      const pivotX = basePivotX + sim.thrustShift;

      // Apply subtle high-speed FOV zoom pullback + damped camera shake + road rumble (HUD stays razor sharp)
      ctx.save();
      const speedZoom = curMode === 'play' ? 1 - speedFactor * 0.026 - hyperSpeed * 0.032 : 1;
      if (speedZoom < 0.999) {
        const zoomAnchorX = basePivotX;
        const zoomAnchorY = ry;
        ctx.translate(zoomAnchorX, zoomAnchorY);
        ctx.scale(speedZoom, speedZoom);
        ctx.translate(-zoomAnchorX, -zoomAnchorY);
      }
      let shakeX = 0;
      let shakeY = 0;
      if (sim.shake > 0.15) {
        shakeX += (Math.random() - 0.5) * 2 * sim.shake;
        shakeY += (Math.random() - 0.5) * 2 * sim.shake;
      }
      if (curMode === 'play' && speedFactor > 0.18 && sim.a < 8) {
        shakeY += Math.sin(sim.t * 64) * (0.65 * speedFactor + 0.5 * hyperSpeed) * u;
      }
      if (shakeX !== 0 || shakeY !== 0) {
        ctx.translate(shakeX, shakeY);
      }

      const horizonY = H * 0.5 + roadShift;
      const roadTopY = H * 0.535 + roadShift;
      const roadH = H * 0.245;
      const vergeY = H * 0.78 + roadShift;

      // 1) Sky gradient (Day vs Night per map)
      const sky = ctx.createLinearGradient(0, -100, 0, H * 0.52 + roadShift);
      if (isNight) {
        if (curMap === 'highway') {
          sky.addColorStop(0, '#050b18');
          sky.addColorStop(0.6, '#0d1d38');
          sky.addColorStop(1, '#193152');
        } else if (curMap === 'industrial') {
          sky.addColorStop(0, '#090a12');
          sky.addColorStop(0.6, '#171926');
          sky.addColorStop(1, '#2b2430');
        } else {
          sky.addColorStop(0, '#070c1a');
          sky.addColorStop(0.62, '#121f38');
          sky.addColorStop(1, '#203252');
        }
      } else if (curMap === 'highway') {
        sky.addColorStop(0, '#3a7bb8');
        sky.addColorStop(0.62, '#7cb4db');
        sky.addColorStop(1, '#d7ebf7');
      } else if (curMap === 'industrial') {
        sky.addColorStop(0, '#6a7885');
        sky.addColorStop(0.6, '#9da7b0');
        sky.addColorStop(1, '#d4cabd');
      } else {
        sky.addColorStop(0, '#5a829e');
        sky.addColorStop(0.65, '#9ab9cf');
        sky.addColorStop(1, '#c8dce8');
      }
      ctx.fillStyle = sky;
      ctx.fillRect(-140, -140, W + 280, H + 280);

      // Stars & glowing crescent moon at Night; soft sun glow in Day
      if (isNight) {
        for (const st of STARS) {
          const twinkle = 0.45 + 0.55 * Math.sin(sim.t * 2.1 + st.phase);
          ctx.fillStyle = `rgba(235, 245, 255, ${(twinkle * 0.85).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(st.x * W, st.y * horizonY * 1.85, st.r * u, 0, Math.PI * 2);
          ctx.fill();
        }
        const moonX = W * 0.82;
        const moonY = Math.max(48 * u, horizonY * 0.34);
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 4 * u, moonX, moonY, 56 * u);
        moonGlow.addColorStop(0, 'rgba(255, 246, 206, 0.36)');
        moonGlow.addColorStop(1, 'rgba(255, 246, 206, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 56 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff5cc';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 17 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = curMap === 'industrial' ? '#12131f' : '#0b152a';
        ctx.beginPath();
        ctx.arc(moonX + 6.5 * u, moonY - 3 * u, 14.5 * u, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const sunX = W * 0.82;
        const sunY = Math.max(46 * u, horizonY * 0.32);
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 4 * u, sunX, sunY, 72 * u);
        sunGlow.addColorStop(0, 'rgba(255, 248, 215, 0.55)');
        sunGlow.addColorStop(1, 'rgba(255, 248, 215, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 72 * u, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2) Map-specific skyline, water/bridge/cranes, barriers & light poles
      if (curMap === 'highway') {
        // Distant waterfront skyline + tall suspension bridge towers & cables
        const waterTopY = horizonY - H * 0.085;
        const farTotalW = BUILDINGS.reduce((acc, b) => acc + b.w + 8, 0) * u * 0.72;
        let fbx = -((sim.off * 0.08) % farTotalW);
        while (fbx < W) {
          for (let i = 0; i < BUILDINGS.length; i++) {
            const b = BUILDINGS[i];
            if (fbx < W) {
              const bw = b.w * u * 0.72;
              const bh = b.h * u * 0.56;
              ctx.fillStyle = isNight ? '#0e192d' : '#6c8ea8';
              ctx.fillRect(fbx, waterTopY - bh, bw, bh);
              if (isNight) {
                for (let j = 0; j < bh / (18 * u) - 1; j++) {
                  for (let k = 0; k < bw / (16 * u) - 0.5; k++) {
                    if ((i * 3 + j + k) % 4 === 0) {
                      ctx.fillStyle = (i + j) % 3 === 0 ? 'rgba(92, 214, 255, 0.65)' : 'rgba(255, 214, 118, 0.7)';
                      ctx.fillRect(fbx + (5 + k * 16) * u, waterTopY - bh + (8 + j * 18) * u, 5 * u, 7 * u);
                    }
                  }
                }
              }
            }
            fbx += (b.w + 8) * u * 0.72;
          }
        }

        // Suspension bridge towers & sweeping cables across the bay
        const span = 380 * u;
        const bridgeShift = (sim.off * 0.14) % span;
        ctx.strokeStyle = isNight ? 'rgba(130, 175, 225, 0.45)' : 'rgba(235, 242, 248, 0.75)';
        ctx.lineWidth = 2.2 * u;
        for (let k = -1; k < W / span + 2; k++) {
          const tx = k * span - bridgeShift;
          const nextTx = tx + span;
          const towerH = 112 * u;
          const towerTop = waterTopY - towerH;
          // Main suspension cable catenary
          ctx.beginPath();
          ctx.moveTo(tx, towerTop + 8 * u);
          ctx.quadraticCurveTo((tx + nextTx) * 0.5, waterTopY - 16 * u, nextTx, towerTop + 8 * u);
          ctx.stroke();
          // Vertical suspender cables
          ctx.lineWidth = 1 * u;
          for (let sIdx = 1; sIdx < 8; sIdx++) {
            const frac = sIdx / 8;
            const cxCable = tx + span * frac;
            const cyCable =
              (1 - frac) * (1 - frac) * (towerTop + 8 * u) +
              2 * (1 - frac) * frac * (waterTopY - 16 * u) +
              frac * frac * (towerTop + 8 * u);
            ctx.beginPath();
            ctx.moveTo(cxCable, cyCable);
            ctx.lineTo(cxCable, waterTopY);
            ctx.stroke();
          }
          ctx.lineWidth = 2.2 * u;
          // Tower pylon
          ctx.fillStyle = isNight ? '#1b2c47' : '#d6dfe8';
          ctx.fillRect(tx - 6 * u, towerTop, 12 * u, towerH);
          ctx.fillRect(tx - 10 * u, towerTop + 26 * u, 20 * u, 5 * u);
          if (isNight) {
            ctx.fillStyle = '#ff4d4d';
            ctx.beginPath();
            ctx.arc(tx, towerTop - 2 * u, 2.6 * u, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Shimmering river / sea water strip
        const waterGrad = ctx.createLinearGradient(0, waterTopY, 0, horizonY);
        if (isNight) {
          waterGrad.addColorStop(0, '#0a182e');
          waterGrad.addColorStop(1, '#122845');
        } else {
          waterGrad.addColorStop(0, '#3674a6');
          waterGrad.addColorStop(1, '#589bc7');
        }
        ctx.fillStyle = waterGrad;
        ctx.fillRect(-20, waterTopY, W + 40, horizonY - waterTopY + 2);

        // Shimmering light reflections on water
        const shimmerStep = 64 * u;
        for (let k = -1; k < W / shimmerStep + 2; k++) {
          const sx = k * shimmerStep - ((sim.off * 0.22) % shimmerStep);
          const sy = waterTopY + (((k * 37) % 5) + 1) * ((horizonY - waterTopY) / 6);
          ctx.fillStyle = isNight ? 'rgba(255, 224, 148, 0.28)' : 'rgba(255, 255, 255, 0.32)';
          ctx.fillRect(sx, sy, (20 + (k % 3) * 10) * u, 2.2 * u);
        }

        // Concrete embankment & metallic highway guardrail with reflector cat's-eyes
        ctx.fillStyle = isNight ? '#2a3342' : '#9aa6b2';
        ctx.fillRect(-20, horizonY, W + 40, roadTopY - horizonY + 2);
        ctx.fillStyle = isNight ? '#4b596e' : '#cfd8e3';
        ctx.fillRect(-20, horizonY + 5 * u, W + 40, 5 * u);

        // Highway guardrail posts & bright amber/red reflectors zipping fast
        const postGap = 92 * u;
        for (let k = -1; k < W / postGap + 2; k++) {
          const px = k * postGap - ((sim.off * 0.85) % postGap);
          ctx.fillStyle = isNight ? '#202836' : '#64707d';
          ctx.fillRect(px, horizonY + 2 * u, 5 * u, roadTopY - horizonY);
          // Glowing reflector cat's-eye
          ctx.fillStyle = isNight ? '#ff9f1a' : '#ff6a1a';
          ctx.fillRect(px + 0.5 * u, horizonY + 6 * u, 4 * u, 3 * u);
        }

        // Tall overhead highway light arches
        const gantryGap = 320 * u;
        for (let k = -1; k < W / gantryGap + 2; k++) {
          const gx = k * gantryGap - ((sim.off * 0.72) % gantryGap);
          ctx.fillStyle = isNight ? '#243247' : '#738291';
          ctx.fillRect(gx, horizonY - 96 * u, 7 * u, 98 * u);
          ctx.fillRect(gx, horizonY - 96 * u, 34 * u, 5 * u);
          // LED lamp head + night light cone
          ctx.fillStyle = isNight ? '#bfeaff' : '#e6eff7';
          ctx.fillRect(gx + 16 * u, horizonY - 91 * u, 16 * u, 3.5 * u);
          if (isNight) {
            const cone = ctx.createLinearGradient(gx + 24 * u, horizonY - 88 * u, gx + 24 * u, ry + 26 * u);
            cone.addColorStop(0, 'rgba(130, 220, 255, 0.24)');
            cone.addColorStop(1, 'rgba(130, 220, 255, 0)');
            ctx.fillStyle = cone;
            ctx.beginPath();
            ctx.moveTo(gx + 16 * u, horizonY - 88 * u);
            ctx.lineTo(gx + 32 * u, horizonY - 88 * u);
            ctx.lineTo(gx + 86 * u, ry + 24 * u);
            ctx.lineTo(gx - 38 * u, ry + 24 * u);
            ctx.closePath();
            ctx.fill();
          }
        }
      } else if (curMap === 'industrial') {
        // Industrial Stunt Spot: warehouses, factory chimneys & port cranes
        const unitW = 240 * u;
        const shift = (sim.off * 0.16) % unitW;
        for (let k = -1; k < W / unitW + 2; k++) {
          const ix = k * unitW - shift;
          // Factory warehouse silhouette
          ctx.fillStyle = isNight ? '#151824' : '#57606b';
          ctx.fillRect(ix + 10 * u, horizonY - 76 * u, 118 * u, 76 * u);
          // Saw-tooth roof
          ctx.beginPath();
          ctx.moveTo(ix + 10 * u, horizonY - 76 * u);
          ctx.lineTo(ix + 48 * u, horizonY - 98 * u);
          ctx.lineTo(ix + 48 * u, horizonY - 76 * u);
          ctx.lineTo(ix + 88 * u, horizonY - 98 * u);
          ctx.lineTo(ix + 88 * u, horizonY - 76 * u);
          ctx.lineTo(ix + 128 * u, horizonY - 98 * u);
          ctx.lineTo(ix + 128 * u, horizonY - 76 * u);
          ctx.closePath();
          ctx.fill();
          // Warehouse warm/industrial windows
          ctx.fillStyle = isNight ? 'rgba(255, 194, 92, 0.55)' : 'rgba(255, 255, 255, 0.22)';
          for (let wi = 0; wi < 4; wi++) {
            ctx.fillRect(ix + (22 + wi * 26) * u, horizonY - 54 * u, 16 * u, 12 * u);
          }
          // Smokestack / port crane tower
          ctx.fillStyle = isNight ? '#1c2030' : '#4a525c';
          ctx.fillRect(ix + 152 * u, horizonY - 142 * u, 14 * u, 142 * u);
          // Crane boom arm
          ctx.fillRect(ix + 132 * u, horizonY - 134 * u, 88 * u, 6 * u);
          // Red aviation warning beacon at top (blinks smoothly at night)
          if (isNight) {
            const blink = 0.4 + 0.6 * Math.abs(Math.sin(sim.t * 3.2 + k));
            ctx.fillStyle = `rgba(255, 64, 48, ${blink.toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(ix + 159 * u, horizonY - 145 * u, 3.2 * u, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Concrete stunt barrier wall with bold orange/dark hazard stripes
        const wallH = Math.max(12 * u, roadTopY - horizonY);
        ctx.fillStyle = isNight ? '#2a2e38' : '#7f8791';
        ctx.fillRect(-20, horizonY, W + 40, wallH + 2);
        const stripeStep = 56 * u;
        for (let k = -1; k < W / stripeStep + 2; k++) {
          const sx = k * stripeStep - ((sim.off * 0.78) % stripeStep);
          ctx.fillStyle = isNight ? 'rgba(255, 115, 28, 0.72)' : '#ff6a1a';
          ctx.beginPath();
          ctx.moveTo(sx, horizonY + wallH);
          ctx.lineTo(sx + 16 * u, horizonY + 3 * u);
          ctx.lineTo(sx + 28 * u, horizonY + 3 * u);
          ctx.lineTo(sx + 12 * u, horizonY + wallH);
          ctx.closePath();
          ctx.fill();
        }

        // Stadium floodlight masts casting bright stunt-spot beams at night
        const mastGap = 310 * u;
        for (let k = -1; k < W / mastGap + 2; k++) {
          const mx = k * mastGap - ((sim.off * 0.65) % mastGap);
          ctx.fillStyle = isNight ? '#2b3140' : '#58606b';
          ctx.fillRect(mx, horizonY - 108 * u, 8 * u, 110 * u);
          ctx.fillRect(mx - 12 * u, horizonY - 112 * u, 32 * u, 9 * u);
          ctx.fillStyle = isNight ? '#fff7db' : '#dce3eb';
          ctx.fillRect(mx - 9 * u, horizonY - 109 * u, 26 * u, 4 * u);
          if (isNight) {
            const cone = ctx.createLinearGradient(mx + 4 * u, horizonY - 103 * u, mx + 4 * u, ry + 32 * u);
            cone.addColorStop(0, 'rgba(255, 240, 200, 0.25)');
            cone.addColorStop(1, 'rgba(255, 240, 200, 0)');
            ctx.fillStyle = cone;
            ctx.beginPath();
            ctx.moveTo(mx - 10 * u, horizonY - 103 * u);
            ctx.lineTo(mx + 18 * u, horizonY - 103 * u);
            ctx.lineTo(mx + 102 * u, ry + 30 * u);
            ctx.lineTo(mx - 94 * u, ry + 30 * u);
            ctx.closePath();
            ctx.fill();
          }
        }
      } else {
        // Classic City Avenue (Day + Night)
        const totalW = BUILDINGS.reduce((acc, b) => acc + b.w + 6, 0) * u;
        let bx = -((sim.off * 0.15) % totalW);
        while (bx < W) {
          for (let i = 0; i < BUILDINGS.length; i++) {
            const b = BUILDINGS[i];
            if (bx < W) {
              const bw = b.w * u;
              const bh = b.h * u;
              ctx.fillStyle = isNight ? b.nightShade : b.shade;
              ctx.fillRect(bx, horizonY - bh, bw, bh);
              for (let j = 0; j < bh / (24 * u) - 1; j++) {
                for (let k = 0; k < bw / (20 * u) - 0.5; k++) {
                  if ((i + j + k) % 3) {
                    if (isNight) {
                      const lit = (i * 5 + j * 3 + k) % 4 !== 0;
                      if (!lit) continue;
                      ctx.fillStyle =
                        (i + j + k) % 5 === 0
                          ? 'rgba(110, 212, 255, 0.58)'
                          : 'rgba(255, 218, 128, 0.72)';
                    } else {
                      ctx.fillStyle = 'rgba(255,255,255,0.24)';
                    }
                    ctx.fillRect(
                      bx + (6 + k * 20) * u,
                      horizonY - bh + (10 + j * 24) * u,
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
        ctx.fillStyle = isNight ? '#3a3536' : '#d9a15a';
        ctx.fillRect(-20, horizonY, W + 40, H * 0.036);
        const poleGap = 220 * u;
        for (let k = -1; k < W / poleGap + 2; k++) {
          const px = k * poleGap - ((sim.off * 0.6) % poleGap);
          ctx.fillStyle = isNight ? '#2a3240' : '#6c737c';
          ctx.fillRect(px, horizonY - 82 * u, 6 * u, 84 * u + H * 0.036);
          ctx.fillRect(px, horizonY - 82 * u, 24 * u, 4 * u);
          ctx.fillStyle = isNight ? '#ffe39a' : '#d8dee6';
          ctx.fillRect(px + 14 * u, horizonY - 78 * u, 10 * u, 3.5 * u);
          if (isNight) {
            const cone = ctx.createLinearGradient(px + 19 * u, horizonY - 75 * u, px + 19 * u, ry + 26 * u);
            cone.addColorStop(0, 'rgba(255, 216, 128, 0.26)');
            cone.addColorStop(1, 'rgba(255, 216, 128, 0)');
            ctx.fillStyle = cone;
            ctx.beginPath();
            ctx.moveTo(px + 13 * u, horizonY - 75 * u);
            ctx.lineTo(px + 25 * u, horizonY - 75 * u);
            ctx.lineTo(px + 84 * u, ry + 24 * u);
            ctx.lineTo(px - 44 * u, ry + 24 * u);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // 3) Asphalt road (color adapts cleanly to Map + Day/Night)
      ctx.fillStyle = isNight
        ? curMap === 'industrial'
          ? '#1a1d24'
          : '#212630'
        : curMap === 'industrial'
          ? '#393d44'
          : '#45494f';
      ctx.fillRect(-140, roadTopY, W + 280, roadH);

      // High-speed asphalt grain streaks (clean, non-overpowering speed cue)
      const streakStretch = 1 + speedFactor * 2.5 + hyperSpeed * 2.2;
      const streakSpan = W + 320 * u;
      for (const st of ROAD_STREAKS) {
        const sx =
          W + 160 * u - ((sim.off * 1.25 + st.offset * streakSpan) % streakSpan);
        const sy = roadTopY + (0.08 + st.laneY * 0.84) * roadH;
        const sl = st.len * streakStretch * u;
        const brightBoost = 0.06 + speedFactor * 0.07 + hyperSpeed * 0.07;
        ctx.fillStyle = isNight
          ? st.bright
            ? `rgba(180, 212, 245, ${brightBoost.toFixed(2)})`
            : `rgba(255, 255, 255, ${(0.03 + speedFactor * 0.03).toFixed(2)})`
          : st.bright
            ? `rgba(255, 255, 255, ${(0.08 + speedFactor * 0.08).toFixed(2)})`
            : `rgba(15, 20, 28, ${(0.11 + speedFactor * 0.09).toFixed(2)})`;
        ctx.fillRect(sx, sy, sl, (1.4 + speedFactor * 0.65 + hyperSpeed * 0.35) * u);
      }

      // Curb / edge stripe & road center markings per map
      if (curMap === 'highway') {
        ctx.fillStyle = isNight ? 'rgba(92, 198, 255, 0.65)' : '#e2e8f0';
        ctx.fillRect(-140, H * 0.542 + roadShift, W + 280, 3.5 * u);
        ctx.fillStyle = isNight ? 'rgba(235, 244, 255, 0.78)' : '#f8fafc';
        const dashGap = 170 * u;
        const dashLen = (82 + speedFactor * 36 + hyperSpeed * 28) * u;
        for (let k = -2; k < W / dashGap + 3; k++) {
          ctx.fillRect(k * dashGap - (sim.off % dashGap), H * 0.695 + roadShift, dashLen, 5.5 * u);
        }
      } else if (curMap === 'industrial') {
        ctx.fillStyle = isNight ? 'rgba(255, 138, 43, 0.65)' : '#f59e0b';
        ctx.fillRect(-140, H * 0.542 + roadShift, W + 280, 3.5 * u);
        // Double yellow stunt-strip center lines
        ctx.fillStyle = isNight ? 'rgba(255, 209, 64, 0.72)' : '#eab308';
        ctx.fillRect(-140, H * 0.692 + roadShift, W + 280, 3 * u);
        ctx.fillRect(-140, H * 0.706 + roadShift, W + 280, 3 * u);
      } else {
        ctx.fillStyle = isNight ? '#b59d1f' : '#e8d02a';
        ctx.fillRect(-140, H * 0.54 + roadShift, W + 280, 4 * u);
        ctx.fillStyle = isNight ? 'rgba(229, 231, 235, 0.75)' : '#e5e7eb';
        const dashGap = 160 * u;
        const dashLen = (90 + speedFactor * 34 + hyperSpeed * 28) * u;
        for (let k = -2; k < W / dashGap + 3; k++) {
          ctx.fillRect(k * dashGap - (sim.off % dashGap), H * 0.7 + roadShift, dashLen, 6 * u);
        }
      }

      // Foreground verge
      ctx.fillStyle = isNight
        ? curMap === 'industrial'
          ? '#1e2129'
          : curMap === 'highway'
            ? '#192230'
            : '#2b2824'
        : curMap === 'industrial'
          ? '#656c75'
          : curMap === 'highway'
            ? '#647280'
            : '#9c8356';
      ctx.fillRect(-140, vergeY, W + 280, Math.max(40, H - vergeY + 140));

      if (curMode === 'crash' && sim.crashScooter.active) {
        const cs = sim.crashScooter;
        // Dynamic ground shadow under the flying/tumbling scooter/pitbike
        const scHeight = Math.max(0, ry - cs.y);
        const scShadowAlpha = Math.max(0.1, 0.34 - (scHeight / (260 * scScale)) * 0.24);
        ctx.fillStyle = `rgba(0,0,0,${scShadowAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(cs.x, ry + 3 * scScale, 64 * scScale, 8 * scScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tumbling detached scooter/pitbike around Center of Mass
        ctx.save();
        ctx.translate(cs.x, cs.y);
        ctx.scale(scScale, scScale);
        ctx.rotate((-cs.angle * Math.PI) / 180);
        ctx.translate(-cs.comX, -cs.comY);
        drawScooterAndRider(s, false, cs.angle);
        ctx.restore();

        // Articulated ragdoll rider with motocross helmet
        drawRagdoll(s, sim.ragdoll);
      } else {
        // Ground shadow (shifts slightly as front wheel lifts)
        const liftFactor = Math.max(0.45, Math.cos((sim.a * Math.PI) / 180));
        const shadowSpan = m.frontWheelX * scScale * 0.62 * liftFactor;
        ctx.fillStyle = isNight ? 'rgba(0,0,0,0.48)' : 'rgba(0,0,0,0.34)';
        ctx.beginPath();
        ctx.ellipse(
          pivotX + shadowSpan * 0.78,
          ry + 2 * scScale,
          Math.max(40 * scScale, shadowSpan * 1.15),
          8 * scScale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Underglow reflection on road matching custom or stock LED color (extra vivid at night!)
        const activeUnderglowHex = getScooterUnderglowHex(s, underglowIdRef.current);
        if (activeUnderglowHex) {
          const glowRgb = hexToRgbTuple(activeUnderglowHex);
          const wheeliePoolFade = Math.max(0.24, Math.cos((Math.min(82, sim.a) * Math.PI) / 180));
          const poolCenterX =
            s.seated && s.underglowStartX !== undefined && s.underglowEndX !== undefined
              ? pivotX +
                (m.imgX + (s.underglowStartX + s.underglowEndX) * 0.5 * m.drawW) *
                  scScale *
                  liftFactor
              : pivotX + shadowSpan * 0.75;
          const poolW = (isNight ? (s.seated ? 96 : 118) : s.seated ? 76 : 92) * scScale * liftFactor;
          const poolH = (isNight ? 18 : 13) * scScale;
          const glowGrad = ctx.createRadialGradient(
            poolCenterX,
            ry + 2 * scScale,
            4 * scScale,
            poolCenterX,
            ry + 2 * scScale,
            poolW
          );
          glowGrad.addColorStop(
            0,
            `rgba(${glowRgb}, ${((isNight ? 0.76 : 0.42) * wheeliePoolFade).toFixed(2)})`
          );
          glowGrad.addColorStop(
            0.52,
            `rgba(${glowRgb}, ${((isNight ? 0.26 : 0.13) * wheeliePoolFade).toFixed(2)})`
          );
          glowGrad.addColorStop(1, `rgba(${glowRgb}, 0)`);
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.ellipse(
            poolCenterX,
            ry + 2 * scScale,
            poolW,
            poolH,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Scorched black rubber burnout patch directly under the spinning rear tire
        if (curMode === 'play' && sim.burnout > 0.06) {
          const bLen = (24 + sim.burnout * 48) * scScale;
          const patchGrad = ctx.createLinearGradient(pivotX - bLen, ry, pivotX + 10 * scScale, ry);
          patchGrad.addColorStop(0, 'rgba(10, 12, 16, 0)');
          patchGrad.addColorStop(0.65, `rgba(10, 12, 16, ${(0.72 * sim.burnout).toFixed(2)})`);
          patchGrad.addColorStop(1, `rgba(14, 16, 22, ${(0.82 * sim.burnout).toFixed(2)})`);
          ctx.fillStyle = patchGrad;
          ctx.beginPath();
          ctx.ellipse(
            pivotX - bLen * 0.35,
            ry + 1.5 * scScale,
            bLen * 0.65,
            4.5 * scScale,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Scooter + Rider (pivoting around rear wheel axle, with high-RPM burnout vibration & nose-down press)
        const boVibX = sim.burnout > 0.05 ? (Math.random() - 0.5) * 2.4 * sim.burnout * scScale : 0;
        const boVibY = sim.burnout > 0.05 ? (Math.random() - 0.5) * 1.8 * sim.burnout * scScale : 0;
        ctx.save();
        ctx.translate(pivotX + boVibX, ry - m.wheelBottom * scScale + boVibY);
        ctx.scale(scScale, scScale);
        ctx.rotate(((-sim.a + sim.burnout * 1.8) * Math.PI) / 180);

        const chassisSuspY = Math.max(-1.5, Math.min(3.4, sim.rearSusp * 0.72));

        // Night LED headlight beam (soft volumetric multi-stop cone + asphalt pool) & custom under-deck LED strip
        const lightSpec = getScooterLight(lightIdRef.current);
        const beamRgb = hexToRgbTuple(lightSpec.beamHex);
        const coreRgb = hexToRgbTuple(lightSpec.coreHex);
        const headX = m.headlightX;
        const headY = m.headlightY + chassisSuspY;

        if (activeUnderglowHex) {
          const glowRgb = hexToRgbTuple(activeUnderglowHex);
          const barStartX =
            s.underglowStartX !== undefined
              ? m.imgX + s.underglowStartX * m.drawW
              : s.seated
                ? m.backFootX - 2
                : Math.max(12, m.backFootX - 2);
          const barEndX =
            s.underglowEndX !== undefined
              ? m.imgX + s.underglowEndX * m.drawW
              : s.seated
                ? Math.min(m.frontWheelX - 58, m.imgX + 0.56 * m.drawW)
                : m.frontWheelX - 26;
          const barY =
            (s.underglowY !== undefined
              ? m.imgY + s.underglowY * m.drawH
              : s.seated
                ? m.deckY + 4
                : m.deckY + 7) + chassisSuspY;
          const glowH = s.seated ? 20 : 24;
          if (barEndX > barStartX + 12) {
            ctx.save();
            const stripGlow = ctx.createLinearGradient(barStartX, barY, barStartX, barY + glowH);
            stripGlow.addColorStop(0, `rgba(${glowRgb}, ${isNight ? 0.78 : 0.45})`);
            stripGlow.addColorStop(0.45, `rgba(${glowRgb}, ${isNight ? 0.26 : 0.14})`);
            stripGlow.addColorStop(1, `rgba(${glowRgb}, 0)`);
            ctx.fillStyle = stripGlow;
            ctx.beginPath();
            ctx.roundRect(barStartX, barY, barEndX - barStartX, glowH, 6);
            ctx.fill();

            ctx.strokeStyle = `rgba(${glowRgb}, ${isNight ? 0.96 : 0.72})`;
            ctx.lineWidth = isNight ? 3.2 : 2.4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(barStartX + 3, barY + 1);
            ctx.lineTo(barEndX - 3, barY + 1);
            ctx.stroke();
            ctx.restore();
          }
        }

        if (isNight) {
          const beamLen = 320 + speedFactor * 85;
          const beamBottomY = Math.min(m.wheelBottom + 24, headY + 86);
          const innerBottomY = Math.min(m.wheelBottom + 14, headY + 56);
          // Soft wide outer optical spill
          const outerBeamGrad = ctx.createRadialGradient(
            headX,
            headY + 4,
            4,
            headX + beamLen * 0.45,
            headY + (beamBottomY - headY) * 0.35,
            beamLen * 0.78
          );
          outerBeamGrad.addColorStop(0, `rgba(${coreRgb}, 0.28)`);
          outerBeamGrad.addColorStop(0.35, `rgba(${beamRgb}, 0.16)`);
          outerBeamGrad.addColorStop(0.72, `rgba(${beamRgb}, 0.05)`);
          outerBeamGrad.addColorStop(1, `rgba(${beamRgb}, 0)`);
          ctx.fillStyle = outerBeamGrad;
          ctx.beginPath();
          ctx.moveTo(headX, headY - 7);
          ctx.quadraticCurveTo(headX + beamLen * 0.55, headY - 26, headX + beamLen * 1.04, headY - 8);
          ctx.quadraticCurveTo(headX + beamLen * 0.88, beamBottomY * 0.7 + headY * 0.3, headX + beamLen * 0.75, beamBottomY);
          ctx.quadraticCurveTo(headX + beamLen * 0.25, headY + (beamBottomY - headY) * 0.55, headX, headY + 8);
          ctx.closePath();
          ctx.fill();

          // Focused inner projector beam (smooth edge falloff)
          const innerGrad = ctx.createLinearGradient(headX, headY, headX + beamLen * 0.92, headY + 28);
          innerGrad.addColorStop(0, `rgba(${coreRgb}, 0.52)`);
          innerGrad.addColorStop(0.32, `rgba(${beamRgb}, 0.22)`);
          innerGrad.addColorStop(0.75, `rgba(${beamRgb}, 0.05)`);
          innerGrad.addColorStop(1, `rgba(${beamRgb}, 0)`);
          ctx.fillStyle = innerGrad;
          ctx.beginPath();
          ctx.moveTo(headX, headY - 3);
          ctx.lineTo(headX + beamLen * 0.92, headY - 10);
          ctx.lineTo(headX + beamLen * 0.92, innerBottomY);
          ctx.lineTo(headX, headY + 4);
          ctx.closePath();
          ctx.fill();

          // Asphalt road light spot ahead of front wheel when nose isn't sky-high
          if (sim.a < 38) {
            const spotFade = Math.max(0, 1 - sim.a / 38);
            const heightAhead = Math.max(25, m.wheelBottom - headY);
            const spotX = headX + Math.max(105, heightAhead * 1.15 + 60);
            const spotY = m.wheelBottom + 2;
            const spotGrad = ctx.createRadialGradient(spotX, spotY, 8, spotX, spotY, 130);
            spotGrad.addColorStop(0, `rgba(${coreRgb}, ${(0.28 * spotFade).toFixed(2)})`);
            spotGrad.addColorStop(0.5, `rgba(${beamRgb}, ${(0.14 * spotFade).toFixed(2)})`);
            spotGrad.addColorStop(1, `rgba(${beamRgb}, 0)`);
            ctx.fillStyle = spotGrad;
            ctx.beginPath();
            ctx.ellipse(spotX, spotY, 130, 18, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Bright LED projector lens halo
          const lampGlow = ctx.createRadialGradient(headX, headY, 1, headX, headY, 18);
          lampGlow.addColorStop(0, `rgba(${coreRgb}, 0.96)`);
          lampGlow.addColorStop(0.35, `rgba(${beamRgb}, 0.52)`);
          lampGlow.addColorStop(1, `rgba(${beamRgb}, 0)`);
          ctx.fillStyle = lampGlow;
          ctx.beginPath();
          ctx.arc(headX, headY, 18, 0, Math.PI * 2);
          ctx.fill();

          // Red rear LED taillight glow (under rear fender/seat on pitbikes, rear deck on scooters)
          const tailX = s.seated ? m.imgX + 0.15 * m.drawW : -16;
          const tailY = (s.seated ? m.seatY + 6 : m.deckY - 6) + chassisSuspY;
          const tailGlow = ctx.createRadialGradient(tailX, tailY, 2, tailX, tailY, 26);
          tailGlow.addColorStop(0, 'rgba(255, 48, 48, 0.78)');
          tailGlow.addColorStop(1, 'rgba(255, 48, 48, 0)');
          ctx.fillStyle = tailGlow;
          ctx.beginPath();
          ctx.arc(tailX, tailY, 26, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Subtle daytime LED DRL projector lens gleam
          const dayAlpha = lightSpec.id !== 'stock' ? 0.85 : 0.45;
          const dayLampGlow = ctx.createRadialGradient(headX, headY, 1, headX, headY, 11);
          dayLampGlow.addColorStop(0, `rgba(${coreRgb}, ${dayAlpha})`);
          dayLampGlow.addColorStop(0.45, `rgba(${beamRgb}, ${(dayAlpha * 0.5).toFixed(2)})`);
          dayLampGlow.addColorStop(1, `rgba(${beamRgb}, 0)`);
          ctx.fillStyle = dayLampGlow;
          ctx.beginPath();
          ctx.arc(headX, headY, 11, 0, Math.PI * 2);
          ctx.fill();
        }

        drawScooterAndRider(s, true, sim.a);
        ctx.restore();
      }

      // Asphalt dust & thick white burnout tire smoke puffs
      for (const d of sim.dust) {
        const t = Math.max(0, d.life / d.maxLife);
        ctx.globalAlpha = t * (d.alpha ?? 0.36);
        ctx.fillStyle = d.color ?? '#cbd5e1';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hot molten friction flash & road streak right under rear fender contact point!
      if (curMode === 'play' && sim.fenderScrapeGlow > 0.04) {
        const gA = sim.fenderScrapeGlow;
        const bx = sim.fenderContactX;
        const by = ry - 1 * u;

        // Glowing friction trail behind fender tip
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

      // Subtle aerodynamic wind / speed lines only at genuine high speed (no screen clutter!)
      if (curMode === 'play' && speedFactor > 0.42) {
        const windProg = Math.min(1, (speedFactor - 0.42) / 0.58);
        const windAlpha = Math.min(0.22, windProg * 0.12 + hyperSpeed * 0.1);
        const windSpan = W + 280 * u;
        ctx.lineCap = 'round';
        for (let wi = 0; wi < WIND_LINES.length; wi++) {
          const wl = WIND_LINES[wi];
          const wx =
            W + 140 * u - ((sim.off * (wl.speedMult + hyperSpeed * 0.35) + wl.seed * windSpan) % windSpan);
          const wy = wl.yFrac * H;
          const len = wl.len * (0.7 + windProg * 0.65 + hyperSpeed * 0.6) * u;
          const isHyperTint = hyperSpeed > 0.35 && wi % 4 === 0;
          ctx.strokeStyle = isHyperTint
            ? `rgba(120, 224, 255, ${windAlpha.toFixed(3)})`
            : isNight
              ? `rgba(198, 228, 255, ${windAlpha.toFixed(3)})`
              : `rgba(255, 255, 255, ${windAlpha.toFixed(3)})`;
          ctx.lineWidth = (0.95 + hyperSpeed * 0.35) * u;
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(wx + len, wy);
          ctx.stroke();
        }

        // Faint slipstream wake ribbons only past ~110+ km/h
        if (hyperSpeed > 0.15) {
          const wakeAlpha = Math.min(0.16, hyperSpeed * 0.16);
          const wakeLen = (36 + hyperSpeed * 54) * u;
          const wakePulse = (sim.t * 14) % 1;
          for (let ri = 0; ri < 2; ri++) {
            const wy = ry - (10 + ri * 30) * scScale;
            const wxEnd = pivotX - (18 + ri * 14 + wakePulse * 22) * scScale;
            const wGrad = ctx.createLinearGradient(wxEnd - wakeLen, wy, wxEnd, wy);
            wGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            wGrad.addColorStop(1, `rgba(255, 255, 255, ${wakeAlpha.toFixed(2)})`);
            ctx.strokeStyle = wGrad;
            ctx.lineWidth = 1.15 * u;
            ctx.beginPath();
            ctx.moveTo(wxEnd - wakeLen, wy);
            ctx.lineTo(wxEnd, wy);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      ctx.restore();

      // Atmospheric weather effects (Rain, Fog, Snow) over world, beneath HUD
      if (curWeather === 'rain') {
        ctx.save();
        ctx.fillStyle = isNight ? 'rgba(6, 14, 28, 0.22)' : 'rgba(42, 62, 84, 0.18)';
        ctx.fillRect(0, 0, W, H);
        ctx.lineCap = 'round';
        const windDx = -(7 + speedFactor * 9) * u;
        for (const d of WEATHER_DROPS) {
          const rx =
            (((d.xFrac * W - sim.camX * 0.22 - sim.t * d.speed * 110 * u) % (W + 80)) +
              W +
              80) %
              (W + 80) -
            40;
          const ryDrop = ((d.yFrac * H + sim.t * d.speed * 640 * u) % (H + 60)) - 30;
          const len = d.len * u;
          ctx.strokeStyle = isNight
            ? `rgba(165, 210, 255, ${(d.alpha * 1.15).toFixed(2)})`
            : `rgba(218, 236, 255, ${d.alpha.toFixed(2)})`;
          ctx.lineWidth = 1.25 * u;
          ctx.beginPath();
          ctx.moveTo(rx, ryDrop);
          ctx.lineTo(rx + windDx, ryDrop + len);
          ctx.stroke();

          // Subtle asphalt splash when drop hits the road plane
          if (ryDrop > roadTopY && ryDrop < vergeY) {
            const splashPhase = ((sim.t * d.speed * 4 + d.xFrac * 10) % 1);
            if (splashPhase < 0.25) {
              ctx.strokeStyle = `rgba(210, 234, 255, ${(0.22 * (1 - splashPhase * 4)).toFixed(2)})`;
              ctx.lineWidth = 1 * u;
              ctx.beginPath();
              ctx.ellipse(rx, ryDrop + 2 * u, (2 + splashPhase * 18) * u, 1.4 * u, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      } else if (curWeather === 'fog') {
        ctx.save();
        const fogGrad = ctx.createLinearGradient(0, 0, 0, H);
        if (isNight) {
          fogGrad.addColorStop(0, 'rgba(18, 28, 46, 0.34)');
          fogGrad.addColorStop(0.48, 'rgba(110, 132, 165, 0.48)');
          fogGrad.addColorStop(0.75, 'rgba(92, 114, 145, 0.30)');
          fogGrad.addColorStop(1, 'rgba(20, 30, 48, 0.18)');
        } else {
          fogGrad.addColorStop(0, 'rgba(214, 226, 236, 0.32)');
          fogGrad.addColorStop(0.48, 'rgba(224, 234, 242, 0.56)');
          fogGrad.addColorStop(0.76, 'rgba(212, 222, 230, 0.34)');
          fogGrad.addColorStop(1, 'rgba(198, 210, 220, 0.16)');
        }
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 0, W, H);

        // Drifting horizon mist bands
        for (let i = 0; i < 4; i++) {
          const bandW = W * 0.58;
          const bx =
            ((((i * 0.31 * W) - sim.camX * (0.06 + i * 0.02) - sim.t * (14 + i * 5) * u) %
              (W + bandW)) +
              W +
              bandW) %
              (W + bandW) -
            bandW;
          const byBand = horizonY + (i - 1) * 26 * u;
          const mistGrad = ctx.createRadialGradient(
            bx + bandW * 0.5,
            byBand,
            8 * u,
            bx + bandW * 0.5,
            byBand,
            bandW * 0.5
          );
          const col = isNight ? '138, 164, 198' : '236, 244, 250';
          mistGrad.addColorStop(0, `rgba(${col}, 0.24)`);
          mistGrad.addColorStop(1, `rgba(${col}, 0)`);
          ctx.fillStyle = mistGrad;
          ctx.fillRect(bx, byBand - 44 * u, bandW, 88 * u);
        }
        ctx.restore();
      } else if (curWeather === 'snow') {
        ctx.save();
        ctx.fillStyle = isNight ? 'rgba(16, 28, 48, 0.14)' : 'rgba(225, 240, 255, 0.12)';
        ctx.fillRect(0, 0, W, H);
        for (const fl of WEATHER_FLAKES) {
          const sx =
            (((fl.xFrac * W -
              sim.camX * 0.14 +
              Math.sin(sim.t * 1.6 + fl.phase) * fl.sway * u -
              sim.t * speedFactor * 45 * u) %
              (W + 40)) +
              W +
              40) %
              (W + 40) -
            20;
          const sy = ((fl.yFrac * H + sim.t * fl.speed * 135 * u) % (H + 30)) - 15;
          ctx.fillStyle = isNight ? 'rgba(232, 244, 255, 0.85)' : 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(sx, sy, fl.r * u, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // In-game Canvas HUD (shown during active play & crash)
      if (curMode === 'play' || curMode === 'crash') {
        const bw = 300 * u;
        const bh = 12 * u;
        const b0 = (W - bw) / 2;
        const by = 72 * u;
        const hudScrape = getActiveScrapeSpec(s, m);
        const maxGaugeDeg = hudScrape?.loopOutDeg ?? 102;
        const zoneColors = ['#5d7a8a', '#3dcf5a', '#e8b923', '#ff6a1a', '#e0372c'];
        const bounds = [0, 12, 50, 78, Math.max(94, maxGaugeDeg - 8), maxGaugeDeg];

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
        const isBurnoutHud = curMode === 'play' && sim.burnout > 0.35;
        const activeScrapeKind = s.scrapeKind;
        const zoneLabel = isBurnoutHud
          ? ' · 🔥 БЕРНАУТ!'
          : sim.fenderScraping && activeScrapeKind === 'bugel'
            ? ' · ⚡ ЧИРК БУГЕЛЕМ! ×1.45'
            : sim.fenderScraping && activeScrapeKind === 'fender'
              ? ' · ⚡ ЧИРК КРЫЛОМ! ×1.45'
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
        ctx.fillStyle = isBurnoutHud ? '#ff8b4a' : sim.fenderScraping ? '#ffd34d' : '#ffffff';
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
        const effGaugeMax = getEffectiveScooterStats(
          s,
          hasVescRef.current,
          hasSecondMotorRef.current,
          akbIdRef.current
        ).maxKmh;
        const ratio = Math.max(0, Math.min(1, sim.kmh / effGaugeMax));
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

        // Active Stunt callout (No-Hander, One-Hander, One-Knee, Flamingo, Foot-on-Steering-Column, or Combo)
        const hasNoHands = sim.nh > 0.4;
        const hasOh = sim.oh > 0.45 && !hasNoHands;
        const hasKnee = sim.knee > 0.45;
        const hasStem = sim.stem > 0.45;
        const hasFlamingo = s.seated && sim.flamingo > 0.45;
        if (curMode === 'play' && (hasNoHands || hasOh || hasKnee || hasStem || hasFlamingo)) {
          const trickText =
            sim.a > 12
              ? hasNoHands && hasFlamingo
                ? 'БЕЗ РУК + ФЛАМИНГО ×2.2'
                : hasNoHands && hasStem
                  ? 'БЕЗ РУК + РУЛЕВАЯ ×2.15'
                  : hasNoHands && hasKnee
                    ? 'БЕЗ РУК + КОЛЕНО ×2.0'
                    : hasNoHands
                      ? 'БЕЗ РУК ×1.85'
                      : hasOh && hasFlamingo
                        ? '1 РУКА + ФЛАМИНГО ×1.8'
                        : hasOh && hasStem
                          ? '1 РУКА + РУЛЕВАЯ ×1.75'
                          : hasOh && hasKnee
                            ? '1 РУКА + КОЛЕНО ×1.65'
                            : hasFlamingo
                              ? 'ФЛАМИНГО ×1.5'
                              : hasStem
                                ? s.seated
                                  ? 'РУЛЕВАЯ · 2 НОГИ ×1.4'
                                  : 'РУЛЕВАЯ ×1.4'
                                : hasOh
                                  ? 'ВАНХЕНД ×1.35'
                                  : 'НА КОЛЕНЕ ×1.3'
              : hasNoHands && hasFlamingo
                ? 'БЕЗ РУК + ФЛАМИНГО'
                : hasNoHands && hasStem
                  ? 'БЕЗ РУК + РУЛЕВАЯ'
                  : hasNoHands && hasKnee
                    ? 'БЕЗ РУК + КОЛЕНО'
                    : hasNoHands
                      ? 'БЕЗ РУК'
                      : hasOh && hasFlamingo
                        ? '1 РУКА + ФЛАМИНГО'
                        : hasOh && hasStem
                          ? '1 РУКА + РУЛЕВАЯ'
                          : hasOh && hasKnee
                            ? '1 РУКА + КОЛЕНО'
                            : hasFlamingo
                              ? 'ФЛАМИНГО'
                              : hasStem
                                ? s.seated
                                  ? 'РУЛЕВАЯ · 2 НОГИ'
                                  : 'РУЛЕВАЯ'
                                : hasOh
                                  ? 'ВАНХЕНД'
                                  : 'НА КОЛЕНЕ';
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 4 * u;
          ctx.fillStyle =
            sim.a > 12
              ? ((hasNoHands || hasOh) && (hasKnee || hasStem || hasFlamingo))
                ? '#ffd34d'
                : hasNoHands
                  ? '#f472b6'
                  : hasFlamingo
                    ? '#fb7185'
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

        // First-moment hint when grounded (hidden during burnout or floating coin notifications)
        if (
          curMode === 'play' &&
          sim.a < 1 &&
          sim.pend === 0 &&
          sim.burnout < 0.05 &&
          sim.msgs.length === 0
        ) {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 4 * u;
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.font = `600 ${18 * u}px "Manrope", system-ui, sans-serif`;
          ctx.fillText('Держи ГАЗ, чтобы поднять колесо', W / 2, Math.max(by + 102 * u, H * 0.29));
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
      if (pausedRef.current && modeRef.current === 'play') {
        sound.stopMotor();
        lastTime = time;
        draw();
        rafId = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(Math.max(0, (time - lastTime) / 1000), 0.05);
      lastTime = time;
      update(dt);
      draw();
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      sound.stopMotor();
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      vv?.removeEventListener('resize', resize);
      ro?.disconnect();
    };
  }, [gasRef, brakeRef, oneHandRef, noHandsRef, kneeRef, stemFootRef, flamingoRef]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full"
      aria-label="Игровое поле Стант на самокате"
    />
  );
});
