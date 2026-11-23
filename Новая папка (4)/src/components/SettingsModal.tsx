import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Users,
  ShieldCheck,
  Lock,
  Coins,
  LogOut,
  CheckCircle2,
  Eye,
  EyeOff,
  Send,
  Link2,
  Copy,
  Check,
  Share2,
  Wallet,
  AlertCircle,
  WifiOff,
  Gift,
  Crown,
  History,
  RefreshCw,
  MessageSquare,
  Trash2,
  Bike,
  ExternalLink,
  RotateCcw,
  UserX,
  Sun,
  Moon,
  CloudRain,
  CloudFog,
  Snowflake,
  MapPin,
  Shirt,
  Shield,
  ShoppingBag,
  HelpCircle,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  appendTransferHistory,
  createOfflineTransferCheck,
  formatWalletId,
  loadTransferHistory,
  loadWalletProfile,
  parseRecipientInput,
  type TransferRecord,
} from '../utils/transfers';
import {
  createAdminPromoCode,
  createCustomPromoCode,
  deleteCustomPromoCode,
  fetchAdminCustomPromos,
  type CustomPromoItem,
} from '../utils/promos';
import { getEffectiveScooterStats, SCOOTERS, type ScooterId } from '../data/scooters';
import {
  MAPS,
  WEATHERS,
  type MapId,
  type TimeOfDay,
  type WeatherId,
} from '../data/maps';
import {
  adjustAdminUserCoins,
  deleteAdminUser,
  fetchAdminLogs,
  fetchAdminUsers,
  fetchSupportStatus,
  getStoredAdminSession,
  getStoredAdminToken,
  kickAdminUser,
  loginAdmin,
  logoutAdminServer,
  resetAdminUser,
  setAdminUserVip,
  unkickAdminUser,
  verifyStoredAdminToken,
  wipeAllAdminUsers,
  type AdminLoginLog,
  type AdminSessionInfo,
  type AdminUserSummary,
  type AuthUser,
  type OnlineAdminInfo,
} from '../utils/accountApi';
import { sound } from '../utils/sound';

interface SettingsModalProps {
  muted: boolean;
  onToggleMute: () => void;
  mapId: MapId;
  onSelectMap: (id: MapId) => void;
  timeOfDay: TimeOfDay;
  onToggleTimeOfDay: () => void;
  weather: WeatherId;
  onSelectWeather: (id: WeatherId) => void;
  currentScooterName: string;
  currentOutfitName: string;
  currentHelmetName: string;
  onOpenShop: () => void;
  onOpenOutfits: () => void;
  onOpenHelmets: () => void;
  onOpenTutorial: () => void;
  onOpenPromo: () => void;
  totalPlayers: number;
  coins: number;
  authUser: AuthUser | null;
  currentScooterId: ScooterId;
  ownedScooters: ScooterId[];
  ownedVesc?: ScooterId[];
  ownedMotors?: ScooterId[];
  ownedScootersCount: number;
  ownedHelmetsCount: number;
  ownedOutfitsCount: number;
  initialPayLink?: string;
  onAddCoins: (amount: number) => void;
  onRemoveCoins: (amount: number) => void;
  onResetCoins: () => void;
  onSetCoins: (amount: number) => void;
  onSetSelfVip?: (vip: boolean) => void;
  onAdminSelectScooter: (id: ScooterId) => void;
  onAdminUnlockAllScooters: () => void;
  onFullResetSelf: () => void;
  onLogout: () => void;
  onOpenReceiveWallet: () => void;
  onClose: () => void;
}

const QUICK_AMOUNTS = [5000, 25000, 100000, 500000];
const QUICK_DEDUCT_AMOUNTS = [5000, 25000, 100000];
const QUICK_TRANSFER_AMOUNTS = [10000, 50000, 100000, 500000];

function formatAdminTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function SettingsModal({
  muted,
  onToggleMute,
  mapId,
  onSelectMap,
  timeOfDay,
  onToggleTimeOfDay,
  weather,
  onSelectWeather,
  currentScooterName,
  currentOutfitName,
  currentHelmetName,
  onOpenShop,
  onOpenOutfits,
  onOpenHelmets,
  onOpenTutorial,
  onOpenPromo,
  totalPlayers,
  coins,
  authUser,
  currentScooterId,
  ownedScooters,
  ownedVesc = [],
  ownedMotors = [],
  ownedScootersCount,
  ownedHelmetsCount,
  ownedOutfitsCount,
  initialPayLink = '',
  onAddCoins,
  onRemoveCoins,
  onResetCoins,
  onSetCoins,
  onSetSelfVip,
  onAdminSelectScooter,
  onAdminUnlockAllScooters,
  onFullResetSelf,
  onLogout,
  onOpenReceiveWallet,
  onClose,
}: SettingsModalProps) {
  const hasRememberedAdmin = Boolean(getStoredAdminToken());
  const [adminOpen, setAdminOpen] = useState(Boolean(initialPayLink) || hasRememberedAdmin);
  const [adminUnlocked, setAdminUnlocked] = useState(hasRememberedAdmin);
  const [adminSession, setAdminSession] = useState<AdminSessionInfo | null>(() =>
    getStoredAdminSession()
  );
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [showPass2, setShowPass2] = useState(false);
  const [authError, setAuthError] = useState('');
  const [customAmount, setCustomAmount] = useState('10000');
  const [grantFeedback, setGrantFeedback] = useState<{ text: string; kind: 'add' | 'remove' } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  // Admin player management (kick, coins, reset, deletion) & online staff
  const [adminLogs, setAdminLogs] = useState<AdminLoginLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [onlineStaff, setOnlineStaff] = useState<OnlineAdminInfo[]>([]);
  const [kickTargetInput, setKickTargetInput] = useState('');
  const [kickReasonInput, setKickReasonInput] = useState('');
  const [kickDurationMin, setKickDurationMin] = useState<number>(0);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);
  const [kickMsg, setKickMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [vipMsg, setVipMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editingCoinsUserId, setEditingCoinsUserId] = useState<string | null>(null);
  const [playerCoinsAmt, setPlayerCoinsAmt] = useState('10000');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [confirmResetUserId, setConfirmResetUserId] = useState<string | null>(null);
  const [resetTargetInput, setResetTargetInput] = useState('');
  const [confirmResetInput, setConfirmResetInput] = useState(false);
  const [confirmWipeAll, setConfirmWipeAll] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const isOwner = adminSession?.staffId === 'black' && adminSession?.role === 'owner';

  // Wallet summary for quick receive link access
  const [myWallet] = useState(() => loadWalletProfile());

  // Admin Offline Transfer state
  const [recipientInput, setRecipientInput] = useState(initialPayLink);
  const [transferAmount, setTransferAmount] = useState('10000');
  const [transferComment, setTransferComment] = useState('');
  const [transferError, setTransferError] = useState('');
  const [createdTx, setCreatedTx] = useState<{
    code: string;
    link: string;
    amount: number;
    label: string;
    comment?: string;
  } | null>(null);
  const [recentSent, setRecentSent] = useState<TransferRecord[]>(() =>
    loadTransferHistory().filter((t) => t.type === 'sent').slice(0, 4)
  );
  const [promoName, setPromoName] = useState('');
  const [promoAmt, setPromoAmt] = useState('20000');
  const [promoMaxUses, setPromoMaxUses] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [customPromos, setCustomPromos] = useState<CustomPromoItem[]>([]);
  const [generatedPromo, setGeneratedPromo] = useState<{ code: string; coins: number } | null>(
    null
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const lastPrefilledRef = useRef('');

  const parsedRecipient = useMemo(
    () => parseRecipientInput(recipientInput),
    [recipientInput]
  );

  useEffect(() => {
    if (
      parsedRecipient.requestedAmount &&
      recipientInput !== lastPrefilledRef.current
    ) {
      lastPrefilledRef.current = recipientInput;
      setTransferAmount(String(parsedRecipient.requestedAmount));
      setTransferError('');
    }
  }, [parsedRecipient.requestedAmount, recipientInput]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, [onClose]);

  const flashCopied = (key: string) => {
    setCopiedKey(key);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedKey(null);
      copyTimerRef.current = null;
    }, 1800);
  };

  const copyText = async (text: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        flashCopied(key);
        return;
      }
    } catch {
      // Fallback below
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flashCopied(key);
    } catch {
      // Ignore copy failure
    }
  };

  const shareText = async (title: string, text: string, url: string, key: string) => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Fallback to copy
      }
    }
    await copyText(`${text}\n${url}`, key);
  };

  const loadAdminPanelData = async (sessionOverride?: AdminSessionInfo | null) => {
    const activeSess = sessionOverride !== undefined ? sessionOverride : adminSession;
    const ownerAccess = activeSess?.staffId === 'black' && activeSess?.role === 'owner';
    setAdminDataLoading(true);
    const [logsRes, usersRes, promosList, supportStatus] = await Promise.all([
      fetchAdminLogs(),
      fetchAdminUsers(),
      ownerAccess ? fetchAdminCustomPromos() : Promise.resolve([]),
      fetchSupportStatus(),
    ]);
    setAdminDataLoading(false);
    if (logsRes.ok) setAdminLogs(logsRes.data);
    if (usersRes.ok) setAdminUsers(usersRes.data);
    setOnlineStaff(supportStatus.staff);
    setCustomPromos(promosList);
  };

  // Load online admin status even before unlocking panel
  useEffect(() => {
    fetchSupportStatus().then((st) => setOnlineStaff(st.staff));
  }, []);

  // Verify saved admin token on open so remembered admin opens immediately without password
  useEffect(() => {
    let active = true;
    if (!adminUnlocked) return;
    verifyStoredAdminToken().then((sess) => {
      if (!active) return;
      if (!sess) {
        setAdminUnlocked(false);
        setAdminSession(null);
      } else {
        setAdminSession(sess);
        loadAdminPanelData(sess);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUnlocked]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const p1 = pass1.trim();
    const p2 = pass2.trim();
    if (!p1 || !p2) {
      setAuthError('Введи юз администратора и пароль!');
      return;
    }
    setAdminLoggingIn(true);
    setAuthError('');
    const res = await loginAdmin(p1, p2, formatWalletId(myWallet.walletId));
    setAdminLoggingIn(false);
    if (res.ok) {
      setAdminSession(res.data.session);
      setAdminUnlocked(true);
      setPass1('');
      setPass2('');
      setShowPass2(false);
      loadAdminPanelData(res.data.session);
    } else {
      setAuthError(res.error);
    }
  };

  const handleAdminLogout = async () => {
    await logoutAdminServer();
    setAdminUnlocked(false);
    setAdminSession(null);
    setAdminLogs([]);
    setAdminUsers([]);
    setCustomPromos([]);
    fetchSupportStatus().then((st) => setOnlineStaff(st.staff));
  };

  const handleKickPlayer = async (
    username: string,
    reason?: string,
    durationMinutes?: number
  ) => {
    const clean = username.trim().replace(/^@+/, '');
    if (!clean) {
      setKickMsg({ ok: false, text: 'Введи @юз игрока для кика.' });
      return;
    }
    setBusyUserId(`kick_${clean.toLowerCase()}`);
    setKickMsg(null);
    const res = await kickAdminUser(
      clean,
      (reason ?? kickReasonInput).trim() || 'Нарушение правил игры',
      typeof durationMinutes === 'number' ? durationMinutes : kickDurationMin
    );
    setBusyUserId(null);
    if (!res.ok) {
      setKickMsg({ ok: false, text: res.error });
      return;
    }
    sound.playBuy();
    setKickTargetInput('');
    setKickReasonInput('');
    setKickingUserId(null);
    setKickMsg({
      ok: true,
      text:
        res.data.kickUntil > 0
          ? `Игрок @${res.data.username} кикнут (${Math.max(1, Math.round((res.data.kickUntil - Date.now()) / 60_000))} мин).`
          : `Игрок @${res.data.username} кикнут из текущей сессии!`,
    });
    const refreshed = await fetchAdminUsers();
    if (refreshed.ok) setAdminUsers(refreshed.data);
  };

  const handleUnkickPlayer = async (username: string) => {
    setBusyUserId(`unkick_${username.toLowerCase()}`);
    const res = await unkickAdminUser(username);
    setBusyUserId(null);
    if (!res.ok) {
      setKickMsg({ ok: false, text: res.error });
      return;
    }
    setKickMsg({ ok: true, text: `Кик с @${res.data.username} снят.` });
    const refreshed = await fetchAdminUsers();
    if (refreshed.ok) setAdminUsers(refreshed.data);
  };

  const showCoinFeedback = (text: string, kind: 'add' | 'remove') => {
    setGrantFeedback({ text, kind });
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setGrantFeedback(null);
      feedbackTimerRef.current = null;
    }, 2200);
  };

  const handleGrant = (amount: number) => {
    if (!isOwner) return;
    if (!Number.isFinite(amount) || amount <= 0) return;
    const clamped = Math.min(10_000_000, Math.floor(amount));
    onAddCoins(clamped);
    showCoinFeedback(`+${clamped.toLocaleString('ru-RU')} монет начислено!`, 'add');
  };

  const handleDeductSelf = (amount: number) => {
    if (!isOwner) return;
    if (!Number.isFinite(amount) || amount <= 0) return;
    const clamped = Math.min(999_999_999, Math.floor(amount));
    onRemoveCoins(clamped);
    showCoinFeedback(`−${clamped.toLocaleString('ru-RU')} монет убрано!`, 'remove');
  };

  const handleResetSelfCoins = () => {
    if (!isOwner) return;
    onResetCoins();
    showCoinFeedback('Твой баланс обнулён (0 🪙).', 'remove');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    const parsed = Number(customAmount.replace(/\s+/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    handleGrant(parsed);
  };

  const handleCustomDeduct = () => {
    if (!isOwner) return;
    const parsed = Number(customAmount.replace(/\s+/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    handleDeductSelf(parsed);
  };

  const handleAdjustPlayerCoins = async (
    targetUser: AdminUserSummary,
    mode: 'add' | 'remove' | 'set'
  ) => {
    if (!isOwner) return;
    const parsed = mode === 'set' ? 0 : Math.floor(Number(playerCoinsAmt.replace(/\s+/g, '')) || 0);
    if (mode !== 'set' && (!Number.isFinite(parsed) || parsed <= 0)) {
      setVipMsg({ ok: false, text: 'Введи сумму монет больше 0.' });
      return;
    }
    setBusyUserId(targetUser.id);
    const res = await adjustAdminUserCoins(targetUser.username, mode, parsed);
    setBusyUserId(null);
    if (!res.ok) {
      setVipMsg({ ok: false, text: res.error });
      return;
    }
    setAdminUsers((prev) => prev.map((u) => (u.id === res.data.id ? res.data : u)));
    if (authUser && res.data.username.toLowerCase() === authUser.username.toLowerCase()) {
      onSetCoins(res.data.coins);
    }
    const label =
      mode === 'set'
        ? `Баланс @${res.data.username} обнулён (0 🪙).`
        : mode === 'add'
        ? `Выдано +${parsed.toLocaleString('ru-RU')} 🪙 игроку @${res.data.username} (стало ${res.data.coins.toLocaleString('ru-RU')}).`
        : `Убрано −${parsed.toLocaleString('ru-RU')} 🪙 у @${res.data.username} (осталось ${res.data.coins.toLocaleString('ru-RU')}).`;
    setVipMsg({ ok: true, text: label });
  };

  const handleToggleUserVip = async (targetUser: AdminUserSummary) => {
    if (!isOwner) return;
    const nextVip = !targetUser.vip;
    setBusyUserId(targetUser.id);
    const res = await setAdminUserVip(targetUser.username, nextVip);
    setBusyUserId(null);
    if (!res.ok) {
      setVipMsg({ ok: false, text: res.error });
      return;
    }
    sound.playBuy();
    setAdminUsers((prev) => prev.map((u) => (u.id === res.data.id ? res.data : u)));
    if (authUser && res.data.username.toLowerCase() === authUser.username.toLowerCase()) {
      onSetSelfVip?.(res.data.vip);
    }
    setVipMsg({
      ok: true,
      text: res.data.vip
        ? `Игроку @${res.data.username} выдан VIP ×2!`
        : `У игрока @${res.data.username} снят VIP ×2.`,
    });
  };

  const handleDeleteAccount = async (targetUser: AdminUserSummary) => {
    if (!isOwner) return;
    setBusyUserId(targetUser.id);
    const res = await deleteAdminUser(targetUser.id);
    setBusyUserId(null);
    if (!res.ok) {
      setVipMsg({ ok: false, text: res.error });
      return;
    }
    setAdminUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    setConfirmDeleteUserId(null);
    if (editingCoinsUserId === targetUser.id) setEditingCoinsUserId(null);
    if (authUser && authUser.id === targetUser.id) {
      onLogout();
    }
    setVipMsg({ ok: true, text: `Аккаунт @${res.data.deletedUsername} удалён.` });
  };

  const handleFullResetAccount = async (username: string, rowId?: string) => {
    if (!isOwner) return;
    const clean = username.trim().replace(/^@+/, '');
    if (!clean) {
      setVipMsg({ ok: false, text: 'Введи @юз игрока для обнуления.' });
      return;
    }
    setBusyUserId(rowId || 'reset_form');
    const res = await resetAdminUser(clean);
    setBusyUserId(null);
    if (!res.ok) {
      setVipMsg({ ok: false, text: res.error });
      return;
    }
    sound.playBuy();
    setAdminUsers((prev) => prev.map((u) => (u.id === res.data.id ? res.data : u)));
    setConfirmResetUserId(null);
    setConfirmResetInput(false);
    setResetTargetInput('');
    if (authUser && res.data.username.toLowerCase() === authUser.username.toLowerCase()) {
      onFullResetSelf();
    }
    setVipMsg({
      ok: true,
      text: `Аккаунт @${res.data.username} полностью обнулён (0 🪙, стартовый C3, без VIP).`,
    });
  };

  const handleWipeAllAccounts = async () => {
    if (!isOwner) return;
    setBusyUserId('wipe_all');
    const res = await wipeAllAdminUsers();
    setBusyUserId(null);
    if (!res.ok) {
      setVipMsg({ ok: false, text: res.error });
      return;
    }
    sound.playBuy();
    setConfirmWipeAll(false);
    onFullResetSelf();
    setAdminUsers((prev) =>
      prev.map((u) => ({
        ...u,
        coins: 0,
        vip: false,
        curScooter: 'c3',
      }))
    );
    setVipMsg({
      ok: true,
      text: `Все аккаунты обнулены (${res.data.resetCount} шт.): 0 🪙, стартовый C3, без VIP.`,
    });
  };

  const parsedTxAmount = Math.floor(Number(transferAmount.replace(/\s+/g, '')) || 0);

  const handleAdminCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setTransferError('');

    if (parsedRecipient.kind !== 'wallet' || !parsedRecipient.walletId) {
      setTransferError('Вставь ссылку получателя (?pay=BS-...) или его ID BS-XXXXXX. Забрать перевод сможет только он!');
      return;
    }

    if (!Number.isFinite(parsedTxAmount) || parsedTxAmount < 1) {
      setTransferError('Введи сумму перевода (минимум 1 монета).');
      return;
    }

    const clamped = Math.min(50_000_000, parsedTxAmount);

    const created = createOfflineTransferCheck({
      amount: clamped,
      targetWalletId: parsedRecipient.walletId,
      senderName: 'Админ',
      comment: transferComment,
    });

    sound.playBuy();

    const record: TransferRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'sent',
      amount: created.amount,
      counterparty: parsedRecipient.label,
      targetWallet: created.targetWallet,
      code: created.code,
      link: created.link,
      comment: created.comment,
      createdAt: Date.now(),
    };
    const nextHist = appendTransferHistory(record);
    setRecentSent(nextHist.filter((t) => t.type === 'sent').slice(0, 4));
    setCreatedTx({
      code: created.code,
      link: created.link,
      amount: created.amount,
      label: parsedRecipient.label,
      comment: created.comment,
    });
    setTransferComment('');
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || promoBusy) return;
    setPromoMsg(null);
    const parsed = Math.floor(Number(promoAmt.replace(/\s+/g, '')) || 0);
    if (!Number.isFinite(parsed) || parsed < 100) {
      setPromoMsg({ ok: false, text: 'Минимум 100 монет.' });
      return;
    }

    const trimmedName = promoName.trim();
    if (!trimmedName) {
      // Quick offline signed auto-code when name field is left empty
      const created = createAdminPromoCode(parsed);
      sound.playBuy();
      setGeneratedPromo(created);
      setPromoMsg({ ok: true, text: `Авто-промокод ${created.code} создан!` });
      return;
    }

    const parsedLimit = Math.max(0, Math.floor(Number(promoMaxUses.replace(/\s+/g, '')) || 0));
    setPromoBusy(true);
    const res = await createCustomPromoCode(trimmedName, parsed, parsedLimit);
    setPromoBusy(false);

    if (!res.ok) {
      setPromoMsg({ ok: false, text: res.error });
      return;
    }

    sound.playBuy();
    setGeneratedPromo({ code: res.promo.code, coins: res.promo.coins });
    setCustomPromos((prev) => [res.promo, ...prev.filter((p) => p.code !== res.promo.code)]);
    setPromoName('');
    setPromoMaxUses('');
    setPromoMsg({
      ok: true,
      text: res.promo.localOnly
        ? `Создан «${res.promo.code}» (офлайн-режим).`
        : `Промокод «${res.promo.code}» доступен всем игрокам!`,
    });
  };

  const handleDeleteCustomPromo = async (code: string) => {
    if (!isOwner) return;
    await deleteCustomPromoCode(code);
    setCustomPromos((prev) => prev.filter((p) => p.code !== code));
    if (generatedPromo?.code === code) setGeneratedPromo(null);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center p-3.5 sm:p-4 bg-[#0a0d12]/80 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-[#161c24]/98 border border-white/10 p-5 sm:p-6 shadow-2xl my-auto text-left">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-2xl font-black text-white">Настройки</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть настройки"
            className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sound, Controls & Promo Quick Panel (moved cleanly from HUD/Menu top bars) */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <button
            type="button"
            onClick={onToggleMute}
            className={`h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition px-2 ${
              muted
                ? 'bg-[#1e2631] border-white/10 text-white/70 hover:text-white'
                : 'bg-[#ff6a1a]/18 border-[#ff6a1a]/45 text-white hover:bg-[#ff6a1a]/28'
            }`}
          >
            {muted ? (
              <>
                <VolumeX className="w-4 h-4 text-red-300 shrink-0" />
                <span className="truncate">Звук выкл</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#ff8b4a] shrink-0" />
                <span className="truncate">Звук вкл</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTutorial();
            }}
            className="h-11 rounded-xl bg-[#1e2631] hover:bg-[#27313f] border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition px-2"
          >
            <HelpCircle className="w-4 h-4 text-[#ffc599] shrink-0" />
            <span className="truncate">Управление</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPromo();
            }}
            className="h-11 rounded-xl bg-[#ff6a1a]/18 hover:bg-[#ff6a1a]/28 border border-[#ff6a1a]/40 text-[#ffc599] text-xs font-bold flex items-center justify-center gap-1.5 transition px-2"
          >
            <Gift className="w-4 h-4 text-[#ff8b4a] shrink-0" />
            <span className="truncate">Промокод</span>
          </button>
        </div>

        {/* Weather, Time of Day & Map Section */}
        <div className="rounded-xl bg-[#1e2631] border border-white/10 p-3.5 mb-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <CloudRain className="w-4 h-4 text-sky-400" />
              Погода и локация
            </div>
            <button
              type="button"
              onClick={onToggleTimeOfDay}
              className={`h-8 px-3 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition ${
                timeOfDay === 'night'
                  ? 'bg-indigo-500/20 border-indigo-400/45 text-indigo-200 hover:bg-indigo-500/30'
                  : 'bg-amber-500/18 border-amber-400/40 text-amber-200 hover:bg-amber-500/28'
              }`}
            >
              {timeOfDay === 'night' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-300" />
                  Ночь
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  День
                </>
              )}
            </button>
          </div>

          <div>
            <div className="text-[11px] text-white/55 font-semibold mb-1.5">Погода</div>
            <div className="grid grid-cols-4 gap-1.5">
              {WEATHERS.map((w) => {
                const active = weather === w.id;
                const Icon =
                  w.id === 'rain'
                    ? CloudRain
                    : w.id === 'fog'
                      ? CloudFog
                      : w.id === 'snow'
                        ? Snowflake
                        : Sun;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onSelectWeather(w.id)}
                    className={`h-9 rounded-lg text-[11px] font-bold border flex items-center justify-center gap-1 transition px-1 ${
                      active
                        ? 'bg-[#ff6a1a] border-[#ff8b4a] text-white shadow-sm'
                        : 'bg-[#141921] border-white/8 text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{w.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-white/55 font-semibold mb-1.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#ff8b4a]" />
              Карта
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {MAPS.map((mp) => {
                const active = mapId === mp.id;
                return (
                  <button
                    key={mp.id}
                    type="button"
                    onClick={() => onSelectMap(mp.id)}
                    className={`h-9 rounded-lg text-xs font-bold border transition px-2 truncate ${
                      active
                        ? 'bg-[#ff6a1a] border-[#ff8b4a] text-white shadow-sm'
                        : 'bg-[#141921] border-white/8 text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {mp.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rider Gear / Items Section (Вещи) */}
        <div className="rounded-xl bg-[#1e2631] border border-white/10 p-3.5 mb-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Shirt className="w-4 h-4 text-[#ff8b4a]" />
              Вещи и экипировка
            </div>
            <span className="text-[11px] text-white/55 font-mono-num">
              {ownedScootersCount + ownedOutfitsCount + ownedHelmetsCount} шт.
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-left">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenShop();
              }}
              className="rounded-lg bg-[#141921] hover:bg-[#1a222d] border border-white/10 p-2 transition flex flex-col gap-1"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#ff8b4a]">
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                Самокаты
              </div>
              <div className="text-[11px] text-white font-semibold truncate w-full">
                {currentScooterName}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOutfits();
              }}
              className="rounded-lg bg-[#141921] hover:bg-[#1a222d] border border-white/10 p-2 transition flex flex-col gap-1"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#ff8b4a]">
                <Shirt className="w-3.5 h-3.5 shrink-0" />
                Одежда
              </div>
              <div className="text-[11px] text-white font-semibold truncate w-full">
                {currentOutfitName}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHelmets();
              }}
              className="rounded-lg bg-[#141921] hover:bg-[#1a222d] border border-white/10 p-2 transition flex flex-col gap-1"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#ff8b4a]">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                Шлемы
              </div>
              <div className="text-[11px] text-white font-semibold truncate w-full">
                {currentHelmetName}
              </div>
            </button>
          </div>
        </div>

        {/* PWA Install Card */}
        <div className="rounded-xl bg-[#16221b] border border-emerald-400/30 p-3.5 mb-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-bold text-white">Скачать игру (PWA)</div>
            <span className="text-[11px] font-bold text-emerald-300">На экран «Домой»</span>
          </div>
          <p className="text-xs text-white/65 leading-snug">
            Установи BLACK STANT как отдельное приложение на телефон или ПК — на весь экран и с иконкой.
          </p>
          <PWAInstallButton />
        </div>

        {/* Global Players Counter */}
        <div className="rounded-xl bg-[#1e2631] border border-white/8 p-3.5 mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff6a1a]/15 flex items-center justify-center text-[#ff8b4a] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-white/60 font-medium">Общий счётчик</div>
              <div className="text-sm font-bold text-white">Сколько игроков зашло</div>
            </div>
          </div>
          <div className="font-mono-num text-xl font-extrabold text-white">
            {totalPlayers.toLocaleString('ru-RU')}
          </div>
        </div>

        {/* Player Wallet / Receive Offline Code */}
        <div className="rounded-xl bg-[#1e2631] border border-white/8 p-3.5 mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-300 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">Получить перевод</div>
              <div className="text-xs text-white/55 font-mono-num">
                ID: {formatWalletId(myWallet.walletId)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenReceiveWallet}
            className="h-9 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 font-bold text-xs transition whitespace-nowrap shrink-0"
          >
            Код / Ссылка
          </button>
        </div>

        {/* Telegram Support (@durov0113) */}
        <a
          href="https://t.me/durov0113"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-[#162635] hover:bg-[#1a3044] border border-sky-400/30 p-3.5 mb-4 flex items-center justify-between gap-3 transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-300 shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">Поддержка в Telegram</div>
              <div className="text-xs text-sky-300 font-mono-num">@durov0113</div>
            </div>
          </div>
          <span className="h-9 px-3.5 rounded-xl bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0">
            Написать
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </a>

        {/* Admin Panel Section */}
        <div className="rounded-xl bg-[#141921] border border-white/10 p-4">
          <button
            type="button"
            onClick={() => setAdminOpen((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2.5">
              {adminUnlocked ? (
                <ShieldCheck className="w-5 h-5 text-[#4ade80]" />
              ) : (
                <Lock className="w-5 h-5 text-[#ff8b4a]" />
              )}
              <span className="font-display font-bold text-base text-white">Админ-панель</span>
            </div>
            <span className="text-xs font-semibold text-white/55">
              {adminUnlocked
                ? `${adminSession?.actor || 'Админ'}`
                : adminOpen
                  ? 'Скрыть'
                  : 'Открыть'}
            </span>
          </button>

          {adminOpen && !adminUnlocked && (
            <form onSubmit={handleAdminLogin} className="mt-3.5 space-y-2.5">
              <p className="text-xs text-white/60">
                Введи свой юз администратора и пароль:
              </p>
              <div>
                <label className="block text-xs text-white/65 mb-1">Юз администратора</label>
                <input
                  type="text"
                  value={pass1}
                  onChange={(e) => {
                    setPass1(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="Введи юз"
                  autoComplete="off"
                  className="w-full h-10 px-3 rounded-xl bg-[#1d2530] border border-white/10 focus:border-[#ff6a1a] outline-none text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-white/65 mb-1">Пароль</label>
                <div className="relative">
                  <input
                    type={showPass2 ? 'text' : 'password'}
                    value={pass2}
                    onChange={(e) => {
                      setPass2(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Введи пароль"
                    autoComplete="off"
                    className="w-full h-10 pl-3 pr-10 rounded-xl bg-[#1d2530] border border-white/10 focus:border-[#ff6a1a] outline-none text-sm text-white font-mono-num"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass2((v) => !v)}
                    aria-label={showPass2 ? 'Скрыть пароль' : 'Показать пароль'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center text-white/55 hover:text-white hover:bg-white/10 transition"
                  >
                    {showPass2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {authError && <p className="text-xs text-[#ff7b72] font-semibold">{authError}</p>}
              <button
                type="submit"
                disabled={adminLoggingIn}
                className="w-full h-10 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-50 text-white font-bold text-sm transition"
              >
                {adminLoggingIn ? 'Проверяем...' : 'Войти в админ-панель'}
              </button>
              <p className="text-[11px] text-white/45 text-center">
                После входа сессия запомнится и ты появишься в «Админы в сети».
              </p>
            </form>
          )}

          {adminOpen && adminUnlocked && (
            <div className="mt-3.5 space-y-4 border-t border-white/8 pt-3.5">
              {/* Active Admin Role Banner + Online Staff Strip */}
              <div className="rounded-xl bg-[#1a222d] border border-emerald-400/30 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isOwner ? (
                      <Crown className="w-4 h-4 text-[#ffd34d] shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-sky-300 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-white truncate">
                        {adminSession?.actor || 'BLACK'}
                      </div>
                      <div className="text-[10px] text-emerald-300 truncate">
                        {adminSession?.roleLabel || 'Главный админ · Создатель'}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold shrink-0">
                    ● В сети
                  </span>
                </div>
                {onlineStaff.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/8">
                    {onlineStaff.map((st) => (
                      <span
                        key={st.id}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                          st.online
                            ? 'bg-emerald-500/18 text-emerald-200 border border-emerald-400/35'
                            : 'bg-white/5 text-white/40 border border-white/8'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            st.online ? 'bg-emerald-400' : 'bg-white/25'
                          }`}
                        />
                        {st.displayName}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#1d2530] p-2.5 border border-white/8">
                  <div className="text-[11px] text-white/55">Игроков зашло</div>
                  <div className="font-mono-num text-lg font-extrabold text-white mt-0.5">
                    {totalPlayers.toLocaleString('ru-RU')}
                  </div>
                </div>
                <div className="rounded-lg bg-[#1d2530] p-2.5 border border-white/8">
                  <div className="text-[11px] text-white/55">Твой баланс</div>
                  <div className="font-mono-num text-lg font-extrabold text-[#ffd34d] mt-0.5">
                    🪙 {Math.floor(coins).toLocaleString('ru-RU')}
                  </div>
                </div>
              </div>

              <div className="text-xs text-white/55 font-mono-num">
                Самокатов: {ownedScootersCount} · Одежды: {ownedOutfitsCount} · Шлемов: {ownedHelmetsCount}
              </div>

              {/* Kick Player Section (Available to BLACK, Shampyr, StantF1) */}
              <div className="rounded-xl bg-[#1a222d] border border-red-400/35 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <UserX className="w-4 h-4 text-[#ff7b72]" />
                    Кикнуть игрока
                  </div>
                  <span className="text-[10px] text-white/45">BLACK защищён</span>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleKickPlayer(kickTargetInput);
                  }}
                  className="space-y-2"
                >
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={kickTargetInput}
                      onChange={(e) => {
                        setKickTargetInput(e.target.value);
                        setKickMsg(null);
                      }}
                      placeholder="@юз игрока"
                      className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-[#121820] border border-white/12 focus:border-red-400 outline-none text-xs text-white placeholder:text-white/35"
                    />
                    <button
                      type="submit"
                      disabled={busyUserId?.startsWith('kick_')}
                      className="h-9 px-3.5 rounded-lg bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-extrabold text-xs transition whitespace-nowrap"
                    >
                      Кикнуть
                    </button>
                  </div>
                  <input
                    type="text"
                    value={kickReasonInput}
                    onChange={(e) => setKickReasonInput(e.target.value)}
                    placeholder="Причина кика (например: читы / спам)"
                    maxLength={120}
                    className="w-full h-8 px-3 rounded-lg bg-[#121820] border border-white/10 focus:border-red-400 outline-none text-[11px] text-white placeholder:text-white/35"
                  />
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { min: 0, label: 'Кик сейчас' },
                      { min: 5, label: '5 мин' },
                      { min: 30, label: '30 мин' },
                      { min: 1440, label: '24 часа' },
                    ].map((opt) => (
                      <button
                        key={opt.min}
                        type="button"
                        onClick={() => setKickDurationMin(opt.min)}
                        className={`h-7 rounded-md text-[10px] font-bold border transition ${
                          kickDurationMin === opt.min
                            ? 'bg-red-500/30 border-red-400/60 text-red-100'
                            : 'bg-[#121820] border-white/8 text-white/60 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </form>
                {kickMsg && (
                  <div
                    className={`text-[11px] font-bold ${
                      kickMsg.ok ? 'text-[#4ade80]' : 'text-[#ff7b72]'
                    }`}
                  >
                    {kickMsg.text}
                  </div>
                )}
              </div>

              {/* Self coin grant & deduct controls (OWNER BLACK ONLY) */}
              {isOwner && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-2">
                  <Coins className="w-4 h-4 text-[#ffd34d]" />
                  Начислить / убрать себе монеты
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleGrant(amt)}
                      className="h-9 rounded-lg bg-[#242e3b] hover:bg-[#2f3c4d] active:scale-[0.98] text-white font-mono-num font-bold text-xs border border-white/10 transition"
                    >
                      +{amt.toLocaleString('ru-RU')}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                  {QUICK_DEDUCT_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleDeductSelf(amt)}
                      className="h-8 rounded-lg bg-red-500/12 hover:bg-red-500/22 active:scale-[0.98] text-[#ff938b] font-mono-num font-bold text-[11px] border border-red-400/25 transition"
                    >
                      −{amt >= 1000 ? `${amt / 1000}к` : amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleResetSelfCoins}
                    className="h-8 rounded-lg bg-red-500/18 hover:bg-red-500/30 active:scale-[0.98] text-[#ffb4ae] font-bold text-[11px] border border-red-400/35 transition"
                  >
                    Обнулить
                  </button>
                </div>
                <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={999999999}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Сумма"
                    className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-[#1d2530] border border-white/10 focus:border-[#ff6a1a] outline-none text-sm text-white font-mono-num"
                  />
                  <button
                    type="submit"
                    className="h-10 px-3.5 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-bold text-xs sm:text-sm transition whitespace-nowrap"
                  >
                    Выдать
                  </button>
                  <button
                    type="button"
                    onClick={handleCustomDeduct}
                    className="h-10 px-3.5 rounded-xl bg-red-500/20 hover:bg-red-500/32 border border-red-400/35 text-[#ff938b] font-bold text-xs sm:text-sm transition whitespace-nowrap"
                  >
                    Убрать
                  </button>
                </form>
                {grantFeedback && (
                  <div
                    className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${
                      grantFeedback.kind === 'add' ? 'text-[#4ade80]' : 'text-[#ff938b]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {grantFeedback.text}
                  </div>
                )}
              </div>
              )}

              {/* Admin: Select / Unlock ANY Scooter (All staff testers can test any scooter!) */}
              <div className="rounded-xl bg-[#1a222d] border border-[#ff6a1a]/30 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Bike className="w-4 h-4 text-[#ff8b4a]" />
                    Выбрать любой самокат (тест)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onAdminUnlockAllScooters();
                      sound.playBuy();
                      showCoinFeedback('Все самокаты открыты!', 'add');
                    }}
                    className="h-7 px-2.5 rounded-lg bg-[#ff6a1a]/20 hover:bg-[#ff6a1a]/32 border border-[#ff6a1a]/40 text-[#ffb178] font-bold text-[10px] transition whitespace-nowrap"
                  >
                    Открыть все ({SCOOTERS.length})
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto mobile-scroll pr-0.5">
                  {SCOOTERS.map((sc) => {
                    const isActive = currentScooterId === sc.id;
                    const isOwned = ownedScooters.includes(sc.id);
                    const effMax = getEffectiveScooterStats(
                      sc,
                      ownedVesc.includes(sc.id),
                      ownedMotors.includes(sc.id)
                    ).maxKmh;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          onAdminSelectScooter(sc.id);
                          sound.playBuy();
                          showCoinFeedback(`Выбран: ${sc.name}`, 'add');
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition ${
                          isActive
                            ? 'bg-[#ff6a1a]/20 border-[#ff6a1a] text-white'
                            : 'bg-[#121820] hover:bg-[#1d2531] border-white/8 text-white/85'
                        }`}
                      >
                        <div className="w-9 h-9 rounded bg-[#e8edf3] p-0.5 flex items-center justify-center shrink-0">
                          <img
                            src={sc.spriteSrc}
                            alt={sc.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.src = sc.originalSrc;
                            }}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold truncate leading-tight">
                            {sc.name}
                          </div>
                          <div className="text-[9px] text-white/50 truncate">
                            {isActive
                              ? '✓ Выбран'
                              : isOwned
                                ? `Есть · ${effMax} км/ч`
                                : `${effMax} км/ч`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin Offline Transfer + Custom Promos (OWNER BLACK ONLY) */}
              {isOwner && (
              <>
              {/* Admin Offline Transfer to Friend / Player via Link or Bot */}
              <div className="rounded-xl bg-[#1a222d] border border-emerald-400/25 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Send className="w-4 h-4 text-emerald-400" />
                    Перевести другу / игроку
                  </div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-[10px] font-bold text-emerald-300">
                    <WifiOff className="w-2.5 h-2.5" />
                    Офлайн
                  </span>
                </div>

                {createdTx ? (
                  <div className="space-y-2.5">
                    <div className="rounded-lg bg-emerald-500/12 border border-emerald-400/30 p-2.5">
                      <div className="text-xs font-bold text-emerald-300">
                        Чек создан: +{createdTx.amount.toLocaleString('ru-RU')} 🪙
                      </div>
                      <div className="text-[11px] text-white/70 truncate mt-0.5">
                        Для: {createdTx.label}
                      </div>
                      {createdTx.comment && (
                        <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-white/90 bg-white/6 rounded px-2 py-1">
                          <MessageSquare className="w-3 h-3 text-[#ffd34d] shrink-0 mt-0.5" />
                          <span className="break-words">«{createdTx.comment}»</span>
                        </div>
                      )}
                      <div className="mt-2 rounded-md bg-[#0f141a] px-2.5 py-1.5 font-mono-num text-xs font-extrabold text-[#ffd34d] tracking-wider break-all select-all text-center">
                        {createdTx.code}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyText(createdTx.link, 'adm_tx_link')}
                        className="h-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#06150e] font-bold text-xs flex items-center justify-center gap-1 transition"
                      >
                        {copiedKey === 'adm_tx_link' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Скоп.!
                          </>
                        ) : (
                          <>
                            <Link2 className="w-3.5 h-3.5" />
                            Ссылка
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            createdTx.comment
                              ? `${createdTx.code} | ${createdTx.comment}`
                              : createdTx.code,
                            'adm_tx_code'
                          )
                        }
                        className="h-9 rounded-lg bg-[#242e3b] hover:bg-[#2f3c4d] text-white font-bold text-xs flex items-center justify-center gap-1 border border-white/10 transition"
                      >
                        {copiedKey === 'adm_tx_code' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Скоп.!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Код
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          shareText(
                            'Перевод монет BLACK STANT',
                            `Тебе перевели ${createdTx.amount.toLocaleString('ru-RU')} 🪙 в BLACK STANT!${
                              createdTx.comment ? ` Комментарий: «${createdTx.comment}».` : ''
                            } Код без интернета: ${createdTx.code}`,
                            createdTx.link,
                            'adm_tx_share'
                          )
                        }
                        className="h-8 rounded-lg bg-white/8 hover:bg-white/14 text-white font-semibold text-xs flex items-center justify-center gap-1 transition"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Поделиться
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCreatedTx(null);
                          setRecipientInput('');
                          setTransferComment('');
                        }}
                        className="h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/75 font-semibold text-xs transition"
                      >
                        Новый перевод
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAdminCreateTransfer} className="space-y-2.5">
                    <div>
                      <input
                        type="text"
                        value={recipientInput}
                        onChange={(e) => {
                          setRecipientInput(e.target.value);
                          setTransferError('');
                        }}
                        placeholder="Ссылка друга / бота или ID BS-XXXXXX"
                        className="w-full h-9 px-3 rounded-lg bg-[#121820] border border-white/12 focus:border-emerald-400 outline-none text-xs text-white placeholder:text-white/35"
                      />
                      <div className="mt-1 text-[11px]">
                        {parsedRecipient.kind === 'wallet' && (
                          <div className="text-emerald-300 font-semibold">
                            Получатель: {parsedRecipient.label} · Забрать сможет только он
                          </div>
                        )}
                        {parsedRecipient.kind === 'bot_link' && (
                          <div className="text-[#ff938b] font-semibold truncate">
                            Нужна ссылка получателя (?pay=BS-...) или ID BS-XXXXXX
                          </div>
                        )}
                        {parsedRecipient.kind === 'universal' && (
                          <span className="text-white/50">
                            Вставь ссылку получателя (?pay=BS-...) или BS-XXXXXX — перевод только для него.
                          </span>
                        )}
                      </div>
                    </div>

                    <input
                      type="text"
                      maxLength={80}
                      value={transferComment}
                      onChange={(e) => setTransferComment(e.target.value)}
                      placeholder="Комментарий к переводу (необязательно)"
                      className="w-full h-9 px-3 rounded-lg bg-[#121820] border border-white/12 focus:border-emerald-400 outline-none text-xs text-white placeholder:text-white/35"
                    />

                    <div className="grid grid-cols-4 gap-1.5">
                      {QUICK_TRANSFER_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setTransferAmount(String(amt));
                            setTransferError('');
                          }}
                          className="h-7 rounded-md bg-[#242e3b] hover:bg-[#2f3c4d] text-white font-mono-num font-bold text-[10px] border border-white/8 transition"
                        >
                          {amt >= 1000 ? `${amt / 1000}к` : amt}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={50000000}
                        value={transferAmount}
                        onChange={(e) => {
                          setTransferAmount(e.target.value);
                          setTransferError('');
                        }}
                        placeholder="Сумма монет"
                        className="flex-1 h-9 px-3 rounded-lg bg-[#121820] border border-white/12 focus:border-emerald-400 outline-none text-xs text-white font-mono-num"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#06150e] font-bold text-xs transition whitespace-nowrap"
                      >
                        Перевести
                      </button>
                    </div>

                    {transferError && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#ff7b72] font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {transferError}
                      </div>
                    )}
                  </form>
                )}

                {/* Quick re-copy of recent admin transfers */}
                {recentSent.length > 0 && (
                  <div className="pt-2 border-t border-white/8 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                      Последние переводы
                    </div>
                    {recentSent.map((tx) => (
                      <div
                        key={tx.id}
                        className="text-[11px] bg-[#121820] rounded-lg px-2.5 py-1.5 border border-white/6 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 truncate text-white/80">
                            <span className="font-mono-num font-bold text-[#ffd34d]">
                              {tx.amount.toLocaleString('ru-RU')}
                            </span>{' '}
                            <span className="text-white/50">→ {tx.counterparty}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => copyText(tx.link, `r_l_${tx.id}`)}
                              className="px-1.5 py-0.5 rounded bg-white/8 hover:bg-white/15 text-white/85 font-semibold"
                            >
                              {copiedKey === `r_l_${tx.id}` ? '✓' : 'Ссыл.'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  tx.comment ? `${tx.code} | ${tx.comment}` : tx.code,
                                  `r_c_${tx.id}`
                                )
                              }
                              className="px-1.5 py-0.5 rounded bg-white/8 hover:bg-white/15 text-white/85 font-semibold"
                            >
                              {copiedKey === `r_c_${tx.id}` ? '✓' : 'Код'}
                            </button>
                          </div>
                        </div>
                        {tx.comment && (
                          <div className="text-[10px] text-white/60 truncate">
                            💬 «{tx.comment}»
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Promo Code Creator (Custom Name + Auto Offline Code) */}
              <div className="rounded-xl bg-[#1a222d] border border-[#ff6a1a]/30 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Gift className="w-4 h-4 text-[#ff8b4a]" />
                    Создать промокод для всех
                  </div>
                  <span className="text-[10px] font-bold text-[#ffd34d]">BLACKDA4K = 20к</span>
                </div>

                <form onSubmit={handleCreatePromo} className="space-y-2">
                  <input
                    type="text"
                    maxLength={24}
                    value={promoName}
                    onChange={(e) => {
                      setPromoName(e.target.value.toUpperCase().replace(/\s+/g, ''));
                      setPromoMsg(null);
                    }}
                    placeholder="Придумай название (напр. LETO2026 или пусто)"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full h-9 px-3 rounded-lg bg-[#121820] border border-white/12 focus:border-[#ff6a1a] outline-none text-xs font-extrabold tracking-wider uppercase text-white font-mono-num placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:normal-case placeholder:text-white/35"
                  />
                  <div className="grid grid-cols-[1fr_92px_auto] gap-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={100}
                      max={10000000}
                      value={promoAmt}
                      onChange={(e) => {
                        setPromoAmt(e.target.value);
                        setPromoMsg(null);
                      }}
                      placeholder="Монет"
                      className="h-9 px-2.5 rounded-lg bg-[#121820] border border-white/12 focus:border-[#ff6a1a] outline-none text-xs text-white font-mono-num min-w-0"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100000}
                      value={promoMaxUses}
                      onChange={(e) => setPromoMaxUses(e.target.value)}
                      placeholder="Лимит ∞"
                      title="Максимум активаций (0 или пусто = без лимита)"
                      className="h-9 px-2.5 rounded-lg bg-[#121820] border border-white/12 focus:border-[#ff6a1a] outline-none text-xs text-white font-mono-num placeholder:text-white/35 min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={promoBusy}
                      className="h-9 px-3.5 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-50 text-white font-bold text-xs transition whitespace-nowrap"
                    >
                      {promoBusy ? '...' : 'Создать'}
                    </button>
                  </div>
                </form>

                {promoMsg && (
                  <div
                    className={`text-[11px] font-semibold ${
                      promoMsg.ok ? 'text-emerald-300' : 'text-[#ff7b72]'
                    }`}
                  >
                    {promoMsg.text}
                  </div>
                )}

                {generatedPromo && (
                  <div className="rounded-lg bg-[#121820] border border-[#ffd34d]/30 p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono-num text-xs font-extrabold text-[#ffd34d] truncate select-all">
                        {generatedPromo.code}
                      </div>
                      <div className="text-[10px] text-white/55">
                        Даёт +{generatedPromo.coins.toLocaleString('ru-RU')} 🪙 каждому 1 раз
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(generatedPromo.code, 'adm_promo')}
                      className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/16 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition"
                    >
                      {copiedKey === 'adm_promo' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedKey === 'adm_promo' ? 'Ок' : 'Коп.'}
                    </button>
                  </div>
                )}

                {customPromos.length > 0 && (
                  <div className="pt-2 border-t border-white/8 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                      Твои промокоды ({customPromos.length})
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto mobile-scroll pr-0.5">
                      {customPromos.map((p) => (
                        <div
                          key={p.code}
                          className="rounded-lg bg-[#121820] border border-white/8 px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px]"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono-num font-extrabold text-[#ffd34d] truncate select-all">
                                {p.code}
                              </span>
                              <span className="font-mono-num text-[10px] text-white/45 shrink-0">
                                {p.usedCount}/{p.maxUses > 0 ? p.maxUses : '∞'}
                              </span>
                            </div>
                            <div className="font-mono-num text-[10px] text-emerald-300/90">
                              +{p.coins.toLocaleString('ru-RU')} 🪙
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => copyText(p.code, `cp_${p.code}`)}
                              className="h-7 px-2 rounded-md bg-white/8 hover:bg-white/15 text-white/85 font-semibold text-[10px]"
                            >
                              {copiedKey === `cp_${p.code}` ? '✓' : 'Коп.'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomPromo(p.code)}
                              aria-label={`Удалить промокод ${p.code}`}
                              className="h-7 w-7 rounded-md bg-red-500/12 hover:bg-red-500/25 text-red-300 flex items-center justify-center transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              </>
              )}

              {/* Players Management: Kick (All Admins) + VIP ×2 / Coins / Reset / Delete (Owner BLACK only) */}
              <div className="rounded-xl bg-[#1a222d] border border-[#ffd34d]/35 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Crown className="w-4 h-4 text-[#ffd34d]" />
                    {isOwner ? 'Игроки: VIP ×2, кик, монеты, обнуление' : 'Список игроков (кик)'}
                  </div>
                </div>

                {isOwner && (
                  <>
                    {/* Full Account Reset by @юз */}
                    <div className="rounded-lg bg-[#121820] border border-red-400/25 p-2.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#ff938b]">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Обнулить аккаунт игрока (монеты, самокаты, скины)
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const clean = resetTargetInput.trim().replace(/^@+/, '');
                          if (!clean) {
                            setVipMsg({ ok: false, text: 'Введи @юз игрока для обнуления.' });
                            return;
                          }
                          setConfirmResetInput(true);
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={resetTargetInput}
                          onChange={(e) => {
                            setResetTargetInput(e.target.value);
                            setConfirmResetInput(false);
                            setVipMsg(null);
                          }}
                          placeholder="@юз игрока"
                          className="flex-1 h-9 px-3 rounded-lg bg-[#1a222d] border border-white/12 focus:border-red-400 outline-none text-xs text-white placeholder:text-white/35"
                        />
                        <button
                          type="submit"
                          disabled={busyUserId === 'reset_form'}
                          className="h-9 px-3 rounded-lg bg-red-500/25 hover:bg-red-500/38 border border-red-400/40 text-[#ffb4ae] font-extrabold text-xs transition whitespace-nowrap"
                        >
                          Обнулить
                        </button>
                      </form>
                      {confirmResetInput && resetTargetInput.trim() && (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-red-400/20">
                          <span className="text-[10px] font-bold text-[#ff938b] truncate">
                            Точно обнулить @{resetTargetInput.trim().replace(/^@+/, '')}?
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={busyUserId === 'reset_form'}
                              onClick={() => handleFullResetAccount(resetTargetInput)}
                              className="h-6 px-2.5 rounded bg-red-500 hover:bg-red-400 text-white font-bold text-[10px] transition"
                            >
                              {busyUserId === 'reset_form' ? '...' : 'Да, обнулить'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmResetInput(false)}
                              className="h-6 px-2 rounded bg-white/10 hover:bg-white/18 text-white/80 font-semibold text-[10px] transition"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-white/8">
                        {!confirmWipeAll ? (
                          <button
                            type="button"
                            disabled={busyUserId === 'wipe_all'}
                            onClick={() => setConfirmWipeAll(true)}
                            className="w-full h-8 rounded-lg bg-red-600/25 hover:bg-red-600/38 border border-red-400/45 text-[#ffb4ae] font-extrabold text-[11px] transition"
                          >
                            Обнулить ВСЕ аккаунты
                          </button>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-[#ff8b82]">
                              Сбросить прогресс ВСЕМ игрокам?
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={busyUserId === 'wipe_all'}
                                onClick={handleWipeAllAccounts}
                                className="h-6 px-2.5 rounded bg-red-500 hover:bg-red-400 text-white font-extrabold text-[10px] transition"
                              >
                                {busyUserId === 'wipe_all' ? '...' : 'Да, всем'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmWipeAll(false)}
                                className="h-6 px-2 rounded bg-white/10 hover:bg-white/18 text-white/80 font-semibold text-[10px] transition"
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {vipMsg && (
                  <div
                    className={`text-[11px] font-bold ${
                      vipMsg.ok ? 'text-[#4ade80]' : 'text-[#ff7b72]'
                    }`}
                  >
                    {vipMsg.text}
                  </div>
                )}

                {adminUsers.length > 0 && (
                  <div className="pt-2 border-t border-white/8 space-y-1.5 max-h-60 overflow-y-auto mobile-scroll pr-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                      Зарегистрированные игроки ({adminUsers.length})
                    </div>
                    {adminUsers.map((u) => {
                      const isEditingCoins = editingCoinsUserId === u.id;
                      const isConfirmDelete = confirmDeleteUserId === u.id;
                      const isConfirmReset = confirmResetUserId === u.id;
                      const isKicking = kickingUserId === u.id;
                      const isBusy = busyUserId === u.id;
                      const isKickedNow = Boolean(u.kickedUntil && u.kickedUntil > Date.now());
                      const isProtectedOwner =
                        u.username.toLowerCase() === 'black' ||
                        u.username.toLowerCase() === 'blackda4k';
                      return (
                        <div
                          key={u.id}
                          className="text-[11px] bg-[#121820] rounded-lg px-2.5 py-2 border border-white/6 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="min-w-0 truncate flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  u.online ? 'bg-emerald-400' : 'bg-white/20'
                                }`}
                                title={u.online ? 'В сети' : 'Не в сети'}
                              />
                              <span className="font-bold text-white">@{u.username}</span>{' '}
                              {u.vip && (
                                <span className="px-1 py-0.5 rounded bg-[#ffd34d]/20 border border-[#ffd34d]/45 text-[#ffd34d] text-[9px] font-extrabold shrink-0">
                                  VIP ×2
                                </span>
                              )}
                              <span className="font-mono-num text-[#ffd34d]/85">
                                🪙 {Math.floor(u.coins).toLocaleString('ru-RU')}
                              </span>
                              {isKickedNow && (
                                <span className="ml-1.5 px-1 py-0.5 rounded bg-red-500/20 text-[#ff8b82] text-[9px] font-extrabold">
                                  КИКНУТ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!isProtectedOwner &&
                                (isKickedNow ? (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleUnkickPlayer(u.username)}
                                    className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/32 text-emerald-300 font-bold text-[10px] transition"
                                  >
                                    Снять кик
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => {
                                      setEditingCoinsUserId(null);
                                      setConfirmDeleteUserId(null);
                                      setConfirmResetUserId(null);
                                      setKickingUserId(isKicking ? null : u.id);
                                    }}
                                    title="Кикнуть игрока"
                                    className={`px-2 py-1 rounded font-bold text-[10px] transition ${
                                      isKicking
                                        ? 'bg-red-500 text-white'
                                        : 'bg-red-500/18 hover:bg-red-500/30 text-[#ff938b]'
                                    }`}
                                  >
                                    Кик
                                  </button>
                                ))}
                              {isOwner && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleToggleUserVip(u)}
                                    title={u.vip ? 'Снять VIP ×2' : 'Выдать VIP ×2'}
                                    className={`px-2 py-1 rounded font-bold text-[10px] transition ${
                                      u.vip
                                        ? 'bg-[#ffd34d] text-[#11151c] hover:bg-[#ffe07d]'
                                        : 'bg-[#ffd34d]/15 hover:bg-[#ffd34d]/28 border border-[#ffd34d]/35 text-[#ffd34d]'
                                    }`}
                                  >
                                    {u.vip ? 'VIP ✓' : 'VIP ×2'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => {
                                      setKickingUserId(null);
                                      setConfirmDeleteUserId(null);
                                      setConfirmResetUserId(null);
                                      setEditingCoinsUserId(isEditingCoins ? null : u.id);
                                    }}
                                    title="Убрать или выдать монеты"
                                    className={`px-2 py-1 rounded font-bold text-[10px] transition ${
                                      isEditingCoins
                                        ? 'bg-[#ff6a1a] text-white'
                                        : 'bg-white/8 hover:bg-white/15 text-white/85'
                                    }`}
                                  >
                                    ±🪙
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => {
                                      setKickingUserId(null);
                                      setEditingCoinsUserId(null);
                                      setConfirmDeleteUserId(null);
                                      setConfirmResetUserId(isConfirmReset ? null : u.id);
                                    }}
                                    aria-label={`Обнулить аккаунт @${u.username}`}
                                    title="Полностью обнулить аккаунт"
                                    className={`p-1 rounded transition ${
                                      isConfirmReset
                                        ? 'bg-amber-500 text-[#11161d]'
                                        : 'bg-amber-500/15 hover:bg-amber-500/28 text-amber-300'
                                    }`}
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => {
                                      setKickingUserId(null);
                                      setEditingCoinsUserId(null);
                                      setConfirmResetUserId(null);
                                      setConfirmDeleteUserId(isConfirmDelete ? null : u.id);
                                    }}
                                    aria-label={`Удалить аккаунт @${u.username}`}
                                    title="Удалить аккаунт"
                                    className={`p-1 rounded transition ${
                                      isConfirmDelete
                                        ? 'bg-red-500 text-white'
                                        : 'bg-red-500/15 hover:bg-red-500/28 text-[#ff8b82]'
                                    }`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {isKicking && (
                            <div className="pt-1.5 border-t border-red-400/25 flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleKickPlayer(u.username, 'Кик от администратора', 0)}
                                className="h-6 px-2 rounded bg-red-500/25 hover:bg-red-500/40 text-red-100 font-bold text-[10px] transition"
                              >
                                Кик сейчас
                              </button>
                              <button
                                type="button"
                                onClick={() => handleKickPlayer(u.username, 'Нарушение правил (5 мин)', 5)}
                                className="h-6 px-2 rounded bg-red-500/25 hover:bg-red-500/40 text-red-100 font-bold text-[10px] transition"
                              >
                                5 мин
                              </button>
                              <button
                                type="button"
                                onClick={() => handleKickPlayer(u.username, 'Нарушение правил (30 мин)', 30)}
                                className="h-6 px-2 rounded bg-red-500/25 hover:bg-red-500/40 text-red-100 font-bold text-[10px] transition"
                              >
                                30 мин
                              </button>
                              <button
                                type="button"
                                onClick={() => handleKickPlayer(u.username, 'Нарушение правил (24 ч)', 1440)}
                                className="h-6 px-2 rounded bg-red-500 hover:bg-red-400 text-white font-bold text-[10px] transition"
                              >
                                24 ч
                              </button>
                            </div>
                          )}

                          {isOwner && isEditingCoins && (
                            <div className="pt-1.5 border-t border-white/8 flex flex-wrap items-center gap-1.5">
                              <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={999999999}
                                value={playerCoinsAmt}
                                onChange={(e) => setPlayerCoinsAmt(e.target.value)}
                                placeholder="Сумма"
                                className="flex-1 min-w-[84px] h-7 px-2 rounded bg-[#1a222d] border border-white/12 focus:border-[#ff6a1a] outline-none text-[11px] text-white font-mono-num"
                              />
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleAdjustPlayerCoins(u, 'remove')}
                                className="h-7 px-2 rounded bg-red-500/22 hover:bg-red-500/35 border border-red-400/35 text-[#ff938b] font-bold text-[10px] transition"
                              >
                                − Убрать
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleAdjustPlayerCoins(u, 'add')}
                                className="h-7 px-2 rounded bg-emerald-500/22 hover:bg-emerald-500/35 border border-emerald-400/35 text-emerald-300 font-bold text-[10px] transition"
                              >
                                + Дать
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleAdjustPlayerCoins(u, 'set')}
                                className="h-7 px-2 rounded bg-white/8 hover:bg-white/16 text-white/80 font-bold text-[10px] transition"
                              >
                                Обнулить
                              </button>
                            </div>
                          )}

                          {isOwner && isConfirmReset && (
                            <div className="pt-1.5 border-t border-amber-400/25 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-amber-300">
                                Полностью обнулить @{u.username}?
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleFullResetAccount(u.username, u.id)}
                                  className="h-6 px-2.5 rounded bg-amber-500 hover:bg-amber-400 text-[#11161d] font-extrabold text-[10px] transition"
                                >
                                  {isBusy ? '...' : 'Обнулить'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => setConfirmResetUserId(null)}
                                  className="h-6 px-2 rounded bg-white/10 hover:bg-white/18 text-white/80 font-semibold text-[10px] transition"
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          )}

                          {isOwner && isConfirmDelete && (
                            <div className="pt-1.5 border-t border-red-400/25 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-[#ff8b82]">
                                Удалить @{u.username} навсегда?
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleDeleteAccount(u)}
                                  className="h-6 px-2.5 rounded bg-red-500 hover:bg-red-400 text-white font-bold text-[10px] transition"
                                >
                                  {isBusy ? '...' : 'Удалить'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => setConfirmDeleteUserId(null)}
                                  className="h-6 px-2 rounded bg-white/10 hover:bg-white/18 text-white/80 font-semibold text-[10px] transition"
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Admin Login Audit Log — Кто заходил в админку */}
              <div className="rounded-xl bg-[#1a222d] border border-sky-400/25 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <History className="w-4 h-4 text-sky-400" />
                    Кто заходил в админку
                  </div>
                  <button
                    type="button"
                    disabled={adminDataLoading}
                    onClick={() => loadAdminPanelData()}
                    className="h-7 px-2 rounded-lg bg-white/8 hover:bg-white/14 text-white/80 text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${adminDataLoading ? 'animate-spin' : ''}`} />
                    Обновить
                  </button>
                </div>

                {adminLogs.length === 0 ? (
                  <div className="text-[11px] text-white/45">Пока нет записей входов.</div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto mobile-scroll pr-0.5">
                    {adminLogs.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-2 text-[11px] bg-[#121820] rounded-lg px-2.5 py-1.5 border border-white/6"
                      >
                        <div className="min-w-0 truncate">
                          <span className="font-bold text-white">{entry.username}</span>
                          <span className="text-white/45"> · {entry.device}</span>
                        </div>
                        <span className="font-mono-num text-[10px] text-white/55 shrink-0">
                          {formatAdminTime(entry.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleAdminLogout}
                className="w-full h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/75 font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/8 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Выйти из админ-панели (сбросить пароль)
              </button>
            </div>
          )}
        </div>

        {/* Game Creators & Team Credits */}
        <div className="mt-4 rounded-xl bg-[#141921] border border-white/10 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-display font-extrabold text-sm text-white">
              Кто создал BLACK STANT
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff8b4a]">
              Команда
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-[#1d2530] border border-[#ffd34d]/35 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Crown className="w-4 h-4 text-[#ffd34d] shrink-0" />
                <span className="text-xs font-extrabold text-white truncate">BLACKDA4K</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#ffd34d]/18 text-[#ffd34d] text-[10px] font-extrabold shrink-0">
                Создатель
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-lg bg-[#1b222c] border border-white/8 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white truncate">Shampyr (shampyp)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 text-right shrink-0">
                Тестер · Модератор · Помощник
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-lg bg-[#1b222c] border border-white/8 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-xs font-bold text-white truncate">StantF1</span>
              </div>
              <span className="text-[10px] font-bold text-sky-300 text-right shrink-0">
                Тестер · Помощник
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-lg bg-[#1b222c] border border-white/8 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="text-xs font-bold text-white truncate">BMX_PIDAR (BMXER_PIDOR)</span>
              </div>
              <span className="text-[10px] font-bold text-violet-300 text-right shrink-0">
                Тестер
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full h-11 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-bold text-sm border border-white/10 transition"
        >
          Готово
        </button>
      </div>
    </div>
  );
}
