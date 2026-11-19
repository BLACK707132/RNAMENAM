import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  ShoppingBag,
  Play,
  RotateCcw,
  ArrowLeft,
  Shield,
  Settings,
  Shirt,
  Gift,
  Trophy,
  Crown,
  User,
  UserPlus,
  Package,
  Users,
  Send,
  Coins,
} from 'lucide-react';
import { GameCanvas, type GameMode } from './components/GameCanvas';
import { HelmetIcon } from './components/HelmetIcon';
import { HelmetMenu } from './components/HelmetMenu';
import { OutfitModal } from './components/OutfitModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SettingsModal } from './components/SettingsModal';
import { TransferModal, type TransferTab } from './components/TransferModal';
import { PromoModal } from './components/PromoModal';
import { AuthModal } from './components/AuthModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { CaseModal, SCOOTER_CASE_PRICE } from './components/CaseModal';
import { ClansModal } from './components/ClansModal';
import { DonateModal } from './components/DonateModal';
import {
  fetchMe,
  getStoredUser,
  syncProfile,
  type AuthUser,
  type SyncSavePayload,
} from './utils/accountApi';
import { consumeIncomingUrlAction } from './utils/transfers';
import { getScooter, SCOOTERS, type ScooterId } from './data/scooters';
import {
  getHelmet,
  HELMETS,
  HELMET_DUPLICATE_REFUND,
  HELMET_SPIN_COST,
  type HelmetId,
  type MotocrossHelmet,
} from './data/helmets';
import { getOutfit, OUTFITS, type OutfitId } from './data/outfits';
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
}

const STORAGE_KEY = 'ss';
const VALID_SCOOTERS: ScooterId[] = SCOOTERS.map((s) => s.id);
const VALID_HELMETS: HelmetId[] = HELMETS.map((h) => h.id);
const VALID_OUTFITS: OutfitId[] = OUTFITS.map((o) => o.id);
const FREE_OUTFITS: OutfitId[] = OUTFITS.filter((o) => o.price === 0).map((o) => o.id);

