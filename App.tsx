import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ShoppingBag,
  Play,
  Pause,
  Home,
  RotateCcw,
  ArrowLeft,
  Shield,
  Settings,
  Settings2,
  Shirt,
  Trophy,
  Crown,
  User,
  UserPlus,
  Package,
  Send,
  Coins,
  ArrowLeftRight,
  Sun,
  Moon,
  UserX,
} from 'lucide-react';
import { GameCanvas, type GameMode } from './components/GameCanvas';
import { HelmetIcon } from './components/HelmetIcon';
import { HelmetMenu } from './components/HelmetMenu';
import { OutfitModal } from './components/OutfitModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SettingsModal } from './components/SettingsModal';
import { TransferModal, type TransferTab } from './components/TransferModal';
import { PromoModal } from './components/PromoModal';
import { AuthModal } from './components/AuthModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { CaseModal, SCOOTER_CASE_PRICE } from './components/CaseModal';
import { DonateModal } from './components/DonateModal';
import { PaintModal, ScooterThumb } from './components/PaintModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ControlTutorialOverlay } from './components/ControlTutorialOverlay';
import {
  fetchMe,
  getStoredUser,
  pingPresenceHeartbeat,
  runGlobalClientWipeOnce,
  syncProfile,
  type AuthUser,
  type KickNotice,
  type SyncSavePayload,
} from './utils/accountApi';
import { consumeIncomingUrlAction, loadWalletProfile } from './utils/transfers';
import {
  getEffectiveScooterStats,
  getScooter,
  getScooterAkb,
  getScooterLight,
  getScooterUnderglow,
  getSecondMotorPrice,
  getVescPrice,
  SCOOTERS,
  VALID_AKB_IDS,
  VALID_LIGHT_IDS,
  VALID_UNDERGLOW_IDS,
  type AkbId,
  type LightId,
  type ScooterId,
  type ScooterPaint,
  type ScooterPaintMap,
  type UnderglowId,
} from './data/scooters';
import {
  getHelmet,
  HELMETS,
  HELMET_DUPLICATE_REFUND,
  HELMET_SPIN_COST,
  type HelmetId,
  type MotocrossHelmet,
} from './data/helmets';
import { getOutfit, OUTFITS, type OutfitId, type RiderGearSet } from './data/outfits';
import {
  loadMapId,
  loadTimeOfDay,
  loadWeatherId,
  saveMapId,
  saveTimeOfDay,
  saveWeatherId,
  type MapId,
  type TimeOfDay,
  type WeatherId,
} from './data/maps';
import { sound } from './utils/sound';

interface SaveState {
  coins: number;
  bestRun: number;
  own: ScooterId[];
  cur: ScooterId;
  helmets: HelmetId[];
  curH: HelmetId;
  outfits: OutfitId[];
  curO: OutfitId;
  vip: boolean;
  paints?: ScooterPaintMap;
  lights: LightId[];
  curLight: LightId;
  underglows: UnderglowId[];
  curUnderglow: UnderglowId;
  akbs: AkbId[];
  curAkb: AkbId;
  vesc: ScooterId[];
  motors: ScooterId[];
}

const STORAGE_KEY = 'ss';
const VALID_SCOOTERS: ScooterId[] = SCOOTERS.map((s) => s.id);
const VALID_HELMETS: HelmetId[] = HELMETS.map((h) => h.id);
const VALID_OUTFITS: OutfitId[] = OUTFITS.map((o) => o.id);
const FREE_OUTFITS: OutfitId[] = OUTFITS.filter((o) => o.price === 0).map((o) => o.id);

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
function sanitizePaintMap(raw: unknown): ScooterPaintMap {
  if (!raw || typeof raw !== 'object') return {};
  const out: ScooterPaintMap = {};
  for (const id of VALID_SCOOTERS) {
    const entry = (raw as Record<string, unknown>)[id];
    if (!entry || typeof entry !== 'object') continue;
    const p = (entry as Record<string, unknown>).primary;
    const s = (entry as Record<string, unknown>).secondary;
    const cleanP = typeof p === 'string' && HEX_COLOR_RE.test(p) ? p : undefined;
    const cleanS = typeof s === 'string' && HEX_COLOR_RE.test(s) ? s : undefined;
    if (cleanP || cleanS) {
      out[id] = { ...(cleanP ? { primary: cleanP } : {}), ...(cleanS ? { secondary: cleanS } : {}) };
    }
  }
  return out;
}

function loadState(): SaveState {
  runGlobalClientWipeOnce();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveState>;
      const own = Array.isArray(parsed.own)
        ? parsed.own.filter((id): id is ScooterId => VALID_SCOOTERS.includes(id))
        : (['c3'] as ScooterId[]);
      if (!own.includes('c3')) own.unshift('c3');
      const cur =
        parsed.cur && VALID_SCOOTERS.includes(parsed.cur) && own.includes(parsed.cur)
          ? parsed.cur
          : 'c3';

      const helmets = Array.isArray(parsed.helmets)
        ? parsed.helmets.filter((id): id is HelmetId => VALID_HELMETS.includes(id))
        : (['mx_start'] as HelmetId[]);
      if (!helmets.includes('mx_start')) helmets.unshift('mx_start');
      const curH =
        parsed.curH && VALID_HELMETS.includes(parsed.curH) && helmets.includes(parsed.curH)
          ? parsed.curH
          : 'mx_start';

      const outfits = Array.isArray(parsed.outfits)
        ? parsed.outfits.filter((id): id is OutfitId => VALID_OUTFITS.includes(id))
        : ([...FREE_OUTFITS] as OutfitId[]);
      for (const freeId of FREE_OUTFITS) {
        if (!outfits.includes(freeId)) outfits.unshift(freeId);
      }
      const curO =
        parsed.curO && VALID_OUTFITS.includes(parsed.curO) && outfits.includes(parsed.curO)
          ? parsed.curO
          : 'black_stant';

      const lights = Array.isArray(parsed.lights)
        ? parsed.lights.filter((id): id is LightId => VALID_LIGHT_IDS.includes(id))
        : (['stock'] as LightId[]);
      if (!lights.includes('stock')) lights.unshift('stock');
      const curLight =
        parsed.curLight && VALID_LIGHT_IDS.includes(parsed.curLight) && lights.includes(parsed.curLight)
          ? parsed.curLight
          : 'stock';
      const underglows = Array.isArray(parsed.underglows)
        ? parsed.underglows.filter((id): id is UnderglowId => VALID_UNDERGLOW_IDS.includes(id))
        : (['default', 'off'] as UnderglowId[]);
      if (!underglows.includes('default')) underglows.unshift('default');
      if (!underglows.includes('off')) underglows.push('off');
      const curUnderglow =
        parsed.curUnderglow &&
        VALID_UNDERGLOW_IDS.includes(parsed.curUnderglow) &&
        underglows.includes(parsed.curUnderglow)
          ? parsed.curUnderglow
          : 'default';
      const akbs = Array.isArray(parsed.akbs)
        ? parsed.akbs.filter((id): id is AkbId => VALID_AKB_IDS.includes(id))
        : (['stock'] as AkbId[]);
      if (!akbs.includes('stock')) akbs.unshift('stock');
      const curAkb =
        parsed.curAkb && VALID_AKB_IDS.includes(parsed.curAkb) && akbs.includes(parsed.curAkb)
          ? parsed.curAkb
          : 'stock';
      const vesc = Array.isArray(parsed.vesc)
        ? parsed.vesc.filter((id): id is ScooterId => VALID_SCOOTERS.includes(id))
        : [];
      const motors = Array.isArray(parsed.motors)
        ? parsed.motors.filter((id): id is ScooterId => VALID_SCOOTERS.includes(id))
        : [];

      return {
        coins:
          typeof parsed.coins === 'number' && Number.isFinite(parsed.coins)
            ? Math.max(0, Math.floor(parsed.coins))
            : 0,
        bestRun:
          typeof parsed.bestRun === 'number' && Number.isFinite(parsed.bestRun)
            ? Math.max(0, Math.floor(parsed.bestRun))
            : 0,
        own,
        cur,
        helmets,
        curH,
        outfits,
        curO,
        vip: Boolean(parsed.vip),
        paints: sanitizePaintMap(parsed.paints),
        lights,
        curLight,
        underglows,
        curUnderglow,
        akbs,
        curAkb,
        vesc,
        motors,
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return {
    coins: 0,
    bestRun: 0,
    own: ['c3'],
    cur: 'c3',
    helmets: ['mx_start'],
    curH: 'mx_start',
    outfits: [...FREE_OUTFITS],
    curO: 'black_stant',
    vip: false,
    paints: {},
    lights: ['stock'],
    curLight: 'stock',
    underglows: ['default', 'off'],
    curUnderglow: 'default',
    akbs: ['stock'],
    curAkb: 'stock',
    vesc: [],
    motors: [],
  };
}

function saveState(state: SaveState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write errors
  }
}

function normalizeServerSave(raw: SyncSavePayload): SaveState {
  const own = Array.isArray(raw.own)
    ? raw.own.filter((id): id is ScooterId => VALID_SCOOTERS.includes(id as ScooterId))
    : (['c3'] as ScooterId[]);
  if (!own.includes('c3')) own.unshift('c3');
  const cur = VALID_SCOOTERS.includes(raw.cur as ScooterId) ? (raw.cur as ScooterId) : 'c3';

  const helmets = Array.isArray(raw.helmets)
    ? raw.helmets.filter((id): id is HelmetId => VALID_HELMETS.includes(id as HelmetId))
    : (['mx_start'] as HelmetId[]);
  if (!helmets.includes('mx_start')) helmets.unshift('mx_start');
  const curH = VALID_HELMETS.includes(raw.curH as HelmetId)
    ? (raw.curH as HelmetId)
    : 'mx_start';

  const outfits = Array.isArray(raw.outfits)
    ? raw.outfits.filter((id): id is OutfitId => VALID_OUTFITS.includes(id as OutfitId))
    : ([...FREE_OUTFITS] as OutfitId[]);
  for (const freeId of FREE_OUTFITS) {
    if (!outfits.includes(freeId)) outfits.unshift(freeId);
  }
  const curO = VALID_OUTFITS.includes(raw.curO as OutfitId)
    ? (raw.curO as OutfitId)
    : 'black_stant';

  const lights = Array.isArray(raw.lights)
    ? raw.lights.filter((id): id is LightId => VALID_LIGHT_IDS.includes(id as LightId))
    : (['stock'] as LightId[]);
  if (!lights.includes('stock')) lights.unshift('stock');
  const curLight =
    raw.curLight &&
    VALID_LIGHT_IDS.includes(raw.curLight as LightId) &&
    lights.includes(raw.curLight as LightId)
      ? (raw.curLight as LightId)
      : 'stock';
  const underglows = Array.isArray(raw.underglows)
    ? raw.underglows.filter((id): id is UnderglowId =>
        VALID_UNDERGLOW_IDS.includes(id as UnderglowId)
      )
    : (['default', 'off'] as UnderglowId[]);
  if (!underglows.includes('default')) underglows.unshift('default');
  if (!underglows.includes('off')) underglows.push('off');
  const curUnderglow =
    raw.curUnderglow &&
    VALID_UNDERGLOW_IDS.includes(raw.curUnderglow as UnderglowId) &&
    underglows.includes(raw.curUnderglow as UnderglowId)
      ? (raw.curUnderglow as UnderglowId)
      : 'default';
  const akbs = Array.isArray(raw.akbs)
    ? raw.akbs.filter((id): id is AkbId => VALID_AKB_IDS.includes(id as AkbId))
    : (['stock'] as AkbId[]);
  if (!akbs.includes('stock')) akbs.unshift('stock');
  const curAkb =
    raw.curAkb && VALID_AKB_IDS.includes(raw.curAkb as AkbId) && akbs.includes(raw.curAkb as AkbId)
      ? (raw.curAkb as AkbId)
      : 'stock';
  const vesc = Array.isArray(raw.vesc)
    ? raw.vesc.filter((id): id is ScooterId => VALID_SCOOTERS.includes(id as ScooterId))
    : [];
  const motors = Array.isArray(raw.motors)
    ? raw.motors.filter((id): id is ScooterId => VALID_SCOOTERS.includes(id as ScooterId))
    : [];

  return {
    coins:
      typeof raw.coins === 'number' && Number.isFinite(raw.coins)
        ? Math.max(0, Math.floor(raw.coins))
        : 0,
    bestRun:
      typeof raw.bestRun === 'number' && Number.isFinite(raw.bestRun)
        ? Math.max(0, Math.floor(raw.bestRun))
        : 0,
    own,
    cur,
    helmets,
    curH,
    outfits,
    curO,
    vip: Boolean(raw.vip),
    paints: sanitizePaintMap(raw.paints),
    lights,
    curLight,
    underglows,
    curUnderglow,
    akbs,
    curAkb,
    vesc,
    motors,
  };
}

