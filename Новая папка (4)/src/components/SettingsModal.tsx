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
} from 'lucide-react';
import {
  appendTransferHistory,
  createOfflineTransferCheck,
  formatWalletId,
  loadTransferHistory,
  loadWalletProfile,
  parseRecipientInput,
  type TransferRecord,
} from '../utils/transfers';
import { createAdminPromoCode } from '../utils/promos';
import { SCOOTERS, type ScooterId } from '../data/scooters';
import {
  adjustAdminUserCoins,
  clearAdminToken,
  deleteAdminUser,
  fetchAdminLogs,
  fetchAdminUsers,
  getStoredAdminToken,
  loginAdmin,
  resetAdminUser,
  setAdminUserVip,
  verifyStoredAdminToken,
  type AdminLoginLog,
  type AdminUserSummary,
  type AuthUser,
} from '../utils/accountApi';
import { sound } from '../utils/sound';

interface SettingsModalProps {
  muted: boolean;
  onToggleMute: () => void;
  totalPlayers: number;
  coins: number;
  vip: boolean;
  authUser: AuthUser | null;
  currentScooterId: ScooterId;
  ownedScooters: ScooterId[];
  ownedScootersCount: number;
  ownedHelmetsCount: number;
  ownedOutfitsCount: number;
  initialPayLink?: string;
  onAddCoins: (amount: number) => void;
  onRemoveCoins: (amount: number) => void;
  onResetCoins: () => void;
  onSetCoins: (amount: number) => void;
  onSetVip: (enabled: boolean) => void;
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
  totalPlayers,
  coins,
  vip,
  authUser,
  currentScooterId,
  ownedScooters,
  ownedScootersCount,
  ownedHelmetsCount,
  ownedOutfitsCount,
  initialPayLink = '',
  onAddCoins,
  onRemoveCoins,
  onResetCoins,
  onSetCoins,
  onSetVip,
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
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [authError, setAuthError] = useState('');
  const [customAmount, setCustomAmount] = useState('10000');
  const [grantFeedback, setGrantFeedback] = useState<{ text: string; kind: 'add' | 'remove' } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  // Admin player management (VIP, coins, account deletion) & login audit logs
  const [adminLogs, setAdminLogs] = useState<AdminLoginLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [vipTargetInput, setVipTargetInput] = useState('');
  const [vipMsg, setVipMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editingCoinsUserId, setEditingCoinsUserId] = useState<string | null>(null);
  const [playerCoinsAmt, setPlayerCoinsAmt] = useState('10000');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [confirmResetUserId, setConfirmResetUserId] = useState<string | null>(null);
  const [resetTargetInput, setResetTargetInput] = useState('');
  const [confirmResetInput, setConfirmResetInput] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  // Wallet summary for quick receive link access
  const [myWallet] = useState(() => loadWalletProfile());

  // Admin Offline Transfer state
  const [recipientInput, setRecipientInput] = useState(initialPayLink);
  const [transferAmount, setTransferAmount] = useState('10000');
  const [transferComment, setTransferComment] = useState('');
  const [lockToWallet, setLockToWallet] = useState(true);
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
  const [promoAmt, setPromoAmt] = useState('20000');
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

  const loadAdminPanelData = async () => {
    setAdminDataLoading(true);
    const [logsRes, usersRes] = await Promise.all([fetchAdminLogs(), fetchAdminUsers()]);
    setAdminDataLoading(false);
    if (logsRes.ok) setAdminLogs(logsRes.data);
    if (usersRes.ok) setAdminUsers(usersRes.data);
  };