function loadState(): SaveState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveState>;
      const own = Array.isArray(parsed.own)
        ? parsed.own.filter((id): id is ScooterId => VALID_SCOOTERS.includes(id))
        : (['c3'] as ScooterId[]);
      if (!own.includes('c3')) own.unshift('c3');
      const cur = parsed.cur && VALID_SCOOTERS.includes(parsed.cur) ? parsed.cur : 'c3';

      const helmets = Array.isArray(parsed.helmets)
        ? parsed.helmets.filter((id): id is HelmetId => VALID_HELMETS.includes(id))
        : (['mx_start'] as HelmetId[]);
      if (!helmets.includes('mx_start')) helmets.unshift('mx_start');
      const curH =
        parsed.curH && VALID_HELMETS.includes(parsed.curH) ? parsed.curH : 'mx_start';

      const outfits = Array.isArray(parsed.outfits)
        ? parsed.outfits.filter((id): id is OutfitId => VALID_OUTFITS.includes(id))
        : ([...FREE_OUTFITS] as OutfitId[]);
      for (const freeId of FREE_OUTFITS) {
        if (!outfits.includes(freeId)) outfits.unshift(freeId);
      }
      const curO =
        parsed.curO && VALID_OUTFITS.includes(parsed.curO) ? parsed.curO : 'black_stant';

      return {
        coins: typeof parsed.coins === 'number' && Number.isFinite(parsed.coins) ? parsed.coins : 0,
        bestRun:
          typeof parsed.bestRun === 'number' && Number.isFinite(parsed.bestRun)
            ? parsed.bestRun
            : 0,
        own,
        cur,
        helmets,
        curH,
        outfits,
        curO,
        vip: Boolean(parsed.vip),
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

  return {
    coins: typeof raw.coins === 'number' && Number.isFinite(raw.coins) ? Math.max(0, raw.coins) : 0,
    bestRun:
      typeof raw.bestRun === 'number' && Number.isFinite(raw.bestRun)
        ? Math.max(0, raw.bestRun)
        : 0,
    own,
    cur,
    helmets,
    curH,
    outfits,
    curO,
    vip: Boolean(raw.vip),
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

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [save, setSave] = useState<SaveState>(() => loadState());
  const saveRef = useRef<SaveState>(save);
  saveRef.current = save;
  const [totalPlayers] = useState<number>(() => registerAndGetTotalPlayers());
  const [mode, setMode] = useState<GameMode>('menu');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitTab, setAuthInitTab] = useState<'register' | 'login'>('register');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [casesOpen, setCasesOpen] = useState(false);
  const [clansOpen, setClansOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getStoredUser());
  const [myRank, setMyRank] = useState<number | null>(null);
  const [adminPayLink, setAdminPayLink] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferInitTab, setTransferInitTab] = useState<TransferTab>('receive');
  const [transferPrefill, setTransferPrefill] = useState('');
  const [crashOverlay, setCrashOverlay] = useState(false);
  const [lostCoins, setLostCoins] = useState(0);
  const [runTrigger, setRunTrigger] = useState(0);
  const [muted, setMuted] = useState<boolean>(() => {
    const initial = loadMuted();
    sound.setMuted(initial);
    return initial;
  });
  const [gasPressed, setGasPressed] = useState(false);
  const [brakePressed, setBrakePressed] = useState(false);
  const [oneHandPressed, setOneHandPressed] = useState(false);
  const [kneePressed, setKneePressed] = useState(false);
  const [stemFootPressed, setStemFootPressed] = useState(false);

  const gasRef = useRef(false);
  const brakeRef = useRef(false);
  const oneHandRef = useRef(false);
  const kneeRef = useRef(false);
  const stemFootRef = useRef(false);

  // Track active pointer IDs per control for rock-solid mobile multi-touch
  const gasPointers = useRef<Set<number>>(new Set());
  const brakePointers = useRef<Set<number>>(new Set());
  const oneHandPointers = useRef<Set<number>>(new Set());

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
        if (isFreshLocal && (res.data.save.coins > 0 || res.data.save.own.length > 1 || res.data.save.vip)) {
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
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Debounced background sync of balance & garage to Wealth Leaderboard
  useEffect(() => {
    if (!authUser) return;
    const timer = window.setTimeout(() => {
      syncProfile(saveRef.current).then((res) => {
        if (res.unauthorized) {
          setAuthUser(null);
          setMyRank(null);
          return;
        }
        if (res.ok) {
          if (res.saveOverride) {
            setSave(normalizeServerSave(res.saveOverride));
            return;
          }
          const needVip = typeof res.vip === 'boolean' && res.vip !== saveRef.current.vip;
          const needCoins =
            typeof res.coinsOverride === 'number' &&
            res.coinsOverride !== Math.floor(saveRef.current.coins);
          if (needVip || needCoins) {
            setSave((prev) => ({
              ...prev,
              ...(needVip ? { vip: res.vip! } : {}),
              ...(needCoins ? { coins: res.coinsOverride! } : {}),
            }));
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
    setGasPressed(active);
  }, []);

  const setBrake = useCallback((active: boolean) => {
    brakeRef.current = active;
    setBrakePressed(active);
  }, []);

  const setOneHand = useCallback((active: boolean) => {
    oneHandRef.current = active;
    setOneHandPressed(active);
  }, []);

  const setKnee = useCallback((active: boolean) => {
    kneeRef.current = active;
    setKneePressed(active);
    if (active && stemFootRef.current) {
      stemFootRef.current = false;
      setStemFootPressed(false);
    }
  }, []);

  const setStemFoot = useCallback((active: boolean) => {
    stemFootRef.current = active;
    setStemFootPressed(active);
    if (active && kneeRef.current) {
      kneeRef.current = false;
      setKneePressed(false);
    }
  }, []);

  const clearAllControls = useCallback(() => {
    gasPointers.current.clear();
    brakePointers.current.clear();
    oneHandPointers.current.clear();
    setGas(false);
    setBrake(false);
    setOneHand(false);
    setKnee(false);
    setStemFoot(false);
  }, [setGas, setBrake, setOneHand, setKnee, setStemFoot]);

  const bindTouchControl = useCallback(
    (
      pointersRef: React.MutableRefObject<Set<number>>,
      setter: (active: boolean) => void,
      vibeMs = 10
    ) => ({
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Ignore capture errors on synthetic events
        }
        const wasEmpty = pointersRef.current.size === 0;
        pointersRef.current.add(e.pointerId);
        if (wasEmpty) {
          setter(true);
          buzz(vibeMs);
        }
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size === 0) setter(false);
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size === 0) setter(false);
      },
      onLostPointerCapture: (e: React.PointerEvent<HTMLButtonElement>) => {
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size === 0) setter(false);
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }),
    [buzz]
  );

  const startGame = useCallback(() => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setClansOpen(false);
    setDonateOpen(false);
    setTransferOpen(false);
    setCrashOverlay(false);
    setLostCoins(0);
    setRunTrigger((n) => n + 1);
    setMode('play');
  }, [clearAllControls]);

  const openMenu = useCallback(() => {
    clearAllControls();
    setCasesOpen(false);
    setClansOpen(false);
    setDonateOpen(false);
    setCrashOverlay(false);
    setMode('menu');
  }, [clearAllControls]);

  const openShop = useCallback(() => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setClansOpen(false);
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
    setClansOpen(false);
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
    setClansOpen(false);
    setTransferOpen(false);
    setCrashOverlay(false);
    setDonateOpen(true);
  }, [clearAllControls]);

  const openClans = useCallback(async () => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setDonateOpen(false);
    setTransferOpen(false);
    setCrashOverlay(false);
    if (authUser) {
      await syncProfile(saveRef.current);
    }
    setClansOpen(true);
  }, [clearAllControls, authUser]);

  const openHelmets = useCallback(() => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setAuthOpen(false);
    setLeaderboardOpen(false);
    setCasesOpen(false);
    setClansOpen(false);
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
    setClansOpen(false);
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
    setClansOpen(false);
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
      setClansOpen(false);
      setDonateOpen(false);
      setAuthInitTab(tab);
      setAuthOpen(true);
    },
    [clearAllControls]
  );

  const openLeaderboard = useCallback(async () => {
    clearAllControls();
    setSettingsOpen(false);
    setPromoOpen(false);
    setTransferOpen(false);
    setAuthOpen(false);
    setCasesOpen(false);
    setClansOpen(false);
    setDonateOpen(false);
    if (authUser) {
      await syncProfile(saveRef.current);
    }
    setLeaderboardOpen(true);
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

  const handleSetVip = useCallback((enabled: boolean) => {
    setSave((prev) => ({ ...prev, vip: enabled }));
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

  // Keyboard bindings: W/↑ = gas, S/↓/Shift = brake, Space = One-Hander (Ванхенд)
  useEffect(() => {
    const gasKeys = new Set(['ArrowUp', 'KeyW']);
    const brakeKeys = new Set(['ArrowDown', 'KeyS', 'ShiftLeft', 'ShiftRight']);
    const heldGas = new Set<string>();
    const heldBrake = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        settingsOpen ||
        transferOpen ||
        promoOpen ||
        authOpen ||
        leaderboardOpen ||
        casesOpen ||
        clansOpen ||
        donateOpen
      )
        return;
      if (mode === 'play') {
        if (gasKeys.has(e.code)) {
          e.preventDefault();
          heldGas.add(e.code);
          setGas(true);
        } else if (brakeKeys.has(e.code)) {
          e.preventDefault();
          heldBrake.add(e.code);
          setBrake(true);
        } else if (e.code === 'Space') {
          e.preventDefault();
          setOneHand(true);
        } else if (e.code === 'KeyC' && !e.repeat) {
          e.preventDefault();
          setOneHand(!oneHandRef.current);
        } else if ((e.code === 'KeyX' || e.code === 'KeyK') && !e.repeat) {
          e.preventDefault();
          setKnee(!kneeRef.current);
        } else if ((e.code === 'KeyZ' || e.code === 'KeyR') && !e.repeat) {
          e.preventDefault();
          setStemFoot(!stemFootRef.current);
        } else if (e.code === 'Escape') {
          openMenu();
        }
      } else if (crashOverlay && !e.repeat && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        startGame();
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
    };

    const releaseAll = () => {
      heldGas.clear();
      heldBrake.clear();
      clearAllControls();
    };

    const onVisibilityChange = () => {
      if (document.hidden) releaseAll();
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
    settingsOpen,
    transferOpen,
    promoOpen,
    authOpen,
    leaderboardOpen,
    casesOpen,
    clansOpen,
    donateOpen,
    crashOverlay,
    setGas,
    setBrake,
    setOneHand,
    setKnee,
    setStemFoot,
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
        coins={save.coins}
        bestRun={save.bestRun}
        vip={save.vip}
        gasRef={gasRef}
        brakeRef={brakeRef}
        oneHandRef={oneHandRef}
        kneeRef={kneeRef}
        stemFootRef={stemFootRef}
        runTrigger={runTrigger}
        onBankCoins={handleBankCoins}
        onNewBest={handleNewBest}
        onCrashStart={handleCrashStart}
        onCrashFinish={handleCrashFinish}
      />

      {/* Top-right compact utility bar during gameplay (never collides with coins/angle bar) */}
      {mode === 'play' && (
        <div
          className="fixed right-3 z-20 flex items-center gap-1.5"
          style={{ top: 'max(10px, env(safe-area-inset-top, 10px))' }}
        >
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Включить звук' : 'Выключить звук'}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/50 hover:bg-black/65 active:scale-95 text-white border border-white/12 backdrop-blur-sm transition"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={openMenu}
            className="h-10 px-3.5 rounded-xl bg-black/50 hover:bg-black/65 active:scale-95 text-white font-semibold text-sm border border-white/12 backdrop-blur-sm transition whitespace-nowrap"
          >
            Меню
          </button>
        </div>
      )}

      {/* Barely-visible square-ish half-screen Gas & Brake touch zones + subtle Trick Toggles */}
      {mode === 'play' && (
        <>
          {/* Subtle Trick Buttons above right Gas zone: Stem-Foot (Рулевая) + One-Knee (Колено) + One-Hander (1 Рука) */}
          <div
            className="fixed z-20 flex items-center gap-1.5 sm:gap-2"
            style={{
              right: 'max(10px, env(safe-area-inset-right, 10px))',
              bottom: 'calc(max(10px, env(safe-area-inset-bottom, 10px)) + clamp(120px, 36dvh, 215px) + 8px)',
            }}
          >
            {/* Foot-on-Steering-Column Stunt Toggle Button (Нога на рулевой / гусак) */}
            <button
              type="button"
              aria-pressed={stemFootPressed}
              aria-label="Нога на рулевой"
              onPointerDown={(e) => {
                e.preventDefault();
                setStemFoot(!stemFootRef.current);
                buzz(14);
              }}
              onContextMenu={(e) => e.preventDefault()}
              className={`w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] [@media(max-height:500px)]:w-[50px] [@media(max-height:500px)]:h-[50px] rounded-xl flex flex-col items-center justify-center gap-0.5 border transition select-none touch-none ${
                stemFootPressed
                  ? 'bg-emerald-500/45 border-emerald-300/80 text-white scale-95'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.14] text-white/45'
              }`}
            >
              {/* Rider with front foot planted on the steering column (below handlebar/display) */}
              <svg
                viewBox="0 0 48 48"
                className="w-7 h-7 sm:w-8 sm:h-8 [@media(max-height:500px)]:w-6 [@media(max-height:500px)]:h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Rear & front lifted wheels */}
                <circle cx="14" cy="37" r="4.5" />
                <circle cx="38" cy="25" r="4.2" />
                {/* Deck & steering column */}
                <path d="M18.5 34.8 L32.5 28 L28.5 13" />
                {/* Back standing leg + front leg raised onto middle of steering column */}
                <path d="M19 33 L18.5 23 L25 21 L30.5 21.5" />
                {/* Torso & arms gripping handlebar */}
                <path d="M18.5 23 L17.5 14.5 L28 13.5" />
                {/* Helmet */}
                <circle cx="19" cy="9.5" r="2.8" fill="currentColor" stroke="none" />
              </svg>
              <span className="text-[8px] sm:text-[9px] font-display font-extrabold tracking-wide leading-none uppercase">
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
              className={`w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] [@media(max-height:500px)]:w-[50px] [@media(max-height:500px)]:h-[50px] rounded-xl flex flex-col items-center justify-center gap-0.5 border transition select-none touch-none ${
                kneePressed
                  ? 'bg-sky-500/45 border-sky-300/75 text-white scale-95'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.14] text-white/45'
              }`}
            >
              {/* Rider kneeling on one knee icon */}
              <svg
                viewBox="0 0 48 48"
                className="w-7 h-7 sm:w-8 sm:h-8 [@media(max-height:500px)]:w-6 [@media(max-height:500px)]:h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Rear & front lifted wheels */}
                <circle cx="14" cy="37" r="4.5" />
                <circle cx="38" cy="25" r="4.2" />
                {/* Deck & stem */}
                <path d="M18.5 34.8 L32.5 28 L29.5 14" />
                {/* Back foot on tail + front knee resting on deck */}
                <path d="M19 33 L21.5 26 L26 29.5 L20.5 31" />
                {/* Torso & arms gripping bar */}
                <path d="M21.5 26 L21 16.5 L29 14.5" />
                {/* Helmet */}
                <circle cx="22.5" cy="11.5" r="2.8" fill="currentColor" stroke="none" />
              </svg>
              <span className="text-[8px] sm:text-[9px] font-display font-extrabold tracking-wide leading-none uppercase">
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
              className={`w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] [@media(max-height:500px)]:w-[50px] [@media(max-height:500px)]:h-[50px] rounded-xl flex flex-col items-center justify-center gap-0.5 border transition select-none touch-none ${
                oneHandPressed
                  ? 'bg-[#ff6a1a]/50 border-[#ffc99e]/80 text-white scale-95'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.14] text-white/45'
              }`}
            >
              {/* Wheelie Life One-Hander Rider Icon */}
              <svg
                viewBox="0 0 48 48"
                className="w-7 h-7 sm:w-8 sm:h-8 [@media(max-height:500px)]:w-6 [@media(max-height:500px)]:h-6"
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
              <span className="text-[8px] sm:text-[9px] font-display font-extrabold tracking-wide leading-none uppercase">
                1 РУКА
              </span>
            </button>
          </div>

          {/* Bottom-Left: Barely-visible square half-screen Brake Touch Zone */}
          <button
            type="button"
            aria-label="Тормоз"
            {...bindTouchControl(brakePointers, setBrake, 10)}
            style={{
              left: 'max(10px, env(safe-area-inset-left, 10px))',
              bottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
              height: 'clamp(120px, 36dvh, 215px)',
            }}
            className={`fixed z-20 w-[45vw] max-w-[260px] rounded-xl flex flex-col items-start justify-end p-3.5 sm:p-4 border transition select-none touch-none ${
              brakePressed
                ? 'bg-red-500/[0.15] border-red-300/45 text-red-100/85'
                : 'bg-white/[0.025] border-white/[0.10] text-white/30'
            }`}
          >
            <div className="flex flex-col items-center gap-1 opacity-85">
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
            type="button"
            aria-label="Газ"
            {...bindTouchControl(gasPointers, setGas, 10)}
            style={{
              right: 'max(10px, env(safe-area-inset-right, 10px))',
              bottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
              height: 'clamp(120px, 36dvh, 215px)',
            }}
            className={`fixed z-20 w-[45vw] max-w-[260px] rounded-xl flex flex-col items-end justify-end p-3.5 sm:p-4 border transition select-none touch-none ${
              gasPressed
                ? 'bg-white/[0.13] border-white/45 text-white/90'
                : 'bg-white/[0.025] border-white/[0.10] text-white/30'
            }`}
          >
            <div className="flex flex-col items-center gap-1 opacity-85">
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
          className="fixed inset-0 z-30 flex items-center justify-center p-3.5 sm:p-4 bg-[#0a0d12]/72 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
          style={{
            paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#161c24]/95 border border-white/10 p-5 sm:p-6 text-center shadow-2xl my-auto">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="text-sm font-semibold text-white/85 font-mono-num truncate">
                  🪙 {Math.floor(save.coins).toLocaleString('ru-RU')}
                </div>
                {save.vip && (
                  <span className="px-1.5 py-0.5 rounded bg-[#ffd34d]/20 border border-[#ffd34d]/50 text-[#ffd34d] text-[10px] font-extrabold shrink-0">
                    VIP ×2
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPromoOpen(true)}
                  aria-label="Промокод"
                  className="h-9 px-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-[#ff6a1a]/18 hover:bg-[#ff6a1a]/28 border border-[#ff6a1a]/35 text-[#ffc599] text-xs font-bold transition"
                >
                  <Gift className="w-3.5 h-3.5 text-[#ff8b4a]" />
                  Промокод
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Настройки"
                  className="h-9 px-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/85 text-xs font-bold transition"
                >
                  <Settings className="w-4 h-4 text-[#ff8b4a]" />
                  <span className="hidden sm:inline">Настройки</span>
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? 'Включить звук' : 'Выключить звук'}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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
                <img
                  src={currentScooter.spriteSrc}
                  alt={currentScooter.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = currentScooter.originalSrc;
                  }}
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-bold text-white truncate">
                  {currentScooter.name}
                </div>
                <div className="text-xs text-white/70 font-mono-num">
                  до {currentScooter.maxKmh} км/ч · Газ ×{currentScooter.power} · ×{currentScooter.multiplier}
                </div>
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
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  Самокаты
                </button>
                <button
                  type="button"
                  onClick={openOutfits}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition whitespace-nowrap"
                >
                  <Shirt className="w-4 h-4 shrink-0 text-[#ff8b4a]" />
                  Одежда
                </button>
                <button
                  type="button"
                  onClick={openHelmets}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition whitespace-nowrap"
                >
                  <Shield className="w-4 h-4 shrink-0 text-[#ff8b4a]" />
                  Шлемы
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

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={openDonate}
                  className="h-11 rounded-xl bg-emerald-500/18 hover:bg-emerald-500/28 active:scale-[0.99] text-emerald-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-emerald-400/40 transition whitespace-nowrap"
                >
                  <Coins className="w-4 h-4 shrink-0 text-emerald-300" />
                  Донат
                </button>
                <button
                  type="button"
                  onClick={openClans}
                  className="h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-[#ff6a1a]/30 transition whitespace-nowrap"
                >
                  <Users className="w-4 h-4 shrink-0 text-[#ff8b4a]" />
                  Кланы
                </button>
                <a
                  href="https://t.me/durov0113"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 active:scale-[0.99] text-sky-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-sky-400/35 transition whitespace-nowrap"
                >
                  <Send className="w-4 h-4 shrink-0 text-sky-300" />
                  TG
                </a>
              </div>

              <PWAInstallButton />
            </div>

            <p className="hidden sm:block mt-3.5 text-xs text-white/45">
              W / ↑ — газ · S / ↓ / Shift — тормоз · Пробел / C — ванхенд · X — колено · Z — рулевая
            </p>
          </div>
        </div>
      )}

      {/* Shop Overlay */}
      {mode === 'shop' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-3.5 sm:p-4 bg-[#0a0d12]/78 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
          style={{
            paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-[#161c24]/95 border border-white/10 p-4 sm:p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between gap-4 mb-4 sm:mb-5">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                  Магазин самокатов
                </h2>
                <p className="text-sm text-white/65 font-mono-num mt-0.5">
                  Баланс: 🪙 {Math.floor(save.coins).toLocaleString('ru-RU')}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openDonate}
                  className="h-10 px-3 rounded-xl bg-emerald-500/18 hover:bg-emerald-500/28 text-emerald-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-emerald-400/40 transition whitespace-nowrap"
                >
                  <Coins className="w-4 h-4 text-emerald-300" />
                  Донат
                </button>
                <button
                  type="button"
                  onClick={openCases}
                  className="h-10 px-3 rounded-xl bg-[#ffd34d]/18 hover:bg-[#ffd34d]/28 text-[#ffd34d] font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-[#ffd34d]/40 transition whitespace-nowrap"
                >
                  <Package className="w-4 h-4" />
                  Кейс
                </button>
                <button
                  type="button"
                  onClick={openMenu}
                  className="h-10 px-3.5 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-semibold text-sm flex items-center gap-1.5 border border-white/10 transition whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Назад
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-[58dvh] overflow-y-auto pr-1 mobile-scroll">
              {SCOOTERS.map((s) => {
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
                      <img
                        src={s.spriteSrc}
                        alt={s.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = s.originalSrc;
                        }}
                        className="w-full h-full object-contain drop-shadow-sm"
                      />
                    </div>

                    <div className="font-display font-bold text-base sm:text-lg text-white leading-tight">
                      {s.name}
                    </div>
                    <div className="text-xs text-white/65 mt-1 mb-3 font-mono-num">
                      до {s.maxKmh} км/ч · Газ ×{s.power} · ×{s.multiplier}
                    </div>

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
                        className="mt-auto w-full h-10 rounded-lg bg-[#ffd34d]/20 hover:bg-[#ffd34d]/30 border border-[#ffd34d]/50 text-[#ffd34d] font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition"
                      >
                        <Package className="w-3.5 h-3.5 shrink-0" />
                        В кейсе (3%)
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

      {/* Streetwear & Stunt Outfits Wardrobe */}
      {mode === 'outfits' && (
        <OutfitModal
          coins={save.coins}
          ownedOutfits={save.outfits}
          equippedOutfit={save.curO}
          scooterAccent={currentScooter.accent}
          helmet={currentHelmet}
          onBack={openMenu}
          onStartPlay={startGame}
          onPickOutfit={handlePickOutfit}
          onBuyOutfit={handleBuyOutfit}
        />
      )}

      {/* Crash / Game Over Overlay */}
      {mode === 'crash' && crashOverlay && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#0a0d12]/74 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl bg-[#161c24]/95 border border-white/10 p-6 text-center shadow-2xl">
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
            </div>
          </div>
        </div>
      )}
      {/* Settings & Admin Panel Modal */}
      {settingsOpen && (
        <SettingsModal
          muted={muted}
          onToggleMute={toggleMute}
          totalPlayers={totalPlayers}
          coins={save.coins}
          vip={save.vip}
          authUser={authUser}
          currentScooterId={save.cur}
          ownedScooters={save.own}
          ownedScootersCount={save.own.length}
          ownedHelmetsCount={save.helmets.length}
          ownedOutfitsCount={save.outfits.length}
          initialPayLink={adminPayLink}
          onAddCoins={handleBankCoins}
          onRemoveCoins={handleRemoveCoins}
          onResetCoins={handleResetCoins}
          onSetCoins={handleSetCoins}
          onSetVip={handleSetVip}
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
      {/* Clans Modal */}
      {clansOpen && (
        <ClansModal
          user={authUser}
          coins={save.coins}
          onCoinsChanged={handleSetCoins}
          onSyncBeforeAction={async () => {
            if (authUser) {
              await syncProfile(saveRef.current);
            }
          }}
          onOpenRegister={() => openAuth('register')}
          onClose={() => setClansOpen(false)}
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
      {/* Offline Coin Receive & Wallet Modal */}
      {transferOpen && (
        <TransferModal
          coins={save.coins}
          initialTab={transferInitTab}
          initialPrefill={transferPrefill}
          receiveOnly
          onDeductCoins={handleDeductTransferCoins}
          onCreditCoins={handleBankCoins}
          onClose={() => setTransferOpen(false)}
        />
      )}
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
          onOpenLeaderboard={openLeaderboard}
          onClose={() => setAuthOpen(false)}
        />
      )}
      {/* Wealth Leaderboard Modal */}
      {leaderboardOpen && (
        <LeaderboardModal
          user={authUser}
          localCoins={save.coins}
          onOpenRegister={() => openAuth('register')}
          onRankLoaded={setMyRank}
          onClose={() => setLeaderboardOpen(false)}
        />
      )}
    </div>
  );
}