const VISITS_KEY = 'bs_total_players';
const VISIT_SESSION_KEY = 'bs_visit_counted';

function registerAndGetTotalPlayers(): number {
  try {
    const raw = localStorage.getItem(VISITS_KEY);
    let count = raw ? parseInt(raw, 10) : 0;
    if (!Number.isFinite(count) || count < 0) count = 0;
    if (!sessionStorage.getItem(VISIT_SESSION_KEY)) {
      count += 1;
      localStorage.setItem(VISITS_KEY, String(count));
      sessionStorage.setItem(VISIT_SESSION_KEY, '1');
    }
    return Math.max(1, count);
  } catch {
    return 1;
  }
}

const MUTE_STORAGE_KEY = 'bs_muted';
const TUTORIAL_SEEN_KEY = 'bs_tutorial_seen_v1';

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [save, setSave] = useState<SaveState>(() => loadState());
  const saveRef = useRef<SaveState>(save);
  saveRef.current = save;
  const [totalPlayers, setTotalPlayers] = useState<number>(() => registerAndGetTotalPlayers());
  const [mode, setMode] = useState<GameMode>('menu');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitTab, setAuthInitTab] = useState<'register' | 'login'>('register');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [casesOpen, setCasesOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [paintOpen, setPaintOpen] = useState(false);
  const [onlinePlayersCount, setOnlinePlayersCount] = useState(1);
  const [kickNotice, setKickNotice] = useState<KickNotice | null>(null);
  const [paused, setPaused] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [mapId, setMapId] = useState<MapId>(() => loadMapId());
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => loadTimeOfDay());
  const [weather, setWeather] = useState<WeatherId>(() => loadWeatherId());
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getStoredUser());
  const [myRank, setMyRank] = useState<number | null>(null);
  const [adminPayLink, setAdminPayLink] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferInitTab, setTransferInitTab] = useState<TransferTab>('send');
  const [transferPrefill, setTransferPrefill] = useState('');
  const [crashOverlay, setCrashOverlay] = useState(false);
  const [lostCoins, setLostCoins] = useState(0);
  const [runTrigger, setRunTrigger] = useState(0);
  const [muted, setMuted] = useState<boolean>(() => {
    const initial = loadMuted();
    sound.setMuted(initial);
    return initial;
  });
  const [oneHandPressed, setOneHandPressed] = useState(false);
  const [noHandsPressed, setNoHandsPressed] = useState(false);
  const [kneePressed, setKneePressed] = useState(false);
  const [stemFootPressed, setStemFootPressed] = useState(false);
  const [flamingoPressed, setFlamingoPressed] = useState(false);
  const [hornPressed, setHornPressed] = useState(false);

  const gasRef = useRef(false);
  const brakeRef = useRef(false);
  const oneHandRef = useRef(false);
  const noHandsRef = useRef(false);
  const kneeRef = useRef(false);
  const stemFootRef = useRef(false);
  const flamingoRef = useRef(false);

  // Direct DOM refs for GAS/BRAKE visual state so rapid double-taps trigger 0 React re-renders!
  const gasBtnRef = useRef<HTMLButtonElement | null>(null);
  const brakeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Track active pointer IDs per control for rock-solid mobile multi-touch
  const gasPointers = useRef<Set<number>>(new Set());
  const brakePointers = useRef<Set<number>>(new Set());
  const oneHandPointers = useRef<Set<number>>(new Set());
  const hornPointers = useRef<Set<number>>(new Set());

  const buzz = useCallback((ms: number) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      // Ignore unsupported vibration
    }
  }, []);

  const currentScooter = getScooter(save.cur);
  const currentHelmet = getHelmet(save.curH);
  const currentOutfit = getOutfit(save.curO);

  useEffect(() => {
    saveState(save);
  }, [save]);

  // Restore saved account session on startup
  useEffect(() => {
    let active = true;
    fetchMe().then((res) => {
      if (!active) return;
      if (res.ok) {
        setAuthUser(res.data.user);
        if (res.data.saveOverride) {
          setSave(normalizeServerSave(res.data.saveOverride));
          return;
        }
        const local = saveRef.current;
        const isFreshLocal =
          local.coins === 0 &&
          local.bestRun === 0 &&
          local.own.length <= 1 &&
          local.helmets.length <= 1;
        if (
          isFreshLocal &&
          (res.data.save.coins > 0 || res.data.save.own.length > 1 || res.data.save.vip)
        ) {
          setSave(normalizeServerSave(res.data.save));
        } else {
          // Always pick up server-authoritative VIP grant or admin coin adjustment
          const serverVip = Boolean(res.data.save.vip);
          const coinsOverride =
            typeof res.data.coinsOverride === 'number' ? res.data.coinsOverride : null;
          if (serverVip !== local.vip || (coinsOverride !== null && coinsOverride !== local.coins)) {
            const nextSave = {
              ...local,
              vip: serverVip,
              ...(coinsOverride !== null ? { coins: coinsOverride } : {}),
            };
            setSave(nextSave);
            syncProfile(nextSave);
          } else {
            syncProfile(local);
          }
        }
      } else if (res.unauthorized) {
        setAuthUser(null);
        if (res.kicked) {
          setKickNotice(res.kicked);
        }
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Unified live player & admin presence heartbeat (every 18s + tab return)
  useEffect(() => {
    let active = true;
    const tick = async () => {
      const clientId = loadWalletProfile().walletId;
      const res = await pingPresenceHeartbeat(clientId, currentScooter.name);
      if (active && res) {
        setOnlinePlayersCount(Math.max(1, res.onlinePlayersCount));
        if (typeof res.totalVisits === 'number' && Number.isFinite(res.totalVisits)) {
          setTotalPlayers((prev) => {
            const next = Math.max(prev, Math.floor(res.totalVisits!));
            try {
              localStorage.setItem(VISITS_KEY, String(next));
            } catch {
              // Ignore storage write errors
            }
            return next;
          });
        }
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    tick();
    const id = window.setInterval(tick, 18_000);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [authUser, currentScooter.name, settingsOpen]);

  const lastSyncedSigRef = useRef('');

  // Debounced background sync of balance & garage to Wealth Leaderboard
  useEffect(() => {
    if (!authUser) {
      lastSyncedSigRef.current = '';
      return;
    }
    const sig = `${authUser.id}|${JSON.stringify(save)}`;
    if (sig === lastSyncedSigRef.current) return;
    const timer = window.setTimeout(() => {
      const currentSnap = saveRef.current;
      const snapSig = `${authUser.id}|${JSON.stringify(currentSnap)}`;
      syncProfile(currentSnap).then((res) => {
        if (res.unauthorized) {
          setAuthUser(null);
          setMyRank(null);
          if (res.kicked) {
            setKickNotice(res.kicked);
          }
          return;
        }
        if (res.ok) {
          if (res.saveOverride) {
            const normalized = normalizeServerSave(res.saveOverride);
            lastSyncedSigRef.current = `${authUser.id}|${JSON.stringify(normalized)}`;
            setSave(normalized);
            return;
          }
          const needVip = typeof res.vip === 'boolean' && res.vip !== saveRef.current.vip;
          const needCoins =
            typeof res.coinsOverride === 'number' &&
            res.coinsOverride !== Math.floor(saveRef.current.coins);
          if (needVip || needCoins) {
            setSave((prev) => {
              const updated: SaveState = {
                ...prev,
                ...(needVip ? { vip: res.vip! } : {}),
                ...(needCoins ? { coins: Math.max(0, Math.floor(res.coinsOverride!)) } : {}),
              };
              lastSyncedSigRef.current = `${authUser.id}|${JSON.stringify(updated)}`;
              return updated;
            });
          } else {
            lastSyncedSigRef.current = snapSig;
          }
        }
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [authUser, save]);

  // Auto-open offline transfer screen when launched via a friend/bot link (?pay=... or ?claim=...)
  useEffect(() => {
    const incoming = consumeIncomingUrlAction();
    if (incoming) {
      if (incoming.tab === 'send') {
        setAdminPayLink(incoming.prefillInput);
        setSettingsOpen(true);
      } else {
        setTransferInitTab('receive');
        setTransferPrefill(incoming.prefillInput);
        setTransferOpen(true);
      }
    }
  }, []);

  const setGas = useCallback((active: boolean) => {
    gasRef.current = active;
    if (gasBtnRef.current) {
      gasBtnRef.current.dataset.pressed = active ? '1' : '0';
    }
  }, []);

  const setBrake = useCallback((active: boolean) => {
    brakeRef.current = active;
    if (brakeBtnRef.current) {
      brakeBtnRef.current.dataset.pressed = active ? '1' : '0';
    }
  }, []);

  const setOneHand = useCallback((active: boolean) => {
    oneHandRef.current = active;
    setOneHandPressed(active);
    if (active && noHandsRef.current) {
      noHandsRef.current = false;
      setNoHandsPressed(false);
    }
  }, []);

  const setNoHands = useCallback((active: boolean) => {
    noHandsRef.current = active;
    setNoHandsPressed(active);
    if (active && oneHandRef.current) {
      oneHandRef.current = false;
      setOneHandPressed(false);
    }
  }, []);

  const handleAutoReleaseNoHands = useCallback(() => {
    setNoHands(false);
  }, [setNoHands]);

  const setKnee = useCallback((active: boolean) => {
    kneeRef.current = active;
    setKneePressed(active);
    if (active) {
      if (stemFootRef.current) {
        stemFootRef.current = false;
        setStemFootPressed(false);
      }
      if (flamingoRef.current) {
        flamingoRef.current = false;
        setFlamingoPressed(false);
      }
    }
  }, []);

  const setStemFoot = useCallback((active: boolean) => {
    stemFootRef.current = active;
    setStemFootPressed(active);
    if (active) {
      if (kneeRef.current) {
        kneeRef.current = false;
        setKneePressed(false);
      }
      if (flamingoRef.current) {
        flamingoRef.current = false;
        setFlamingoPressed(false);
      }
    }
  }, []);

  const setFlamingo = useCallback((active: boolean) => {
    const isSeated = Boolean(getScooter(saveRef.current.cur).seated);
    const next = isSeated && active;
    flamingoRef.current = next;
    setFlamingoPressed(next);
    if (next) {
      if (kneeRef.current) {
        kneeRef.current = false;
        setKneePressed(false);
      }
      if (stemFootRef.current) {
        stemFootRef.current = false;
        setStemFootPressed(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentScooter.seated && (flamingoRef.current || flamingoPressed)) {
      flamingoRef.current = false;
      setFlamingoPressed(false);
    }
  }, [currentScooter.seated, flamingoPressed]);

  const setHorn = useCallback((active: boolean) => {
    setHornPressed(active);
    if (active) {
      sound.unlock();
      sound.startHorn();
    } else {
      sound.stopHorn();
    }
  }, []);

  const clearAllControls = useCallback(() => {
    gasPointers.current.clear();
    brakePointers.current.clear();
    oneHandPointers.current.clear();
    hornPointers.current.clear();
    setGas(false);
    setBrake(false);
    setOneHand(false);
    setNoHands(false);
    setKnee(false);
    setStemFoot(false);
    setFlamingo(false);
    setHorn(false);
  }, [setGas, setBrake, setOneHand, setNoHands, setKnee, setStemFoot, setFlamingo, setHorn]);

  const bindTouchControl = useCallback(
    (
      pointersRef: React.MutableRefObject<Set<number>>,
      setter: (active: boolean) => void
    ) => ({
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        sound.unlock();
        if (pointersRef.current.size > 3) {
          pointersRef.current.clear();
        }
        pointersRef.current.add(e.pointerId);
        setter(true);
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size === 0) setter(false);
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size === 0) setter(false);
      },
      onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
        if (e.pointerType === 'mouse' && pointersRef.current.has(e.pointerId)) {
          pointersRef.current.delete(e.pointerId);
          if (pointersRef.current.size === 0) setter(false);
        }
      },
      onDoubleClick: (e: React.MouseEvent) => e.preventDefault(),
      onDragStart: (e: React.DragEvent) => e.preventDefault(),
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }),
    []
  );

  // Global pointer-release safety net so GAS/BRAKE never stay stuck on rapid double-tap or mobile OS gesture interruptions
  useEffect(() => {
    const releasePointerId = (e: PointerEvent) => {
      if (gasPointers.current.delete(e.pointerId) && gasPointers.current.size === 0) {
        setGas(false);
      }
      if (brakePointers.current.delete(e.pointerId) && brakePointers.current.size === 0) {
        setBrake(false);
      }
      if (oneHandPointers.current.delete(e.pointerId) && oneHandPointers.current.size === 0) {
        setOneHand(false);
      }
      if (hornPointers.current.delete(e.pointerId) && hornPointers.current.size === 0) {
        setHorn(false);
      }
    };
    window.addEventListener('pointerup', releasePointerId, { passive: true });
    window.addEventListener('pointercancel', releasePointerId, { passive: true });
    return () => {
      window.removeEventListener('pointerup', releasePointerId);
      window.removeEventListener('pointercancel', releasePointerId);
    };
  }, [setGas, setBrake, setOneHand, setHorn]);

  const closeAllOverlays = useCallback(() => {
    setSettingsOpen(false);
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setDonateOpen(false);
    setTransferOpen(false);
    setTutorialOpen(false);
    setPaused(false);
    setCrashOverlay(false);
  }, []);

  const pauseGame = useCallback(() => {
    clearAllControls();
    setPaused(true);
  }, [clearAllControls]);

  const resumeGame = useCallback(() => {
    sound.unlock();
    clearAllControls();
    setPaused(false);
  }, [clearAllControls]);

  const openSettings = useCallback(() => {
    clearAllControls();
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setDonateOpen(false);
    setTransferOpen(false);
    setTutorialOpen(false);
    setPaintOpen(false);
    setCrashOverlay(false);
    setSettingsOpen(true);
  }, [clearAllControls]);

  const openPromo = useCallback(() => {
    clearAllControls();
    setSettingsOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setDonateOpen(false);
    setTransferOpen(false);
    setTutorialOpen(false);
    setPaintOpen(false);
    setCrashOverlay(false);
    setPromoOpen(true);
  }, [clearAllControls]);

  const closeTutorial = useCallback(() => {
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
    } catch {
      // Ignore storage write errors
    }
    setTutorialOpen(false);
  }, []);

  const openTutorial = useCallback(() => {
    clearAllControls();
    setTutorialOpen(true);
  }, [clearAllControls]);

  const startGame = useCallback(() => {
    sound.unlock();
    clearAllControls();
    closeAllOverlays();
    setLostCoins(0);
    setRunTrigger((n) => n + 1);
    setMode('play');
    if (!hasSeenTutorial()) {
      setTutorialOpen(true);
    }
  }, [clearAllControls, closeAllOverlays]);

  const openMenu = useCallback(() => {
    clearAllControls();
    closeAllOverlays();
    setAdminPayLink('');
    setMode('menu');
  }, [clearAllControls, closeAllOverlays]);

  const openShop = useCallback(() => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setDonateOpen(false);
    setTransferOpen(false);
    setCrashOverlay(false);
    setMode('shop');
  }, [clearAllControls]);

  const openCases = useCallback(() => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setDonateOpen(false);
    setTransferOpen(false);
    setCrashOverlay(false);
    setCasesOpen(true);
  }, [clearAllControls]);

  const openDonate = useCallback(() => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setTransferOpen(false);
    setCrashOverlay(false);
    setDonateOpen(true);
  }, [clearAllControls]);

  const openPaint = useCallback(() => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setDonateOpen(false);
    setTransferOpen(false);
    setCrashOverlay(false);
    setPaintOpen(true);
  }, [clearAllControls]);

  const openHelmets = useCallback(() => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setDonateOpen(false);
    setTransferOpen(false);
    setCrashOverlay(false);
    setMode('helmets');
  }, [clearAllControls]);

  const openOutfits = useCallback(() => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setDonateOpen(false);
    setTransferOpen(false);
    setCrashOverlay(false);
    setMode('outfits');
  }, [clearAllControls]);

  const openTransfers = useCallback((tab: TransferTab = 'receive', prefill = '') => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setDonateOpen(false);
    setTransferInitTab(tab);
    setTransferPrefill(prefill);
    setTransferOpen(true);
  }, [clearAllControls]);

  const openAuth = useCallback(
    (tab: 'register' | 'login' = 'register') => {
      clearAllControls();
      setSettingsOpen(false);
      setPromoOpen(false);
      setTransferOpen(false);
      setLeaderboardOpen(false);
      setCasesOpen(false);
      setDonateOpen(false);
      setAuthInitTab(tab);
      setAuthOpen(true);
    },
    [clearAllControls]
  );

  const openLeaderboard = useCallback(() => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setTransferOpen(false);
    setAuthOpen(false);
    setCasesOpen(false);
    setDonateOpen(false);
    setLeaderboardOpen(true);
    if (authUser) {
      void syncProfile(saveRef.current);
    }
  }, [clearAllControls, authUser]);

  const handleAuthSuccess = useCallback(
    (user: AuthUser, serverSave: SyncSavePayload, isNewRegistration: boolean) => {
      setAuthUser(user);
      if (!isNewRegistration) {
        setSave(normalizeServerSave(serverSave));
      }
    },
    []
  );

  const handleLogout = useCallback(() => {
    setAuthUser(null);
    setMyRank(null);
  }, []);

  const handleBankCoins = useCallback(
    (amount: number) => {
      setSave((prev) => ({ ...prev, coins: prev.coins + amount }));
      buzz(16);
    },
    [buzz]
  );

  const handleRemoveCoins = useCallback((amount: number) => {
    const clean = Math.max(0, Math.floor(amount));
    if (!Number.isFinite(clean) || clean <= 0) return;
    setSave((prev) => ({ ...prev, coins: Math.max(0, prev.coins - clean) }));
  }, []);

  const handleResetCoins = useCallback(() => {
    setSave((prev) => ({ ...prev, coins: 0 }));
  }, []);

  const handleSetCoins = useCallback((amount: number) => {
    const clean = Math.max(0, Math.floor(amount));
    if (!Number.isFinite(clean)) return;
    setSave((prev) => ({ ...prev, coins: clean }));
  }, []);

  const handleFullResetSelf = useCallback(() => {
    setSave({
      coins: 0,
      bestRun: 0,
      own: ['c3'],
      cur: 'c3',
      helmets: ['mx_start'],
      curH: 'mx_start',
      outfits: [...FREE_OUTFITS],
      curO: 'black_stant',
      vip: false,
      paints: {},
      lights: ['stock'],
      curLight: 'stock',
      underglows: ['default', 'off'],
      curUnderglow: 'default',
      akbs: ['stock'],
      curAkb: 'stock',
      vesc: [],
      motors: [],
    });
  }, []);

  const handleDeleteAccount = useCallback(() => {
    handleLogout();
    handleFullResetSelf();
  }, [handleLogout, handleFullResetSelf]);

  const handleSetSelfVip = useCallback((vip: boolean) => {
    setSave((prev) => ({ ...prev, vip: Boolean(vip) }));
  }, []);

  const handleSetPaint = useCallback((scooterId: ScooterId, paint: ScooterPaint | null) => {
    setSave((prev) => {
      const nextPaints: ScooterPaintMap = { ...(prev.paints ?? {}) };
      if (!paint || (!paint.primary && !paint.secondary)) {
        delete nextPaints[scooterId];
      } else {
        nextPaints[scooterId] = paint;
      }
      return { ...prev, paints: nextPaints };
    });
  }, []);

  const handleSelectLight = useCallback((id: LightId) => {
    setSave((prev) => {
      if (id !== 'stock' && !prev.lights.includes(id)) return prev;
      return { ...prev, curLight: id };
    });
  }, []);

  const handleBuyLight = useCallback((id: LightId) => {
    const spec = getScooterLight(id);
    setSave((prev) => {
      if (prev.lights.includes(id) || spec.price === 0) {
        return {
          ...prev,
          lights: prev.lights.includes(id) ? prev.lights : [...prev.lights, id],
          curLight: id,
        };
      }
      if (prev.coins < spec.price) return prev;
      sound.playBuy();
      return {
        ...prev,
        coins: prev.coins - spec.price,
        lights: [...prev.lights, id],
        curLight: id,
      };
    });
  }, []);

  const handleSelectUnderglow = useCallback((id: UnderglowId) => {
    setSave((prev) => {
      if (id !== 'default' && id !== 'off' && !prev.underglows.includes(id)) return prev;
      return { ...prev, curUnderglow: id };
    });
  }, []);

  const handleBuyUnderglow = useCallback((id: UnderglowId) => {
    const spec = getScooterUnderglow(id);
    setSave((prev) => {
      if (prev.underglows.includes(id) || spec.price === 0) {
        return {
          ...prev,
          underglows: prev.underglows.includes(id) ? prev.underglows : [...prev.underglows, id],
          curUnderglow: id,
        };
      }
      if (prev.coins < spec.price) return prev;
      sound.playBuy();
      return {
        ...prev,
        coins: prev.coins - spec.price,
        underglows: [...prev.underglows, id],
        curUnderglow: id,
      };
    });
  }, []);

  const handleSelectAkb = useCallback((id: AkbId) => {
    setSave((prev) => {
      if (id !== 'stock' && !prev.akbs.includes(id)) return prev;
      return { ...prev, curAkb: id };
    });
  }, []);

  const handleBuyAkb = useCallback((id: AkbId) => {
    const spec = getScooterAkb(id);
    setSave((prev) => {
      if (prev.akbs.includes(id) || spec.price === 0) {
        return {
          ...prev,
          akbs: prev.akbs.includes(id) ? prev.akbs : [...prev.akbs, id],
          curAkb: id,
        };
      }
      if (prev.coins < spec.price) return prev;
      sound.playBuy();
      return {
        ...prev,
        coins: prev.coins - spec.price,
        akbs: [...prev.akbs, id],
        curAkb: id,
      };
    });
  }, []);

  const handleBuyVesc = useCallback((scooterId: ScooterId) => {
    const s = getScooter(scooterId);
    const price = getVescPrice(s);
    setSave((prev) => {
      if (prev.vesc.includes(scooterId) || prev.coins < price) return prev;
      sound.playBuy();
      return {
        ...prev,
        coins: prev.coins - price,
        vesc: [...prev.vesc, scooterId],
      };
    });
  }, []);

  const handleBuySecondMotor = useCallback((scooterId: ScooterId) => {
    const s = getScooter(scooterId);
    const price = getSecondMotorPrice(s);
    setSave((prev) => {
      if (prev.motors.includes(scooterId) || prev.coins < price) return prev;
      sound.playBuy();
      return {
        ...prev,
        coins: prev.coins - price,
        motors: [...prev.motors, scooterId],
      };
    });
  }, []);

  const handleNewBest = useCallback((best: number) => {
    setSave((prev) => (best > prev.bestRun ? { ...prev, bestRun: best } : prev));
  }, []);

  const handleDeductTransferCoins = useCallback((amount: number): boolean => {
    const clean = Math.floor(amount);
    if (!Number.isFinite(clean) || clean < 1 || Math.floor(saveRef.current.coins) < clean) {
      return false;
    }
    saveRef.current = {
      ...saveRef.current,
      coins: saveRef.current.coins - clean,
    };
    setSave((prev) => {
      if (Math.floor(prev.coins) < clean) return prev;
      return { ...prev, coins: prev.coins - clean };
    });
    return true;
  }, []);

  const handleCrashStart = useCallback(() => {
    clearAllControls();
    buzz(35);
    setMode('crash');
  }, [clearAllControls, buzz]);

  const handleCrashFinish = useCallback((lost: number) => {
    setLostCoins(lost);
    setCrashOverlay(true);
  }, []);

  const handlePickScooter = useCallback((id: ScooterId) => {
    setSave((prev) => ({ ...prev, cur: id }));
  }, []);

  const handleBuyScooter = useCallback((id: ScooterId) => {
    const scooter = getScooter(id);
    if (scooter.caseOnly) return;
    setSave((prev) => {
      if (prev.own.includes(id) || prev.coins < scooter.price) return prev;
      sound.playBuy();
      return {
        ...prev,
        coins: prev.coins - scooter.price,
        own: [...prev.own, id],
        cur: id,
      };
    });
  }, []);

  const handleAdminSelectScooter = useCallback((id: ScooterId) => {
    setSave((prev) => ({
      ...prev,
      own: prev.own.includes(id) ? prev.own : [...prev.own, id],
      cur: id,
    }));
  }, []);

  const handleAdminUnlockAllScooters = useCallback(() => {
    setSave((prev) => ({
      ...prev,
      own: [...VALID_SCOOTERS],
    }));
  }, []);

  const handleSpendForCase = useCallback(() => {
    if (saveRef.current.coins < SCOOTER_CASE_PRICE) return false;
    saveRef.current = {
      ...saveRef.current,
      coins: saveRef.current.coins - SCOOTER_CASE_PRICE,
    };
    setSave((prev) => {
      if (prev.coins < SCOOTER_CASE_PRICE) return prev;
      return { ...prev, coins: prev.coins - SCOOTER_CASE_PRICE };
    });
    return true;
  }, []);

  const handleCaseWin = useCallback((scooterId: ScooterId): { alreadyOwned: boolean } => {
    const alreadyOwned = saveRef.current.own.includes(scooterId);
    if (!alreadyOwned) {
      const nextOwn = [...saveRef.current.own, scooterId];
      saveRef.current = { ...saveRef.current, own: nextOwn };
      setSave((prev) => {
        if (prev.own.includes(scooterId)) return prev;
        return { ...prev, own: [...prev.own, scooterId] };
      });
    }
    return { alreadyOwned };
  }, []);

  const handleEquipAndPlayCase = useCallback(
    (scooterId: ScooterId) => {
      setSave((prev) => (prev.own.includes(scooterId) ? { ...prev, cur: scooterId } : prev));
      startGame();
    },
    [startGame]
  );

  const handleSpinStart = useCallback(() => {
    if (saveRef.current.coins < HELMET_SPIN_COST) return false;
    saveRef.current = {
      ...saveRef.current,
      coins: saveRef.current.coins - HELMET_SPIN_COST,
    };
    setSave((prev) => {
      if (prev.coins < HELMET_SPIN_COST) return prev;
      return { ...prev, coins: prev.coins - HELMET_SPIN_COST };
    });
    return true;
  }, []);

  const handleSpinFinish = useCallback((won: MotocrossHelmet): { isDuplicate: boolean } => {
    const isDuplicate = saveRef.current.helmets.includes(won.id);
    setSave((prev) => {
      if (prev.helmets.includes(won.id)) {
        return { ...prev, coins: prev.coins + HELMET_DUPLICATE_REFUND };
      }
      return {
        ...prev,
        helmets: [...prev.helmets, won.id],
        curH: won.id,
      };
    });
    return { isDuplicate };
  }, []);

  const handleEquipHelmet = useCallback((id: HelmetId) => {
    setSave((prev) => {
      if (!prev.helmets.includes(id)) return prev;
      return { ...prev, curH: id };
    });
  }, []);

  const handlePickOutfit = useCallback((id: OutfitId) => {
    setSave((prev) => {
      if (!prev.outfits.includes(id)) return prev;
      return { ...prev, curO: id };
    });
  }, []);

  const handleBuyOutfit = useCallback((id: OutfitId) => {
    const outfit = getOutfit(id);
    setSave((prev) => {
      if (prev.outfits.includes(id) || prev.coins < outfit.price) return prev;
      sound.playBuy();
      return {
        ...prev,
        coins: prev.coins - outfit.price,
        outfits: [...prev.outfits, id],
        curO: id,
      };
    });
  }, []);

  const handleEquipSet = useCallback((set: RiderGearSet) => {
    setSave((prev) => {
      if (!prev.outfits.includes(set.outfitId) || !prev.helmets.includes(set.helmetId)) {
        return prev;
      }
      sound.playTick();
      return { ...prev, curO: set.outfitId, curH: set.helmetId };
    });
  }, []);

  const handleBuySet = useCallback((set: RiderGearSet, price: number) => {
    setSave((prev) => {
      const hasO = prev.outfits.includes(set.outfitId);
      const hasH = prev.helmets.includes(set.helmetId);
      if (hasO && hasH) {
        return { ...prev, curO: set.outfitId, curH: set.helmetId };
      }
      if (prev.coins < price) return prev;
      sound.playWin(true);
      return {
        ...prev,
        coins: prev.coins - price,
        outfits: hasO ? prev.outfits : [...prev.outfits, set.outfitId],
        helmets: hasH ? prev.helmets : [...prev.helmets, set.helmetId],
        curO: set.outfitId,
        curH: set.helmetId,
      };
    });
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      sound.setMuted(next);
      try {
        localStorage.setItem(MUTE_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const handleSelectMap = useCallback((nextMap: MapId) => {
    setMapId(nextMap);
    saveMapId(nextMap);
  }, []);

  const handleSelectWeather = useCallback((nextWeather: WeatherId) => {
    setWeather(nextWeather);
    saveWeatherId(nextWeather);
  }, []);

  const toggleTimeOfDay = useCallback(() => {
    setTimeOfDay((prev) => {
      const next: TimeOfDay = prev === 'day' ? 'night' : 'day';
      saveTimeOfDay(next);
      return next;
    });
  }, []);

  // Keyboard bindings: W/↑ = gas, S/↓/Shift = brake, Space = One-Hander (Ванхенд)
  useEffect(() => {
    const gasKeys = new Set(['ArrowUp', 'KeyW']);
    const brakeKeys = new Set(['ArrowDown', 'KeyS', 'ShiftLeft', 'ShiftRight']);
    const heldGas = new Set<string>();
    const heldBrake = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (tutorialOpen) {
        if (!e.repeat && (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space')) {
          e.preventDefault();
          closeTutorial();
        }
        return;
      }
      if (
        settingsOpen ||
        transferOpen ||
        promoOpen ||
        authOpen ||
        leaderboardOpen ||
        casesOpen ||
        donateOpen ||
        paintOpen
      )
        return;
      if (mode === 'play') {
        if (paused) {
          if (
            !e.repeat &&
            (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Space' || e.code === 'Enter')
          ) {
            e.preventDefault();
            resumeGame();
          }
          return;
        }
        if (gasKeys.has(e.code)) {
          e.preventDefault();
          if (e.repeat) return;
          sound.unlock();
          heldGas.add(e.code);
          setGas(true);
        } else if (brakeKeys.has(e.code)) {
          e.preventDefault();
          if (e.repeat) return;
          sound.unlock();
          heldBrake.add(e.code);
          setBrake(true);
        } else if (e.code === 'Space') {
          e.preventDefault();
          if (e.repeat) return;
          sound.unlock();
          setOneHand(true);
        } else if (e.code === 'KeyC' && !e.repeat) {
          e.preventDefault();
          sound.unlock();
          setOneHand(!oneHandRef.current);
        } else if ((e.code === 'KeyV' || e.code === 'KeyB') && !e.repeat) {
          e.preventDefault();
          sound.unlock();
          setNoHands(!noHandsRef.current);
        } else if ((e.code === 'KeyX' || e.code === 'KeyK') && !e.repeat) {
          e.preventDefault();
          sound.unlock();
          setKnee(!kneeRef.current);
        } else if ((e.code === 'KeyZ' || e.code === 'KeyR') && !e.repeat) {
          e.preventDefault();
          sound.unlock();
          setStemFoot(!stemFootRef.current);
        } else if (e.code === 'KeyF' && !e.repeat && currentScooter.seated) {
          e.preventDefault();
          sound.unlock();
          setFlamingo(!flamingoRef.current);
        } else if (e.code === 'KeyH') {
          e.preventDefault();
          if (e.repeat) return;
          setHorn(true);
        } else if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
          e.preventDefault();
          pauseGame();
        }
      } else if (crashOverlay && !e.repeat) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          startGame();
        } else if (e.code === 'Escape') {
          e.preventDefault();
          openMenu();
        }
      } else if (
        (mode === 'shop' || mode === 'helmets' || mode === 'outfits') &&
        !e.repeat &&
        e.code === 'Escape'
      ) {
        e.preventDefault();
        openMenu();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (gasKeys.has(e.code)) {
        heldGas.delete(e.code);
        if (heldGas.size === 0 && gasPointers.current.size === 0) setGas(false);
      }
      if (brakeKeys.has(e.code)) {
        heldBrake.delete(e.code);
        if (heldBrake.size === 0 && brakePointers.current.size === 0) setBrake(false);
      }
      if (e.code === 'Space' && oneHandPointers.current.size === 0) {
        setOneHand(false);
      }
      if (e.code === 'KeyH' && hornPointers.current.size === 0) {
        setHorn(false);
      }
    };

    const releaseAll = () => {
      heldGas.clear();
      heldBrake.clear();
      clearAllControls();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        releaseAll();
        if (mode === 'play' && !tutorialOpen) {
          setPaused(true);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseAll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    mode,
    paused,
    settingsOpen,
    transferOpen,
    promoOpen,
    authOpen,
    leaderboardOpen,
    casesOpen,
    donateOpen,
    paintOpen,
    tutorialOpen,
    crashOverlay,
    closeTutorial,
    pauseGame,
    resumeGame,
    setGas,
    setBrake,
    setOneHand,
    setNoHands,
    setKnee,
    setStemFoot,
    setFlamingo,
    currentScooter.seated,
    setHorn,
    clearAllControls,
    openMenu,
    startGame,
  ]);

  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden bg-[#10151c]"
      onContextMenu={(e) => {
        if (mode === 'play') e.preventDefault();
      }}
    >
      <OfflineIndicator />
      {/* Live 60fps Game Canvas */}
      <GameCanvas
        mode={mode}
        scooterId={save.cur}
        helmetId={save.curH}
        outfitId={save.curO}
        mapId={mapId}
        timeOfDay={timeOfDay}
        weather={weather}
        coins={save.coins}
        bestRun={save.bestRun}
        vip={save.vip}
        paints={save.paints}
        lightId={save.curLight}
        underglowId={save.curUnderglow}
        akbId={save.curAkb}
        hasVesc={save.vesc.includes(save.cur)}
        hasSecondMotor={save.motors.includes(save.cur)}
        gasRef={gasRef}
        brakeRef={brakeRef}
        oneHandRef={oneHandRef}
        noHandsRef={noHandsRef}
        kneeRef={kneeRef}
        stemFootRef={stemFootRef}
        flamingoRef={flamingoRef}
        runTrigger={runTrigger}
        paused={
          paused ||
          tutorialOpen ||
          settingsOpen ||
          promoOpen ||
          authOpen ||
          leaderboardOpen ||
          casesOpen ||
          donateOpen ||
          paintOpen ||
          transferOpen
        }
        onBankCoins={handleBankCoins}
        onNewBest={handleNewBest}
        onCrashStart={handleCrashStart}
        onCrashFinish={handleCrashFinish}
        onAutoReleaseNoHands={handleAutoReleaseNoHands}
      />

      {/* Top-right compact utility bar during gameplay (only Day/Night + Pause) */}
      {mode === 'play' && !paused && (
        <div
          className="fixed right-3 z-20 flex items-center gap-1.5"
          style={{ top: 'max(10px, env(safe-area-inset-top, 10px))' }}
        >
          <button
            type="button"
            onClick={toggleTimeOfDay}
            aria-label={timeOfDay === 'night' ? 'Переключить на день' : 'Переключить на ночь'}
            title={timeOfDay === 'night' ? 'День' : 'Ночь'}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/50 hover:bg-black/65 active:scale-95 text-[#ffd34d] border border-white/12 backdrop-blur-sm transition"
          >
            {timeOfDay === 'night' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-sky-300" />}
          </button>
          <button
            type="button"
            onClick={pauseGame}
            aria-label="Пауза"
            title="Пауза (P / Esc)"
            className="h-10 px-3 sm:px-3.5 rounded-xl bg-black/55 hover:bg-black/70 active:scale-95 text-white font-bold text-sm flex items-center gap-1.5 border border-white/15 backdrop-blur-sm transition whitespace-nowrap"
          >
            <Pause className="w-4 h-4 fill-current text-[#ff8b4a]" />
            <span className="hidden sm:inline">Пауза</span>
          </button>
        </div>
      )}

      {/* Pause Menu Overlay */}
      {mode === 'play' && paused && !tutorialOpen && (
        <div
          className="fixed inset-0 z-30 flex items-start justify-center p-4 bg-[#0a0d12]/74 backdrop-blur-[3px] overflow-y-auto mobile-scroll"
          style={{
            paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#161c24]/96 border border-white/12 p-5 sm:p-6 text-center shadow-2xl my-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ff6a1a]/15 border border-[#ff6a1a]/35 text-[#ff8b4a] text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <Pause className="w-3.5 h-3.5 fill-current" />
              Игра на паузе
            </div>
            <h2 className="font-display text-3xl font-black text-white leading-tight">
              ПАУЗА
            </h2>
            <p className="text-xs text-white/65 font-mono-num mt-1 mb-5">
              {currentScooter.name} · 🪙 {Math.floor(save.coins).toLocaleString('ru-RU')}
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={resumeGame}
                className="w-full h-12 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] active:scale-[0.99] text-white font-display font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Play className="w-5 h-5 fill-current" />
                Продолжить
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={toggleTimeOfDay}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition whitespace-nowrap"
                >
                  {timeOfDay === 'night' ? (
                    <>
                      <Moon className="w-4 h-4 text-indigo-300" />
                      Ночь
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4 text-amber-300" />
                      День
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={openSettings}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition whitespace-nowrap"
                >
                  <Settings className="w-4 h-4 text-[#ff8b4a]" />
                  Настройки
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={startGame}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4 text-[#ff8b4a]" />
                  Заново
                </button>
                <button
                  type="button"
                  onClick={openMenu}
                  className="h-11 rounded-xl bg-white/6 hover:bg-white/12 text-white/90 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition whitespace-nowrap"
                >
                  <Home className="w-4 h-4" />
                  В меню
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barely-visible square-ish half-screen Gas & Brake touch zones + subtle Trick Toggles */}
      {mode === 'play' && !paused && !tutorialOpen && (
        <>
          {/* Subtle Trick Buttons above right Gas zone: (Flamingo on e-bikes) + Stem-Foot + One-Knee + One-Hander + No-Hander */}
          <div
            className="fixed z-20 flex items-center gap-1 sm:gap-1.5"
            style={{
              right: 'max(10px, env(safe-area-inset-right, 10px))',
              bottom: 'calc(max(10px, env(safe-area-inset-bottom, 10px)) + clamp(120px, 36dvh, 215px) + 8px)',
            }}
          >
            {/* Flamingo Stunt Toggle Button — exclusively for electric pitbikes (NOT kick-scooters) */}
            {currentScooter.seated && (
              <button
                type="button"
                aria-pressed={flamingoPressed}
                aria-label="Фламинго"
                title="Фламинго (F)"
                onPointerDown={(e) => {
                  e.preventDefault();
                  setFlamingo(!flamingoRef.current);
                  buzz(14);
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-[46px] h-[50px] sm:w-[58px] sm:h-[60px] [@media(max-height:500px)]:w-[44px] [@media(max-height:500px)]:h-[44px] rounded-xl flex flex-col items-center justify-center gap-0.5 border transition select-none touch-none ${
                  flamingoPressed
                    ? 'bg-rose-500/50 border-rose-300/85 text-white scale-95'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.14] text-white/45'
                }`}
              >
                <svg
                  viewBox="0 0 48 48"
                  className="w-6 h-6 sm:w-7 sm:h-7 [@media(max-height:500px)]:w-5 [@media(max-height:500px)]:h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="14" cy="37" r="4.5" />
                  <circle cx="38" cy="25" r="4.2" />
                  <path d="M18.5 34.8 L32.5 28 L29 14" />
                  <path d="M21 32 L20 20.5" />
                  <path d="M20 20.5 L27.5 17.5 L21.5 24" />
                  <path d="M20 20.5 L21 12 L29 14" />
                  <circle cx="22" cy="7.8" r="2.7" fill="currentColor" stroke="none" />
                </svg>
                <span className="text-[6.8px] sm:text-[8px] font-display font-extrabold tracking-tight leading-none uppercase">
                  ФЛАМИНГО
                </span>
              </button>
            )}

            {/* Foot-on-Steering-Column Stunt Toggle Button (Нога на рулевой / обе ноги на электроскутерах) */}
            <button
              type="button"
              aria-pressed={stemFootPressed}
              aria-label={currentScooter.seated ? 'Две ноги на рулевой' : 'Нога на рулевой'}
              onPointerDown={(e) => {
                e.preventDefault();
                setStemFoot(!stemFootRef.current);
                buzz(14);
              }}
              onContextMenu={(e) => e.preventDefault()}
              className={`${
                currentScooter.seated
                  ? 'w-[46px] h-[50px] sm:w-[58px] sm:h-[60px] [@media(max-height:500px)]:w-[44px] [@media(max-height:500px)]:h-[44px]'
                  : 'w-[50px] h-[52px] sm:w-[60px] sm:h-[60px] [@media(max-height:500px)]:w-[46px] [@media(max-height:500px)]:h-[46px]'
              } rounded-xl flex flex-col items-center justify-center gap-0.5 border transition select-none touch-none ${
                stemFootPressed
                  ? 'bg-emerald-500/45 border-emerald-300/80 text-white scale-95'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.14] text-white/45'
              }`}
            >
              <svg
                viewBox="0 0 48 48"
                className="w-6 h-6 sm:w-7 sm:h-7 [@media(max-height:500px)]:w-5 [@media(max-height:500px)]:h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="14" cy="37" r="4.5" />
                <circle cx="38" cy="25" r="4.2" />
                <path d="M18.5 34.8 L32.5 28 L28.5 12.5" />
                {currentScooter.seated ? (
                  <>
                    {/* Both legs lifted onto handlebars (e-scooters & pitbikes) */}
                    <path d="M17.5 24 L24.5 18.5 L30.2 19.2" />
                    <path d="M17.5 24 L23.5 23 L29.8 23.8" />
                  </>
                ) : (
                  <>
                    {/* Classic standing scooter: back foot on deck, front foot on steering column */}
                    <path d="M18.5 33.5 L18.5 24 L24.5 20 L30 21.5" />
                  </>
                )}
                <path d="M18.5 24 L17 14.5 L28 13.5" />
                <circle cx="18.2" cy="9.2" r="2.8" fill="currentColor" stroke="none" />
              </svg>
              <span className="text-[7.5px] sm:text-[8.5px] font-display font-extrabold tracking-wide leading-none uppercase">
                РУЛЕВАЯ
              </span>
            </button>

            {/* One-Knee Stunt Toggle Button (На одном колене) */}
            <button
              type="button"
              aria-pressed={kneePressed}
              aria-label="На одном колене"
              onPointerDown={(e) => {
                e.preventDefault();
                setKnee(!kneeRef.current);
                buzz(14);
              }}
              onContextMenu={(e) => e.preventDefault()}
              className={`${
                currentScooter.seated
                  ? 'w-[46px] h-[50px] sm:w-[58px] sm:h-[60px] [@media(max-height:500px)]:w-[44px] [@media(max-height:500px)]:h-[44px]'
                  : 'w-[50px] h-[52px] sm:w-[60px] sm:h-[60px] [@media(max-height:500px)]:w-[46px] [@media(max-height:500px)]:h-[46px]'
              } rounded-xl flex flex-col items-center justify-center gap-0.5 border transition select-none touch-none ${
                kneePressed
                  ? 'bg-sky-500/45 border-sky-300/75 text-white scale-95'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.14] text-white/45'
              }`}
            >
              {/* Rider kneeling on one knee icon */}
              <svg
                viewBox="0 0 48 48"
                className="w-6 h-6 sm:w-7 sm:h-7 [@media(max-height:500px)]:w-5 [@media(max-height:500px)]:h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="14" cy="37" r="4.5" />
                <circle cx="38" cy="25" r="4.2" />
                <path d="M18.5 34.8 L32.5 28 L29.5 14" />
                <path d="M19 33 L21.5 26 L26 29.5 L20.5 31" />
                <path d="M21.5 26 L21 16.5 L29 14.5" />
                <circle cx="22.5" cy="11.5" r="2.8" fill="currentColor" stroke="none" />
              </svg>
              <span className="text-[7.5px] sm:text-[8.5px] font-display font-extrabold tracking-wide leading-none uppercase">
                КОЛЕНО
              </span>
            </button>

            {/* One-Hander Toggle Button (1 Рука) */}
            <button
              type="button"
              aria-pressed={oneHandPressed}
              aria-label="Ванхенд"
              onPointerDown={(e) => {
                e.preventDefault();
                setOneHand(!oneHandRef.current);
                buzz(14);
              }}
              onContextMenu={(e) => e.preventDefault()}
              className={`${
                currentScooter.seated
                  ? 'w-[46px] h-[50px] sm:w-[58px] sm:h-[60px] [@media(max-height:500px)]:w-[44px] [@media(max-height:500px)]:h-[44px]'
                  : 'w-[50px] h-[52px] sm:w-[60px] sm:h-[60px] [@media(max-height:500px)]:w-[46px] [@media(max-height:500px)]:h-[46px]'
              } rounded-xl flex flex-col items-center justify-center gap-0.5 border transition select-none touch-none ${
                oneHandPressed
                  ? 'bg-[#ff6a1a]/50 border-[#ffc99e]/80 text-white scale-95'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.14] text-white/45'
              }`}
            >
              {/* Wheelie Life One-Hander Rider Icon */}
              <svg
                viewBox="0 0 48 48"
                className="w-6 h-6 sm:w-7 sm:h-7 [@media(max-height:500px)]:w-5 [@media(max-height:500px)]:h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="15" cy="37" r="4.5" />
                <circle cx="38" cy="25" r="4.2" />
                <path d="M19.5 34.8 L32.5 28.2 L29 14.5" />
                <path d="M23 32 L22 23 L17.5 15.5" />
                <circle cx="18.5" cy="10.5" r="2.8" fill="currentColor" stroke="none" />
                <path d="M18.5 16.5 L28 15" />
                <path d="M17.5 16 L10.5 12 L8 5.5" />
              </svg>
              <span className="text-[7.5px] sm:text-[8.5px] font-display font-extrabold tracking-wide leading-none uppercase">
                1 РУКА
              </span>
            </button>

            {/* No-Hander Toggle Button (Без рук — instant drop stunt!) */}
            <button
              type="button"
              aria-pressed={noHandsPressed}
              aria-label="Без рук"
              onPointerDown={(e) => {
                e.preventDefault();
                setNoHands(!noHandsRef.current);
                buzz(18);
              }}
              onContextMenu={(e) => e.preventDefault()}
              className={`${
                currentScooter.seated
                  ? 'w-[46px] h-[50px] sm:w-[58px] sm:h-[60px] [@media(max-height:500px)]:w-[44px] [@media(max-height:500px)]:h-[44px]'
                  : 'w-[50px] h-[52px] sm:w-[60px] sm:h-[60px] [@media(max-height:500px)]:w-[46px] [@media(max-height:500px)]:h-[46px]'
              } rounded-xl flex flex-col items-center justify-center gap-0.5 border transition select-none touch-none ${
                noHandsPressed
                  ? 'bg-pink-500/50 border-pink-300/85 text-white scale-95'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.14] text-white/45'
              }`}
            >
              {/* No-Hander Rider Icon (both arms spread wide off handlebars!) */}
              <svg
                viewBox="0 0 48 48"
                className="w-6 h-6 sm:w-7 sm:h-7 [@media(max-height:500px)]:w-5 [@media(max-height:500px)]:h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="15" cy="37" r="4.5" />
                <circle cx="38" cy="25" r="4.2" />
                <path d="M19.5 34.8 L32.5 28.2 L29.5 15.5" />
                <path d="M22.5 32 L21.5 23 L19 15.5" />
                <circle cx="19.5" cy="10.2" r="2.8" fill="currentColor" stroke="none" />
                {/* Both arms raised wide off the bars */}
                <path d="M19 16 L11.5 12 L8 5.5" />
                <path d="M19.5 16 L26 11 L30 5" />
              </svg>
              <span className="text-[7.5px] sm:text-[8.5px] font-display font-extrabold tracking-wide leading-none uppercase">
                БЕЗ РУК
              </span>
            </button>
          </div>

          {/* Horn Touch Button above left Brake zone (also bound to H on keyboard) */}
          <div
            className="fixed z-20 flex items-center"
            style={{
              left: 'max(10px, env(safe-area-inset-left, 10px))',
              bottom: 'calc(max(10px, env(safe-area-inset-bottom, 10px)) + clamp(120px, 36dvh, 215px) + 8px)',
            }}
          >
            <button
              type="button"
              aria-pressed={hornPressed}
              aria-label="Клаксон"
              title="Клаксон (H)"
              {...bindTouchControl(hornPointers, setHorn)}
              className={`min-w-[54px] h-[52px] sm:min-w-[64px] sm:h-[60px] [@media(max-height:500px)]:h-[46px] px-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 border transition select-none touch-none ${
                hornPressed
                  ? 'bg-amber-500/45 border-amber-300/85 text-white scale-95'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.14] text-white/45'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 sm:w-6 sm:h-6 [@media(max-height:500px)]:w-4.5 [@media(max-height:500px)]:h-4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              <span className="text-[7.5px] sm:text-[8.5px] font-display font-extrabold tracking-wide leading-none uppercase">
                КЛАКСОН
              </span>
            </button>
          </div>

          {/* Bottom-Left: Barely-visible square half-screen Brake Touch Zone */}
          <button
            ref={brakeBtnRef}
            data-pressed="0"
            type="button"
            aria-label="Тормоз"
            {...bindTouchControl(brakePointers, setBrake)}
            style={{
              left: 'max(10px, env(safe-area-inset-left, 10px))',
              bottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
              height: 'clamp(120px, 36dvh, 215px)',
            }}
            className="fixed z-20 w-[45vw] max-w-[260px] rounded-xl flex flex-col items-start justify-end p-3.5 sm:p-4 border transition-colors duration-75 select-none touch-none bg-white/[0.025] border-white/[0.10] text-white/30 data-[pressed=1]:bg-red-500/[0.15] data-[pressed=1]:border-red-300/45 data-[pressed=1]:text-red-100/85"
          >
            <div className="flex flex-col items-center gap-1 opacity-85 pointer-events-none">
              <svg
                viewBox="0 0 44 54"
                className="w-7 h-9 sm:w-8 sm:h-10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="6" y="10" width="32" height="36" rx="6" />
                <line x1="12" y1="19" x2="32" y2="19" />
                <line x1="12" y1="26" x2="32" y2="26" />
                <line x1="12" y1="33" x2="32" y2="33" />
                <line x1="12" y1="40" x2="32" y2="40" />
                <path d="M18 10 V4 H26 V10" />
              </svg>
              <span className="font-display font-bold text-[10px] sm:text-[11px] tracking-wider uppercase leading-none">
                ТОРМОЗ
              </span>
            </div>
          </button>

          {/* Bottom-Right: Barely-visible square half-screen Gas Touch Zone */}
          <button
            ref={gasBtnRef}
            data-pressed="0"
            type="button"
            aria-label="Газ"
            {...bindTouchControl(gasPointers, setGas)}
            style={{
              right: 'max(10px, env(safe-area-inset-right, 10px))',
              bottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
              height: 'clamp(120px, 36dvh, 215px)',
            }}
            className="fixed z-20 w-[45vw] max-w-[260px] rounded-xl flex flex-col items-end justify-end p-3.5 sm:p-4 border transition-colors duration-75 select-none touch-none bg-white/[0.025] border-white/[0.10] text-white/30 data-[pressed=1]:bg-white/[0.13] data-[pressed=1]:border-white/45 data-[pressed=1]:text-white/90"
          >
            <div className="flex flex-col items-center gap-1 opacity-85 pointer-events-none">
              <svg
                viewBox="0 0 44 58"
                className="w-7 h-9 sm:w-8 sm:h-10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 5 H31 C34.5 5 37 7.8 36.5 11.5 L33.5 47 C33.2 50.5 30.5 53 27 53 H17 C13.5 53 10.8 50.5 10.5 47 L7.5 11.5 C7 7.8 9.5 5 13 5 Z" />
                <line x1="17" y1="13" x2="18" y2="45" />
                <line x1="22" y1="12" x2="22" y2="46" />
                <line x1="27" y1="13" x2="26" y2="45" />
              </svg>
              <span className="font-display font-bold text-[10px] sm:text-[11px] tracking-wider uppercase leading-none">
                ГАЗ
              </span>
            </div>
          </button>
        </>
      )}

      {/* Main Menu Overlay */}
      {mode === 'menu' && (
        <div
          className="fixed inset-0 z-30 flex items-start justify-center p-3.5 sm:p-4 bg-[#0a0d12]/72 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
          style={{
            paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#161c24]/95 border border-white/10 p-5 sm:p-6 text-center shadow-2xl my-auto">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <div className="text-sm font-semibold text-white/85 font-mono-num truncate">
                  🪙 {Math.floor(save.coins).toLocaleString('ru-RU')}
                </div>
                {save.vip && (
                  <span className="px-1.5 py-0.5 rounded bg-[#ffd34d]/20 border border-[#ffd34d]/50 text-[#ffd34d] text-[10px] font-extrabold shrink-0">
                    VIP ×2
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold font-mono-num shrink-0"
                  title="Игроки в игре прямо сейчас"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Онлайн: {onlinePlayersCount}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleTimeOfDay}
                  aria-label={timeOfDay === 'night' ? 'Переключить на день' : 'Переключить на ночь'}
                  title={timeOfDay === 'night' ? 'День' : 'Ночь'}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-[#ffd34d] transition"
                >
                  {timeOfDay === 'night' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4 text-sky-300" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={openSettings}
                  aria-label="Настройки"
                  className="h-9 px-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/85 text-xs font-bold transition"
                >
                  <Settings className="w-4 h-4 text-[#ff8b4a]" />
                  <span className="hidden sm:inline">Настройки</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3.5 text-left mb-4">
              <img
                src="/pwa-192x192.png?v=2"
                alt="BLACK STANT"
                className="w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-2xl border border-[#ff6a1a]/35 shadow-lg shrink-0 object-cover"
              />
              <div className="min-w-0">
                <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  BLACK STANT
                </h1>
                <p className="text-xs sm:text-sm text-white/68 mt-1 leading-snug">
                  Держи газ — поднимай колесо. Опусти до падения, чтобы забрать монеты!
                </p>
              </div>
            </div>

            {/* Current scooter & motocross helmet summary */}
            <div className="mb-5 rounded-xl bg-[#1e2631] border border-white/8 p-3.5 flex items-center gap-3.5 text-left">
              <div className="w-20 h-20 shrink-0 rounded-lg bg-[#e8edf3] flex items-center justify-center p-1.5">
                <ScooterThumb
                  scooter={currentScooter}
                  paint={save.paints?.[currentScooter.id]}
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-bold text-white truncate">
                  {currentScooter.name}
                </div>
                {(() => {
                  const curHasVesc = save.vesc.includes(currentScooter.id);
                  const curHasMotor = save.motors.includes(currentScooter.id);
                  const curAkbSpec = getScooterAkb(save.curAkb);
                  const curStats = getEffectiveScooterStats(
                    currentScooter,
                    curHasVesc,
                    curHasMotor,
                    save.curAkb
                  );
                  return (
                    <div className="text-xs text-white/70 font-mono-num">
                      до {curStats.maxKmh} км/ч · Газ ×{curStats.power} · ×{currentScooter.multiplier}
                      {curHasVesc ? ' · Веск' : ''}
                      {curHasMotor ? ' · 2-й мотор' : ''}
                      {curAkbSpec.bonusKmh > 0 ? ` · АКБ +${curAkbSpec.bonusKmh}` : ''}
                    </div>
                  );
                })()}
                <div className="mt-2 pt-2 border-t border-white/8 flex items-center gap-2">
                  <HelmetIcon helmet={currentHelmet} className="w-8 h-7 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {currentHelmet.name}
                    </div>
                    <div className="text-[11px] text-white/55">Мотокроссовый шлем</div>
                  </div>
                </div>
              </div>
            </div>

            {save.bestRun > 0 && (
              <div className="mb-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e2631] border border-[#ffd34d]/25">
                <Trophy className="w-3.5 h-3.5 text-[#ffd34d]" />
                <span className="text-xs text-white/70">Рекорд трюка:</span>
                <span className="font-mono-num text-xs font-extrabold text-[#ffd34d]">
                  {save.bestRun.toLocaleString('ru-RU')} 🪙
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={startGame}
                className="w-full h-13 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] active:scale-[0.99] text-white font-display font-bold text-xl flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Play className="w-5 h-5 fill-current" />
                Старт
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={openShop}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition whitespace-nowrap px-2"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span className="truncate">Самокаты</span>
                </button>
                <button
                  type="button"
                  onClick={openPaint}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-sky-400/35 transition whitespace-nowrap px-2"
                >
                  <Settings2 className="w-4 h-4 shrink-0 text-sky-300" />
                  <span className="truncate">Кастомизация</span>
                </button>
                <button
                  type="button"
                  onClick={openSettings}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-[#ff6a1a]/30 transition whitespace-nowrap px-2"
                >
                  <Settings className="w-4 h-4 shrink-0 text-[#ff8b4a]" />
                  <span className="truncate">Вещи</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={openCases}
                  className="h-11 rounded-xl bg-gradient-to-r from-[#ff6a1a]/25 to-[#ffd34d]/20 hover:from-[#ff6a1a]/35 hover:to-[#ffd34d]/30 active:scale-[0.99] text-[#ffe1a8] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-[#ffd34d]/40 transition whitespace-nowrap"
                >
                  <Package className="w-4 h-4 shrink-0 text-[#ffd34d]" />
                  Кейсы
                </button>
                <button
                  type="button"
                  onClick={openLeaderboard}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-[#ffd34d]/30 transition whitespace-nowrap"
                >
                  <Crown className="w-4 h-4 shrink-0 text-[#ffd34d]" />
                  Топ
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className={`h-11 px-2 rounded-xl active:scale-[0.99] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition min-w-0 ${
                    authUser
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/22 border-emerald-400/35 text-emerald-200'
                      : 'bg-[#242e3b] hover:bg-[#2d3948] border-white/10 text-white'
                  }`}
                >
                  {authUser ? (
                    <>
                      <User className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span className="truncate">@{authUser.username}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 shrink-0 text-[#ff8b4a]" />
                      <span className="truncate">Аккаунт</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openTransfers('send')}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-[#ff6a1a]/30 transition whitespace-nowrap"
                >
                  <ArrowLeftRight className="w-4 h-4 shrink-0 text-[#ff8b4a]" />
                  Переводы
                </button>
                <button
                  type="button"
                  onClick={openDonate}
                  className="h-11 rounded-xl bg-emerald-500/18 hover:bg-emerald-500/28 active:scale-[0.99] text-emerald-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-emerald-400/40 transition whitespace-nowrap"
                >
                  <Coins className="w-4 h-4 shrink-0 text-emerald-300" />
                  Донат
                </button>
              </div>

              <PWAInstallButton />

              <a
                href="https://t.me/durov0113"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 active:scale-[0.99] text-sky-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-sky-400/30 transition whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5 shrink-0 text-sky-300" />
                Поддержка Telegram (@durov0113)
              </a>
            </div>

            <p className="hidden sm:block mt-3.5 text-xs text-white/45">
              W/↑ газ · S/↓ тормоз · H — клаксон · C — 1 рука · V — без рук · X — колено · Z — рулевая · P/Esc — пауза
            </p>
          </div>
        </div>
      )}

      {/* Shop Overlay */}
      {mode === 'shop' && (
        <div
          className="fixed inset-0 z-30 flex items-start justify-center p-3.5 sm:p-4 bg-[#0a0d12]/78 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
          style={{
            paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-[#161c24]/95 border border-white/10 p-4 sm:p-6 shadow-2xl my-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 mb-4 sm:mb-5">
              <div className="min-w-0">
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Магазин самокатов
                </h2>
                <p className="text-sm text-white/65 font-mono-num mt-0.5">
                  Баланс: 🪙 {Math.floor(save.coins).toLocaleString('ru-RU')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={openPaint}
                  className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-sky-500/18 hover:bg-sky-500/28 text-sky-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-sky-400/40 transition whitespace-nowrap"
                >
                  <Settings2 className="w-4 h-4 text-sky-300" />
                  Кастомизация
                </button>
                <button
                  type="button"
                  onClick={openDonate}
                  className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-emerald-500/18 hover:bg-emerald-500/28 text-emerald-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-emerald-400/40 transition whitespace-nowrap"
                >
                  <Coins className="w-4 h-4 text-emerald-300" />
                  Донат
                </button>
                <button
                  type="button"
                  onClick={openCases}
                  className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-[#ffd34d]/18 hover:bg-[#ffd34d]/28 text-[#ffd34d] font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-[#ffd34d]/40 transition whitespace-nowrap"
                >
                  <Package className="w-4 h-4" />
                  Кейс
                </button>
                <button
                  type="button"
                  onClick={openMenu}
                  className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 border border-white/10 transition whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Назад
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-[58dvh] overflow-y-auto pr-1 mobile-scroll">
              {SCOOTERS.map((s, idx) => {
                const owned = save.own.includes(s.id);
                const selected = save.cur === s.id;
                const canAfford = save.coins >= s.price;

                return (
                  <div
                    key={s.id}
                    className={`rounded-xl p-3 sm:p-4 flex flex-col items-center text-center border transition ${
                      selected
                        ? 'bg-[#202936] border-[#ff6a1a]'
                        : 'bg-[#1b222c] border-white/8 hover:border-white/20'
                    }`}
                  >
                    <div className="w-full h-28 sm:h-32 rounded-lg bg-[#e8edf3] flex items-center justify-center p-2 mb-3 overflow-hidden">
                      <ScooterThumb
                        scooter={s}
                        paint={owned ? save.paints?.[s.id] : undefined}
                        fetchPriority={idx < 6 ? 'high' : 'auto'}
                        className="w-full h-full object-contain drop-shadow-sm"
                      />
                    </div>

                    <div className="font-display font-bold text-base sm:text-lg text-white leading-tight">
                      {s.name}
                    </div>
                    {(() => {
                      const hasVesc = owned && save.vesc.includes(s.id);
                      const hasMotor = owned && save.motors.includes(s.id);
                      const stats = getEffectiveScooterStats(
                        s,
                        hasVesc,
                        hasMotor,
                        owned ? save.curAkb : 'stock'
                      );
                      return (
                        <div className="text-xs text-white/65 mt-1 mb-2.5 font-mono-num">
                          до {stats.maxKmh} км/ч · Газ ×{stats.power} · ×{s.multiplier}
                        </div>
                      );
                    })()}

                    {s.scrapeKind === 'bugel' ? (
                      <div className="mb-2.5 text-[10px] font-bold text-amber-300 bg-amber-500/12 border border-amber-400/25 rounded-md px-2 py-0.5">
                        ⚡ Чирк бугелем ×1.45
                      </div>
                    ) : s.scrapeKind === 'fender' ? (
                      <div className="mb-2.5 text-[10px] font-bold text-amber-300 bg-amber-500/12 border border-amber-400/25 rounded-md px-2 py-0.5">
                        ⚡ Чирк крылом ×1.45
                      </div>
                    ) : null}

                    {selected ? (
                      <div className="mt-auto w-full h-10 rounded-lg bg-[#ff6a1a]/15 text-[#ff8b4a] font-bold text-sm flex items-center justify-center">
                        Выбран
                      </div>
                    ) : owned ? (
                      <button
                        type="button"
                        onClick={() => handlePickScooter(s.id)}
                        className="mt-auto w-full h-10 rounded-lg bg-[#2a3646] hover:bg-[#354458] text-white font-bold text-sm transition"
                      >
                        Выбрать
                      </button>
                    ) : s.caseOnly ? (
                      <button
                        type="button"
                        onClick={openCases}
                        className="mt-auto w-full h-10 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/55 text-rose-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition"
                      >
                        <Package className="w-3.5 h-3.5 shrink-0 text-rose-300" />
                        Только в кейсе (3%)
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => handleBuyScooter(s.id)}
                        className="mt-auto w-full h-10 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 disabled:hover:bg-[#ff6a1a] text-white font-bold text-sm font-mono-num transition"
                      >
                        Купить {s.price.toLocaleString('ru-RU')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={startGame}
                className="w-full sm:w-auto px-7 h-11 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-display font-bold text-base flex items-center justify-center gap-2 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                Кататься на {currentScooter.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Motocross Helmets & 5 000 Coin Roulette Menu */}
      {mode === 'helmets' && (
        <HelmetMenu
          coins={save.coins}
          ownedHelmets={save.helmets}
          currentHelmet={save.curH}
          onSpinStart={handleSpinStart}
          onSpinFinish={handleSpinFinish}
          onEquipHelmet={handleEquipHelmet}
          onBack={openMenu}
          onPlay={startGame}
        />
      )}

      {/* Streetwear & Stunt Outfits + Complete Sets Wardrobe */}
      {mode === 'outfits' && (
        <OutfitModal
          coins={save.coins}
          ownedOutfits={save.outfits}
          ownedHelmets={save.helmets}
          equippedOutfit={save.curO}
          equippedHelmet={save.curH}
          scooterAccent={currentScooter.accent}
          helmet={currentHelmet}
          onBack={openMenu}
          onStartPlay={startGame}
          onPickOutfit={handlePickOutfit}
          onBuyOutfit={handleBuyOutfit}
          onEquipSet={handleEquipSet}
          onBuySet={handleBuySet}
        />
      )}

      {/* Crash / Game Over Overlay */}
      {mode === 'crash' && crashOverlay && (
        <div
          className="fixed inset-0 z-30 flex items-start justify-center p-4 bg-[#0a0d12]/74 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
          style={{
            paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#161c24]/95 border border-white/10 p-6 text-center shadow-2xl my-auto">
            <h2 className="font-display text-3xl font-black text-white mb-2">Упал!</h2>
            <p className="text-sm text-[#ff7b72] font-semibold mb-1 font-mono-num">
              Трюк не засчитан: −{lostCoins.toLocaleString('ru-RU')} монет
            </p>
            <p className="text-sm text-white/75 mb-6 font-mono-num">
              Монеты: <b className="text-white">{Math.floor(save.coins).toLocaleString('ru-RU')}</b>
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={startGame}
                className="w-full h-12 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-display font-bold text-lg flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-5 h-5" />
                Ещё раз
              </button>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={openShop}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  Самокаты
                </button>
                <button
                  type="button"
                  onClick={openOutfits}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition whitespace-nowrap"
                >
                  <Shirt className="w-4 h-4 shrink-0 text-[#ff8b4a]" />
                  Одежда
                </button>
                <button
                  type="button"
                  onClick={openHelmets}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition whitespace-nowrap"
                >
                  <Shield className="w-4 h-4 shrink-0 text-[#ff8b4a]" />
                  Шлемы
                </button>
              </div>
              <button
                type="button"
                onClick={openMenu}
                className="w-full h-10 rounded-xl bg-white/6 hover:bg-white/12 text-white/85 font-bold text-sm flex items-center justify-center gap-2 border border-white/10 transition"
              >
                <Home className="w-4 h-4" />
                В главное меню
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Settings & Admin Panel Modal */}
      {settingsOpen && (
        <SettingsModal
          muted={muted}
          onToggleMute={toggleMute}
          mapId={mapId}
          onSelectMap={handleSelectMap}
          timeOfDay={timeOfDay}
          onToggleTimeOfDay={toggleTimeOfDay}
          weather={weather}
          onSelectWeather={handleSelectWeather}
          currentScooterName={currentScooter.name}
          currentOutfitName={currentOutfit.name}
          currentHelmetName={currentHelmet.name}
          onOpenShop={openShop}
          onOpenOutfits={openOutfits}
          onOpenHelmets={openHelmets}
          onOpenTutorial={openTutorial}
          onOpenPromo={openPromo}
          totalPlayers={totalPlayers}
          coins={save.coins}
          authUser={authUser}
          currentScooterId={save.cur}
          ownedScooters={save.own}
          ownedVesc={save.vesc}
          ownedMotors={save.motors}
          ownedScootersCount={save.own.length}
          ownedHelmetsCount={save.helmets.length}
          ownedOutfitsCount={save.outfits.length}
          initialPayLink={adminPayLink}
          onAddCoins={handleBankCoins}
          onRemoveCoins={handleRemoveCoins}
          onResetCoins={handleResetCoins}
          onSetCoins={handleSetCoins}
          onSetSelfVip={handleSetSelfVip}
          onAdminSelectScooter={handleAdminSelectScooter}
          onAdminUnlockAllScooters={handleAdminUnlockAllScooters}
          onFullResetSelf={handleFullResetSelf}
          onLogout={handleLogout}
          onOpenReceiveWallet={() => openTransfers('receive')}
          onClose={() => {
            setSettingsOpen(false);
            setAdminPayLink('');
          }}
        />
      )}
      {/* Kicked by Admin Notice Modal */}
      {kickNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0d12]/85 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#161c24] border border-red-400/45 p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center mx-auto mb-3">
              <UserX className="w-6 h-6 text-[#ff7b72]" />
            </div>
            <h3 className="font-display text-xl font-black text-white mb-1.5">
              Тебя кикнул админ
            </h3>
            <p className="text-xs text-white/75 mb-1">
              Администратор: <b className="text-white">{kickNotice.by}</b>
            </p>
            <p className="text-xs text-[#ff938b] font-semibold bg-red-500/12 border border-red-400/25 rounded-lg px-3 py-2 my-3">
              Причина: {kickNotice.reason}
            </p>
            {kickNotice.until > Date.now() && (
              <p className="text-xs text-white/60 mb-3 font-mono-num">
                Доступ закрыт ещё ~
                {Math.max(1, Math.ceil((kickNotice.until - Date.now()) / 60_000))} мин.
              </p>
            )}
            <button
              type="button"
              onClick={() => setKickNotice(null)}
              className="w-full h-10 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
      {/* Scooter Case Opening Modal (300,000 coins) */}
      {casesOpen && (
        <CaseModal
          coins={save.coins}
          ownedScooters={save.own}
          onSpendForCase={handleSpendForCase}
          onCaseWin={handleCaseWin}
          onEquipAndPlay={handleEquipAndPlayCase}
          onBack={() => setCasesOpen(false)}
        />
      )}
      {/* Donate Shop Modal (Telegram @durov0113) */}
      {donateOpen && (
        <DonateModal
          coins={save.coins}
          vip={save.vip}
          user={authUser}
          onOpenRegister={() => openAuth('register')}
          onClose={() => setDonateOpen(false)}
        />
      )}
      {/* Coin Transfer & Wallet Modal */}
      {transferOpen && (
        <TransferModal
          coins={save.coins}
          initialTab={transferInitTab}
          initialPrefill={transferPrefill}
          onDeductCoins={handleDeductTransferCoins}
          onCreditCoins={handleBankCoins}
          onClose={() => setTransferOpen(false)}
        />
      )}
      {/* Controls Tutorial Overlay */}
      {tutorialOpen && <ControlTutorialOverlay onClose={closeTutorial} />}
      {/* Promo Codes Modal */}
      {promoOpen && (
        <PromoModal
          coins={save.coins}
          onClaimCoins={handleBankCoins}
          onClose={() => setPromoOpen(false)}
        />
      )}
      {/* Registration / Login / Account Modal */}
      {authOpen && (
        <AuthModal
          user={authUser}
          currentSave={save}
          myRank={myRank}
          initialTab={authInitTab}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          onOpenLeaderboard={openLeaderboard}
          onClose={() => setAuthOpen(false)}
        />
      )}
      {/* Wealth Leaderboard Modal */}
      {leaderboardOpen && (
        <LeaderboardModal
          user={authUser}
          localCoins={save.coins}
          bestRun={save.bestRun}
          curScooter={save.cur}
          vip={save.vip}
          onOpenRegister={() => openAuth('register')}
          onRankLoaded={setMyRank}
          onClose={() => setLeaderboardOpen(false)}
        />
      )}
      {/* Scooter Customization Modal (Paint, Headlights, Underglow, VESC, 2nd Motor, АКБ) */}
      {paintOpen && (
        <PaintModal
          coins={save.coins}
          currentScooterId={save.cur}
          ownedScooters={save.own}
          paints={save.paints ?? {}}
          ownedLights={save.lights}
          currentLight={save.curLight}
          ownedUnderglows={save.underglows}
          currentUnderglow={save.curUnderglow}
          ownedAkbs={save.akbs}
          currentAkb={save.curAkb}
          ownedVesc={save.vesc}
          ownedMotors={save.motors}
          onSetPaint={handleSetPaint}
          onSelectLight={handleSelectLight}
          onBuyLight={handleBuyLight}
          onSelectUnderglow={handleSelectUnderglow}
          onBuyUnderglow={handleBuyUnderglow}
          onSelectAkb={handleSelectAkb}
          onBuyAkb={handleBuyAkb}
          onBuyVesc={handleBuyVesc}
          onBuySecondMotor={handleBuySecondMotor}
          onSelectScooter={handlePickScooter}
          onClose={() => setPaintOpen(false)}
        />
      )}
    </div>
  );
}