  // Verify saved admin token on open so remembered admin opens immediately without password
  useEffect(() => {
    let active = true;
    if (!adminUnlocked) return;
    verifyStoredAdminToken().then((valid) => {
      if (!active) return;
      if (!valid) {
        setAdminUnlocked(false);
      } else {
        loadAdminPanelData();
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
      setAuthError('Обязательно введи оба пароля!');
      return;
    }
    setAdminLoggingIn(true);
    setAuthError('');
    const res = await loginAdmin(p1, p2, formatWalletId(myWallet.walletId));
    setAdminLoggingIn(false);
    if (res.ok) {
      setAdminUnlocked(true);
      setPass1('');
      setPass2('');
      setShowPass1(false);
      setShowPass2(false);
      loadAdminPanelData();
    } else {
      setAuthError(res.error);
    }
  };

  const handleAdminLogout = () => {
    clearAdminToken();
    setAdminUnlocked(false);
    setAdminLogs([]);
    setAdminUsers([]);
  };

  const handleToggleSelfVip = async () => {
    const next = !vip;
    onSetVip(next);
    sound.playBuy();
    if (authUser) {
      const res = await setAdminUserVip(authUser.username, next);
      if (res.ok) {
        setAdminUsers((prev) =>
          prev.map((u) => (u.id === res.data.id ? res.data : u))
        );
      }
    }
    setVipMsg({
      ok: true,
      text: next ? 'VIP ×2 включён для тебя!' : 'VIP ×2 отключён.',
    });
  };

  const handleSetPlayerVip = async (username: string, nextVip: boolean) => {
    const clean = username.trim().replace(/^@+/, '');
    if (!clean) {
      setVipMsg({ ok: false, text: 'Введи @юз игрока.' });
      return;
    }
    const res = await setAdminUserVip(clean, nextVip);
    if (!res.ok) {
      setVipMsg({ ok: false, text: res.error });
      return;
    }
    sound.playBuy();
    setAdminUsers((prev) => prev.map((u) => (u.id === res.data.id ? res.data : u)));
    if (authUser && res.data.username.toLowerCase() === authUser.username.toLowerCase()) {
      onSetVip(nextVip);
    }
    setVipMsg({
      ok: true,
      text: nextVip
        ? `Выдан VIP ×2 игроку @${res.data.username}!`
        : `VIP ×2 снят у @${res.data.username}.`,
    });
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
    if (!Number.isFinite(amount) || amount <= 0) return;
    const clamped = Math.min(10_000_000, Math.floor(amount));
    onAddCoins(clamped);
    showCoinFeedback(`+${clamped.toLocaleString('ru-RU')} монет начислено!`, 'add');
  };

  const handleDeductSelf = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const clamped = Math.min(999_999_999, Math.floor(amount));
    onRemoveCoins(clamped);
    showCoinFeedback(`−${clamped.toLocaleString('ru-RU')} монет убрано!`, 'remove');
  };

  const handleResetSelfCoins = () => {
    onResetCoins();
    showCoinFeedback('Твой баланс обнулён (0 🪙).', 'remove');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(customAmount.replace(/\s+/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    handleGrant(parsed);
  };

  const handleCustomDeduct = () => {
    const parsed = Number(customAmount.replace(/\s+/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    handleDeductSelf(parsed);
  };

  const handleAdjustPlayerCoins = async (
    targetUser: AdminUserSummary,
    mode: 'add' | 'remove' | 'set'
  ) => {
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

  const handleDeleteAccount = async (targetUser: AdminUserSummary) => {
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

  const parsedTxAmount = Math.floor(Number(transferAmount.replace(/\s+/g, '')) || 0);

  const handleAdminCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    if (parsedRecipient.kind === 'invalid' || parsedRecipient.kind === 'claim_code') {
      setTransferError('Вставь ссылку друга/бота, ID BS-XXXXXX или оставь пустым для любого.');
      return;
    }

    if (!Number.isFinite(parsedTxAmount) || parsedTxAmount < 1) {
      setTransferError('Введи сумму перевода (минимум 1 монета).');
      return;
    }

    const clamped = Math.min(50_000_000, parsedTxAmount);
    const targetWalletId =
      parsedRecipient.kind === 'wallet' && lockToWallet
        ? parsedRecipient.walletId
        : undefined;

    const created = createOfflineTransferCheck({
      amount: clamped,
      targetWalletId,
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

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Math.floor(Number(promoAmt.replace(/\s+/g, '')) || 0);
    if (!Number.isFinite(parsed) || parsed < 100) return;
    const created = createAdminPromoCode(parsed);
    sound.playBuy();
    setGeneratedPromo(created);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3.5 sm:p-4 bg-[#0a0d12]/80 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
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

        {/* Sound Toggle */}
        <div className="rounded-xl bg-[#1e2631] border border-white/8 p-3.5 mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/80 shrink-0">
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm font-bold text-white">Звуковые эффекты</div>
              <div className="text-xs text-white/55">{muted ? 'Выключены' : 'Включены'}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleMute}
            className={`h-9 px-4 rounded-xl font-bold text-xs transition ${
              muted
                ? 'bg-white/10 hover:bg-white/15 text-white/80'
                : 'bg-[#ff6a1a] hover:bg-[#ff7b33] text-white'
            }`}
          >
            {muted ? 'Выкл' : 'Вкл'}
          </button>
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
              {adminUnlocked ? 'Открыто' : adminOpen ? 'Скрыть' : 'Открыть'}
            </span>
          </button>

          {adminOpen && !adminUnlocked && (
            <form onSubmit={handleAdminLogin} className="mt-3.5 space-y-2.5">
              <p className="text-xs text-white/60">
                {initialPayLink
                  ? 'Войди в админ-панель, чтобы перевести монеты по этой ссылке:'
                  : 'Для входа обязательно введи оба пароля администратора:'}
              </p>
              <div>
                <label className="block text-xs text-white/65 mb-1">Пароль 1</label>
                <div className="relative">
                  <input
                    type={showPass1 ? 'text' : 'password'}
                    value={pass1}
                    onChange={(e) => {
                      setPass1(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Введи первый пароль"
                    autoComplete="off"
                    className="w-full h-10 pl-3 pr-10 rounded-xl bg-[#1d2530] border border-white/10 focus:border-[#ff6a1a] outline-none text-sm text-white font-mono-num"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass1((v) => !v)}
                    aria-label={showPass1 ? 'Скрыть первый пароль' : 'Показать первый пароль'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center text-white/55 hover:text-white hover:bg-white/10 transition"
                  >
                    {showPass1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/65 mb-1">Пароль 2</label>
                <div className="relative">
                  <input
                    type={showPass2 ? 'text' : 'password'}
                    value={pass2}
                    onChange={(e) => {
                      setPass2(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Введи второй пароль"
                    autoComplete="off"
                    className="w-full h-10 pl-3 pr-10 rounded-xl bg-[#1d2530] border border-white/10 focus:border-[#ff6a1a] outline-none text-sm text-white font-mono-num"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass2((v) => !v)}
                    aria-label={showPass2 ? 'Скрыть второй пароль' : 'Показать второй пароль'}
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
                После входа пароль запомнится — в следующий раз откроется сразу.
              </p>
            </form>
          )}

          {adminOpen && adminUnlocked && (
            <div className="mt-3.5 space-y-4 border-t border-white/8 pt-3.5">
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

              {/* Self coin grant & deduct controls */}
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

              {/* Admin: Select / Unlock ANY Scooter */}
              <div className="rounded-xl bg-[#1a222d] border border-[#ff6a1a]/30 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Bike className="w-4 h-4 text-[#ff8b4a]" />
                    Выбрать любой самокат
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
                                ? `Есть · ${sc.maxKmh} км/ч`
                                : `${sc.maxKmh} км/ч`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                          <div className="space-y-1">
                            <div className="text-emerald-300 font-semibold">
                              Получатель: {parsedRecipient.label}
                            </div>
                            <label className="flex items-center gap-1.5 text-white/60 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={lockToWallet}
                                onChange={(e) => setLockToWallet(e.target.checked)}
                                className="accent-emerald-400"
                              />
                              Только для этого ID
                            </label>
                          </div>
                        )}
                        {parsedRecipient.kind === 'bot_link' && (
                          <div className="text-sky-300 font-semibold truncate">
                            Ссылка распознана: {parsedRecipient.label}
                          </div>
                        )}
                        {parsedRecipient.kind === 'universal' && (
                          <span className="text-white/45">
                            Оставь пустым — чек сможет забрать любой игрок.
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

              {/* Admin Promo Code Generator (works offline for all players once each) */}
              <div className="rounded-xl bg-[#1a222d] border border-[#ff6a1a]/30 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Gift className="w-4 h-4 text-[#ff8b4a]" />
                    Создать промокод для всех
                  </div>
                  <span className="text-[10px] font-bold text-[#ffd34d]">BLACKDA4K = 20к</span>
                </div>

                <form onSubmit={handleCreatePromo} className="flex gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={100}
                    max={10000000}
                    value={promoAmt}
                    onChange={(e) => setPromoAmt(e.target.value)}
                    placeholder="Монет"
                    className="flex-1 h-9 px-3 rounded-lg bg-[#121820] border border-white/12 focus:border-[#ff6a1a] outline-none text-xs text-white font-mono-num"
                  />
                  <button
                    type="submit"
                    className="h-9 px-3.5 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-bold text-xs transition whitespace-nowrap"
                  >
                    Создать
                  </button>
                </form>

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
              </div>

              {/* Players Management: VIP x2, Remove/Add Coins, Delete Account */}
              <div className="rounded-xl bg-[#1a222d] border border-[#ffd34d]/35 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Crown className="w-4 h-4 text-[#ffd34d]" />
                    Игроки: VIP, монеты, удаление
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleSelfVip}
                    className={`h-7 px-2.5 rounded-lg font-bold text-[11px] transition ${
                      vip
                        ? 'bg-[#ffd34d] text-[#12161d] hover:bg-[#ffe074]'
                        : 'bg-white/10 hover:bg-white/16 text-white'
                    }`}
                  >
                    {vip ? '👑 У тебя VIP ×2' : 'Себе VIP'}
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSetPlayerVip(vipTargetInput, true);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={vipTargetInput}
                    onChange={(e) => {
                      setVipTargetInput(e.target.value);
                      setVipMsg(null);
                    }}
                    placeholder="@юз игрока"
                    className="flex-1 h-9 px-3 rounded-lg bg-[#121820] border border-white/12 focus:border-[#ffd34d] outline-none text-xs text-white placeholder:text-white/35"
                  />
                  <button
                    type="submit"
                    className="h-9 px-3 rounded-lg bg-[#ffd34d] hover:bg-[#ffe074] text-[#11161d] font-extrabold text-xs transition whitespace-nowrap"
                  >
                    Выдать VIP
                  </button>
                </form>

                {/* Full Account Reset by @юз */}
                <div className="rounded-lg bg-[#121820] border border-red-400/25 p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#ff938b]">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Обнулить аккаунт игрока (монеты, самокаты, VIP)
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
                </div>

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
                  <div className="pt-2 border-t border-white/8 space-y-1.5 max-h-56 overflow-y-auto mobile-scroll pr-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                      Зарегистрированные игроки ({adminUsers.length})
                    </div>
                    {adminUsers.map((u) => {
                      const isEditingCoins = editingCoinsUserId === u.id;
                      const isConfirmDelete = confirmDeleteUserId === u.id;
                      const isConfirmReset = confirmResetUserId === u.id;
                      const isBusy = busyUserId === u.id;
                      return (
                        <div
                          key={u.id}
                          className="text-[11px] bg-[#121820] rounded-lg px-2.5 py-2 border border-white/6 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="min-w-0 truncate">
                              <span className="font-bold text-white">@{u.username}</span>{' '}
                              <span className="font-mono-num text-[#ffd34d]/85">
                                🪙 {Math.floor(u.coins).toLocaleString('ru-RU')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSetPlayerVip(u.username, !u.vip)}
                                className={`px-2 py-1 rounded font-bold text-[10px] transition ${
                                  u.vip
                                    ? 'bg-[#ffd34d]/20 text-[#ffd34d] border border-[#ffd34d]/40 hover:bg-[#ffd34d]/30'
                                    : 'bg-white/8 hover:bg-white/15 text-white/80'
                                }`}
                              >
                                {u.vip ? '👑 VIP' : '+VIP'}
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
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
                            </div>
                          </div>

                          {isEditingCoins && (
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

                          {isConfirmReset && (
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

                          {isConfirmDelete && (
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
                    onClick={loadAdminPanelData}
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
