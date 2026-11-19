import { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Users,
  Crown,
  Plus,
  Send,
  LogOut,
  Trash2,
  UserMinus,
  RefreshCw,
  Shield,
  MessageSquare,
  Coins,
  UserPlus,
  Settings,
  Lock,
  Unlock,
  VolumeX,
  Volume2,
  Reply,
  Upload,
  Check,
  Mail,
  ArrowRightLeft,
} from 'lucide-react';
import {
  acceptClanInvite,
  cancelClanInvite,
  CLAN_CREATE_COST,
  createClan,
  declineClanInvite,
  deleteClan,
  deleteClanMessage,
  fetchClans,
  inviteToClan,
  joinClan,
  kickClanMember,
  leaveClan,
  muteClanMember,
  sendClanMessage,
  transferClanOwnership,
  updateClanSettings,
  type AuthUser,
  type ClanDetail,
  type ClanMessage,
  type ClanSummary,
  type PendingClanInvite,
} from '../utils/accountApi';
import {
  CLAN_AVATAR_PRESETS,
  ClanAvatar,
  resizeImageToAvatarDataUrl,
} from './ClanAvatar';
import { getScooter, type ScooterId } from '../data/scooters';
import { sound } from '../utils/sound';

interface ClansModalProps {
  user: AuthUser | null;
  coins: number;
  onCoinsChanged: (newCoins: number) => void;
  onSyncBeforeAction: () => Promise<void>;
  onOpenRegister: () => void;
  onClose: () => void;
}

const CLAN_COLORS = [
  '#ff6a1a',
  '#38bdf8',
  '#22c55e',
  '#ffd34d',
  '#a855f7',
  '#f43f5e',
];

const QUICK_CHAT_PHRASES = ['🔥', '👑', '⚡', 'Го катать!', '12 оклок!'];

const MUTE_OPTIONS = [
  { label: '5 мин', minutes: 5 },
  { label: '15 мин', minutes: 15 },
  { label: '1 час', minutes: 60 },
  { label: 'Навсегда', minutes: -1 },
];

type MainTab = 'my' | 'list' | 'create';
type MyClanSubTab = 'chat' | 'members' | 'settings';

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function formatMuteRemaining(mutedUntil: number): string {
  if (mutedUntil === -1) return 'навсегда';
  const diffMs = mutedUntil - Date.now();
  if (diffMs <= 0) return '';
  const mins = Math.max(1, Math.ceil(diffMs / 60_000));
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs} ч ${rem} мин` : `${hrs} ч`;
  }
  return `${mins} мин`;
}

function isMemberMuted(mutedUntil: number): boolean {
  return mutedUntil === -1 || mutedUntil > Date.now();
}

export function ClansModal({
  user,
  coins,
  onCoinsChanged,
  onSyncBeforeAction,
  onOpenRegister,
  onClose,
}: ClansModalProps) {
  const [clans, setClans] = useState<ClanSummary[]>([]);
  const [myClan, setMyClan] = useState<ClanDetail | null>(null);
  const [myInvites, setMyInvites] = useState<PendingClanInvite[]>([]);
  const [createCost, setCreateCost] = useState<number>(CLAN_CREATE_COST);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<MainTab>('list');
  const [subTab, setSubTab] = useState<MyClanSubTab>('chat');

  // Create clan form
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(CLAN_COLORS[0]);
  const [avatar, setAvatar] = useState('shield');
  const [inviteOnly, setInviteOnly] = useState(false);

  // Settings form (leader)
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState(CLAN_COLORS[0]);
  const [editAvatar, setEditAvatar] = useState('shield');
  const [editInviteOnly, setEditInviteOnly] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [confirmDeleteClan, setConfirmDeleteClan] = useState(false);

  // Member actions (leader)
  const [mutePickerMemberId, setMutePickerMemberId] = useState<string | null>(null);
  const [confirmTransferMemberId, setConfirmTransferMemberId] = useState<string | null>(null);

  // Chat state
  const [chatText, setChatText] = useState('');
  const [replyTo, setReplyTo] = useState<ClanMessage | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const prevMsgCountRef = useRef(0);
  const createFileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const syncSettingsFromClan = useCallback((clan: ClanDetail | null) => {
    if (!clan) return;
    setEditName(clan.name);
    setEditDesc(clan.description);
    setEditColor(clan.color);
    setEditAvatar(clan.avatar || 'shield');
    setEditInviteOnly(Boolean(clan.inviteOnly));
  }, []);

  const load = useCallback(
    async (opts?: { autoSwitch?: boolean; silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      const res = await fetchClans();
      if (!opts?.silent) setLoading(false);
      if (!res.ok) {
        if (!opts?.silent) setError(res.error);
        return;
      }
      setClans(res.data.clans);
      setMyClan(res.data.myClan);
      setMyInvites(res.data.myInvites);
      setCreateCost(res.data.createCost || CLAN_CREATE_COST);
      if (opts?.autoSwitch && res.data.myClan) {
        setTab('my');
        syncSettingsFromClan(res.data.myClan);
      } else if (!res.data.myClan && tab === 'my') {
        setTab('list');
      }
    },
    [syncSettingsFromClan, tab]
  );

  useEffect(() => {
    load({ autoSwitch: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync settings fields when switching to settings sub-tab
  useEffect(() => {
    if (subTab === 'settings' && myClan) {
      syncSettingsFromClan(myClan);
      setConfirmDeleteClan(false);
    }
  }, [subTab, myClan, syncSettingsFromClan]);

  // Live 3.5s polling while in My Clan chat or viewing modal
  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => {
      if (!busy) {
        load({ silent: true });
      }
    }, 3500);
    return () => window.clearInterval(interval);
  }, [user, busy, load]);

  // Auto-scroll chat to bottom only when new messages arrive
  useEffect(() => {
    const count = myClan?.messages.length ?? 0;
    if (tab === 'my' && subTab === 'chat' && count > prevMsgCountRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCountRef.current = count;
  }, [myClan?.messages.length, tab, subTab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const showNotice = (msg: string) => {
    setError('');
    setNotice(msg);
  };

  const handleAvatarFile = async (
    file: File | undefined,
    setter: (val: string) => void
  ) => {
    if (!file) return;
    setError('');
    try {
      const dataUrl = await resizeImageToAvatarDataUrl(file);
      setter(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить аватарку.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (coins < createCost) {
      setError(
        `Нужно 🪙 ${createCost.toLocaleString('ru-RU')} монет (не хватает ${(createCost - Math.floor(coins)).toLocaleString('ru-RU')}).`
      );
      return;
    }
    setBusy(true);
    await onSyncBeforeAction();
    const res = await createClan({
      name,
      tag,
      description,
      color,
      avatar,
      inviteOnly,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    sound.playBuy();
    onCoinsChanged(res.data.newCoins);
    setMyClan(res.data.clan);
    syncSettingsFromClan(res.data.clan);
    setName('');
    setTag('');
    setDescription('');
    setTab('my');
    setSubTab('chat');
    showNotice(`Клан [${res.data.clan.tag}] создан! Списано 🪙 ${createCost.toLocaleString('ru-RU')}.`);
    await load({ silent: true });
  };

  const handleJoin = async (clanId: string) => {
    setError('');
    setNotice('');
    setBusy(true);
    const res = await joinClan(clanId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    sound.playBuy();
    setMyClan(res.data);
    setTab('my');
    setSubTab('chat');
    showNotice(`Ты вступил в клан [${res.data.tag}] ${res.data.name}!`);
    await load({ silent: true });
  };

  const handleAcceptInvite = async (clanId: string) => {
    setError('');
    setNotice('');
    setBusy(true);
    const res = await acceptClanInvite(clanId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    sound.playBuy();
    setMyClan(res.data);
    setTab('my');
    setSubTab('chat');
    showNotice(`Приглашение принято! Добро пожаловать в [${res.data.tag}]!`);
    await load({ silent: true });
  };

  const handleDeclineInvite = async (clanId: string) => {
    setError('');
    setBusy(true);
    const res = await declineClanInvite(clanId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMyInvites((prev) => prev.filter((i) => i.clanId !== clanId));
    showNotice('Приглашение отклонено.');
  };

  const handleInvitePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myClan || !inviteUsername.trim()) return;
    setError('');
    setNotice('');
    setBusy(true);
    const res = await inviteToClan(myClan.id, inviteUsername.trim());
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    sound.playBuy();
    setMyClan(res.data);
    const sentTo = inviteUsername.trim().replace(/^@+/, '');
    setInviteUsername('');
    showNotice(`Приглашение отправлено игроку @${sentTo}!`);
  };

  const handleCancelInvite = async (userId: string) => {
    if (!myClan) return;
    setError('');
    setBusy(true);
    const res = await cancelClanInvite(myClan.id, userId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMyClan(res.data);
    showNotice('Приглашение отменено.');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myClan) return;
    setError('');
    setNotice('');
    setBusy(true);
    const res = await updateClanSettings(myClan.id, {
      name: editName,
      description: editDesc,
      color: editColor,
      avatar: editAvatar,
      inviteOnly: editInviteOnly,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    sound.playBuy();
    setMyClan(res.data);
    showNotice('Настройки клана сохранены!');
    await load({ silent: true });
  };

  const handleTransferOwnership = async (memberId: string, memberUsername: string) => {
    if (!myClan) return;
    setError('');
    setNotice('');
    setBusy(true);
    const res = await transferClanOwnership(myClan.id, memberId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    sound.playBuy();
    setMyClan(res.data);
    setConfirmTransferMemberId(null);
    if (subTab === 'settings') setSubTab('members');
    showNotice(`Владение кланом передано @${memberUsername}!`);
    await load({ silent: true });
  };

  const handleMuteMember = async (memberId: string, durationMinutes: number) => {
    if (!myClan) return;
    setError('');
    setNotice('');
    setBusy(true);
    const res = await muteClanMember(myClan.id, memberId, durationMinutes);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMyClan(res.data);
    setMutePickerMemberId(null);
    showNotice(durationMinutes === 0 ? 'Мут снят.' : 'Мут выдан.');
  };

  const handleLeave = async () => {
    setError('');
    setNotice('');
    setBusy(true);
    const res = await leaveClan();
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMyClan(null);
    setReplyTo(null);
    setTab('list');
    showNotice('Ты вышел из клана.');
    await load({ silent: true });
  };

  const handleDeleteClan = async () => {
    if (!myClan) return;
    setError('');
    setNotice('');
    setBusy(true);
    const res = await deleteClan(myClan.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMyClan(null);
    setConfirmDeleteClan(false);
    setReplyTo(null);
    setTab('list');
    showNotice('Клан удалён.');
    await load({ silent: true });
  };

  const handleKick = async (memberId: string) => {
    if (!myClan) return;
    setError('');
    setBusy(true);
    const res = await kickClanMember(myClan.id, memberId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMyClan(res.data);
    showNotice('Участник исключён из клана.');
    await load({ silent: true });
  };

  const handleSendChat = async (e?: React.FormEvent, quickText?: string) => {
    if (e) e.preventDefault();
    const payload = (quickText ?? chatText).trim();
    if (!myClan || !payload) return;
    setError('');
    setBusy(true);
    const res = await sendClanMessage(myClan.id, payload, replyTo?.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMyClan(res.data);
    if (!quickText) setChatText('');
    setReplyTo(null);
  };

  const handleDeleteMsg = async (msgId: string) => {
    if (!myClan) return;
    setError('');
    setBusy(true);
    const res = await deleteClanMessage(myClan.id, msgId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMyClan(res.data);
  };

  const myMuted = myClan ? isMemberMuted(myClan.myMutedUntil) : false;
  const canAffordCreate = Math.floor(coins) >= createCost;

  const renderAvatarPicker = (
    currentAvatar: string,
    currentColor: string,
    onSelect: (val: string) => void,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-bold text-white/65">Аватарка клана</label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-7 px-2.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/12 text-white text-[11px] font-bold flex items-center gap-1.5 transition"
        >
          <Upload className="w-3.5 h-3.5 text-[#ff8b4a]" />
          Загрузить фото
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleAvatarFile(e.target.files?.[0], onSelect);
            e.target.value = '';
          }}
        />
      </div>

      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#111720] border border-white/8">
        <ClanAvatar avatar={currentAvatar} color={currentColor} size="lg" />
        <div className="grid grid-cols-6 gap-1.5 flex-1">
          {CLAN_AVATAR_PRESETS.map((preset) => {
            const active = currentAvatar === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.label}
                onClick={() => onSelect(preset.id)}
                className={`h-8 rounded-lg flex items-center justify-center border transition ${
                  active
                    ? 'border-white bg-white/15 scale-105'
                    : 'border-white/8 bg-[#18202b] hover:bg-white/10'
                }`}
              >
                <ClanAvatar
                  avatar={preset.id}
                  color={currentColor}
                  size="sm"
                  className="!w-6 !h-6 !border-0 !bg-transparent"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-[#0a0d12]/82 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#161c24]/98 border border-white/10 p-4 sm:p-5 shadow-2xl my-auto text-left">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#ff6a1a]/20 border border-[#ff6a1a]/40 flex items-center justify-center text-[#ff8b4a] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-black text-white leading-tight">Кланы</h2>
              <p className="text-[11px] text-white/55 truncate">
                {myClan
                  ? `Твой клан: [${myClan.tag}] ${myClan.name}`
                  : 'Вступай по приглашению или создай свой'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              aria-label="Обновить кланы"
              className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/75 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть кланы"
              className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Account required banner */}
        {!user && (
          <div className="rounded-xl bg-[#ff6a1a]/14 border border-[#ff6a1a]/35 p-3 mb-3 flex items-center justify-between gap-2.5">
            <div className="text-xs text-white/90 leading-snug">
              Чтобы вступать в кланы, принимать приглашения и писать в чат — войди по <b className="text-[#ffb178]">@юзу</b>.
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="h-9 px-3 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-bold text-xs whitespace-nowrap shrink-0 transition"
            >
              Войти
            </button>
          </div>
        )}

        {/* Incoming Clan Invites Banner */}
        {user && myInvites.length > 0 && (
          <div className="rounded-xl bg-emerald-500/12 border border-emerald-400/35 p-3 mb-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-300">
              <Mail className="w-4 h-4 shrink-0" />
              Приглашения в клан ({myInvites.length})
            </div>
            <div className="space-y-1.5">
              {myInvites.map((inv) => (
                <div
                  key={inv.clanId}
                  className="rounded-lg bg-[#111720]/95 border border-white/10 p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ClanAvatar avatar={inv.clanAvatar} color={inv.clanColor} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="px-1.5 py-0.5 rounded font-mono-num font-black text-[10px] shrink-0"
                          style={{
                            background: `${inv.clanColor}24`,
                            color: inv.clanColor,
                          }}
                        >
                          [{inv.clanTag}]
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                          {inv.clanName}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/55 truncate">
                        Позвал @{inv.invitedBy} · {inv.memberCount} уч.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleAcceptInvite(inv.clanId)}
                      className="h-8 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#06150e] font-extrabold text-[11px] transition whitespace-nowrap"
                    >
                      Вступить
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDeclineInvite(inv.clanId)}
                      aria-label="Отклонить приглашение"
                      className="h-8 w-8 rounded-lg bg-white/8 hover:bg-white/15 text-white/70 flex items-center justify-center transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#10151c] border border-white/8 mb-3">
          <button
            type="button"
            onClick={() => {
              setTab('list');
              setError('');
              setNotice('');
            }}
            className={`h-9 rounded-lg font-bold text-xs transition whitespace-nowrap ${
              tab === 'list'
                ? 'bg-[#ff6a1a] text-white'
                : 'text-white/65 hover:text-white hover:bg-white/5'
            }`}
          >
            Топ ({clans.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('my');
              setError('');
              setNotice('');
            }}
            className={`h-9 rounded-lg font-bold text-xs transition whitespace-nowrap ${
              tab === 'my'
                ? 'bg-[#ff6a1a] text-white'
                : 'text-white/65 hover:text-white hover:bg-white/5'
            }`}
          >
            {myClan ? `[${myClan.tag}]` : 'Мой клан'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('create');
              setError('');
              setNotice('');
            }}
            className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition whitespace-nowrap ${
              tab === 'create'
                ? 'bg-[#ff6a1a] text-white'
                : 'text-white/65 hover:text-white hover:bg-white/5'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Создать
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-xl bg-red-500/15 border border-red-400/35 px-3 py-2 text-xs font-semibold text-[#ff938b]">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-3 rounded-xl bg-emerald-500/15 border border-emerald-400/35 px-3 py-2 text-xs font-semibold text-emerald-300">
            {notice}
          </div>
        )}

        {/* TAB 1: TOP CLANS LIST */}
        {tab === 'list' && (
          <div className="space-y-2 max-h-[55dvh] overflow-y-auto mobile-scroll pr-0.5">
            {loading ? (
              <div className="py-10 text-center text-xs text-white/55">Загружаем кланы...</div>
            ) : clans.length === 0 ? (
              <div className="rounded-xl bg-[#1c2430] border border-white/8 p-6 text-center space-y-2.5">
                <Shield className="w-8 h-8 text-[#ff8b4a] mx-auto" />
                <div className="text-sm font-bold text-white">Пока нет ни одного клана</div>
                <p className="text-xs text-white/55">
                  Собери 🪙 {createCost.toLocaleString('ru-RU')} монет и создай первый клан!
                </p>
                <button
                  type="button"
                  onClick={() => setTab('create')}
                  className="h-9 px-4 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-bold text-xs transition"
                >
                  Создать клан
                </button>
              </div>
            ) : (
              clans.map((c, idx) => (
                <div
                  key={c.id}
                  className={`rounded-xl p-3 border transition ${
                    c.isMember
                      ? 'bg-[#202a38] border-[#ff6a1a]/50'
                      : 'bg-[#1a222d] border-white/8'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <ClanAvatar avatar={c.avatar} color={c.color} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono-num text-[11px] font-black text-white/45">
                            #{idx + 1}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded font-mono-num font-black text-[11px] border"
                            style={{
                              background: `${c.color}22`,
                              borderColor: `${c.color}66`,
                              color: c.color,
                            }}
                          >
                            [{c.tag}]
                          </span>
                          <span className="font-bold text-sm text-white truncate">{c.name}</span>
                          {c.inviteOnly && (
                            <Lock
                              className="w-3.5 h-3.5 text-amber-300/80 shrink-0"
                              aria-label="Только по приглашениям"
                            />
                          )}
                        </div>
                        {c.description && (
                          <p className="text-[11px] text-white/60 mt-1 line-clamp-2">
                            {c.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/55 font-mono-num flex-wrap">
                          <span className="text-[#ffd34d] font-bold flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            {Math.floor(c.totalCoins).toLocaleString('ru-RU')}
                          </span>
                          <span>👥 {c.memberCount}/30</span>
                          <span className="truncate">👑 @{c.leaderUsername}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {c.isMember ? (
                        <button
                          type="button"
                          onClick={() => setTab('my')}
                          className="h-9 px-3 rounded-lg bg-[#ff6a1a]/22 border border-[#ff6a1a]/45 text-[#ffb178] font-bold text-xs whitespace-nowrap"
                        >
                          Твой
                        </button>
                      ) : c.isInvited ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleAcceptInvite(c.id)}
                          className="h-9 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#06150e] font-extrabold text-xs transition whitespace-nowrap"
                        >
                          Принять
                        </button>
                      ) : c.inviteOnly ? (
                        <span className="h-9 px-2.5 rounded-lg bg-white/5 border border-white/10 text-white/45 font-bold text-[11px] inline-flex items-center gap-1 whitespace-nowrap">
                          <Lock className="w-3 h-3" />
                          Приглас.
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy || !user}
                          onClick={() => handleJoin(c.id)}
                          className="h-9 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/32 disabled:opacity-40 border border-emerald-400/35 text-emerald-200 font-bold text-xs transition whitespace-nowrap"
                        >
                          Вступить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: MY CLAN */}
        {tab === 'my' && (
          <div className="space-y-3">
            {!myClan ? (
              <div className="rounded-xl bg-[#1c2430] border border-white/8 p-6 text-center space-y-2.5">
                <Users className="w-8 h-8 text-white/40 mx-auto" />
                <div className="text-sm font-bold text-white">Ты пока не в клане</div>
                <p className="text-xs text-white/55">
                  Выбери открытый клан, прими приглашение от друга или создай свой за 🪙{' '}
                  {createCost.toLocaleString('ru-RU')}.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTab('list')}
                    className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/16 text-white font-bold text-xs transition"
                  >
                    Выбрать клан
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('create')}
                    className="h-9 px-3.5 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-bold text-xs transition"
                  >
                    Создать
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Clan Header Card */}
                <div className="rounded-xl bg-[#1a222d] border border-white/10 p-3">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ClanAvatar avatar={myClan.avatar} color={myClan.color} size="lg" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="px-1.5 py-0.5 rounded font-mono-num font-black text-xs border"
                            style={{
                              background: `${myClan.color}24`,
                              borderColor: `${myClan.color}66`,
                              color: myClan.color,
                            }}
                          >
                            [{myClan.tag}]
                          </span>
                          <span className="font-display font-extrabold text-base text-white truncate">
                            {myClan.name}
                          </span>
                          {myClan.inviteOnly ? (
                            <Lock className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5 text-emerald-400/70 shrink-0" />
                          )}
                        </div>
                        {myClan.description && (
                          <p className="text-[11px] text-white/60 mt-0.5 line-clamp-1">
                            {myClan.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-[11px] font-mono-num text-white/65">
                          <span className="text-[#ffd34d] font-bold">
                            🪙 {Math.floor(myClan.totalCoins).toLocaleString('ru-RU')}
                          </span>
                          <span>👥 {myClan.memberCount}/30</span>
                          <span>👑 @{myClan.leaderUsername}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleLeave}
                      title="Выйти из клана"
                      className="h-8 px-2.5 rounded-lg bg-white/8 hover:bg-red-500/20 hover:text-[#ff938b] text-white/75 text-[11px] font-bold flex items-center gap-1 shrink-0 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Выйти
                    </button>
                  </div>

                  {/* Sub-tabs: Chat / Members / Settings (Leader) */}
                  <div
                    className={`grid ${myClan.isLeader ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 mt-3 pt-2.5 border-t border-white/8`}
                  >
                    <button
                      type="button"
                      onClick={() => setSubTab('chat')}
                      className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        subTab === 'chat'
                          ? 'bg-[#ff6a1a]/25 text-[#ffb178] border border-[#ff6a1a]/50'
                          : 'bg-[#121820] text-white/65 hover:text-white border border-white/6'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Чат
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubTab('members')}
                      className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        subTab === 'members'
                          ? 'bg-[#ff6a1a]/25 text-[#ffb178] border border-[#ff6a1a]/50'
                          : 'bg-[#121820] text-white/65 hover:text-white border border-white/6'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Состав ({myClan.members.length})
                    </button>
                    {myClan.isLeader && (
                      <button
                        type="button"
                        onClick={() => setSubTab('settings')}
                        className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          subTab === 'settings'
                            ? 'bg-[#ff6a1a]/25 text-[#ffb178] border border-[#ff6a1a]/50'
                            : 'bg-[#121820] text-white/65 hover:text-white border border-white/6'
                        }`}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Настройки
                      </button>
                    )}
                  </div>
                </div>

                {/* SUB-TAB 1: UPGRADED CLAN CHAT */}
                {subTab === 'chat' && (
                  <div className="rounded-xl bg-[#121820] border border-white/10 p-3 flex flex-col gap-2">
                    {/* Messages feed */}
                    <div className="space-y-2 h-[34dvh] min-h-[190px] max-h-[290px] overflow-y-auto mobile-scroll pr-1">
                      {myClan.messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-xs text-white/40 gap-1">
                          <MessageSquare className="w-6 h-6 text-white/25" />
                          <div>Чат пуст — напиши первое сообщение!</div>
                        </div>
                      ) : (
                        myClan.messages.map((m) => {
                          if (m.system) {
                            return (
                              <div key={m.id} className="flex justify-center my-1">
                                <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-[10px] text-white/60 text-center max-w-[90%]">
                                  {m.text}
                                </div>
                              </div>
                            );
                          }

                          const isMine = user && m.userId === user.id;
                          const isAuthorLeader = m.userId === myClan.leaderId;
                          const authorMember = myClan.members.find((x) => x.id === m.userId);
                          const canDelete = myClan.isLeader || isMine;

                          return (
                            <div
                              key={m.id}
                              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[86%] rounded-xl px-3 py-2 border ${
                                  isMine
                                    ? 'bg-[#ff6a1a]/22 border-[#ff6a1a]/45 text-white'
                                    : 'bg-[#1a222d] border-white/8 text-white/95'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <div className="flex items-center gap-1 min-w-0">
                                    {isAuthorLeader && (
                                      <Crown className="w-3 h-3 text-[#ffd34d] shrink-0" />
                                    )}
                                    <span
                                      className={`text-[11px] font-extrabold truncate ${
                                        isMine ? 'text-[#ffc399]' : 'text-[#ff8b4a]'
                                      }`}
                                    >
                                      @{m.username}
                                    </span>
                                    {authorMember?.vip && (
                                      <span className="px-1 rounded bg-[#ffd34d]/20 text-[#ffd34d] text-[9px] font-black">
                                        VIP
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-mono-num text-[9px] text-white/40 shrink-0">
                                    {formatTime(m.timestamp)}
                                  </span>
                                </div>

                                {m.replyTo && (
                                  <div className="mb-1.5 pl-2 border-l-2 border-[#ff8b4a]/70 bg-black/25 rounded-r py-1 pr-2">
                                    <div className="text-[10px] font-bold text-[#ffb178] truncate">
                                      @{m.replyTo.username}
                                    </div>
                                    <div className="text-[10px] text-white/60 truncate">
                                      {m.replyTo.text}
                                    </div>
                                  </div>
                                )}

                                <div className="text-xs leading-snug break-words whitespace-pre-wrap">
                                  {m.text}
                                </div>

                                <div className="flex items-center justify-end gap-2 mt-1">
                                  {!myMuted && (
                                    <button
                                      type="button"
                                      onClick={() => setReplyTo(m)}
                                      className="text-[10px] text-white/45 hover:text-white flex items-center gap-0.5 transition"
                                    >
                                      <Reply className="w-3 h-3" />
                                      Ответить
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => handleDeleteMsg(m.id)}
                                      aria-label="Удалить сообщение"
                                      className="text-[10px] text-white/40 hover:text-[#ff8b82] flex items-center gap-0.5 transition"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Muted Banner or Chat Composer */}
                    {myMuted ? (
                      <div className="rounded-xl bg-red-500/15 border border-red-400/35 px-3 py-2.5 flex items-center gap-2 text-xs text-[#ff938b] font-bold">
                        <VolumeX className="w-4 h-4 shrink-0" />
                        <span>
                          Тебе выдан мут в чате ({formatMuteRemaining(myClan.myMutedUntil)}).
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-1 border-t border-white/8">
                        {/* Reply preview bar */}
                        {replyTo && (
                          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#1a222d] border-l-2 border-[#ff6a1a] text-[11px]">
                            <div className="min-w-0">
                              <span className="font-bold text-[#ffb178]">
                                Ответ @{replyTo.username}:
                              </span>{' '}
                              <span className="text-white/65 truncate">{replyTo.text}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReplyTo(null)}
                              aria-label="Отменить ответ"
                              className="text-white/50 hover:text-white shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Quick phrases */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                          {QUICK_CHAT_PHRASES.map((phrase) => (
                            <button
                              key={phrase}
                              type="button"
                              disabled={busy}
                              onClick={() => handleSendChat(undefined, phrase)}
                              className="h-7 px-2.5 rounded-lg bg-white/6 hover:bg-white/12 border border-white/8 text-[11px] font-bold text-white/85 whitespace-nowrap shrink-0 transition"
                            >
                              {phrase}
                            </button>
                          ))}
                        </div>

                        {/* Text input + Send */}
                        <form onSubmit={(e) => handleSendChat(e)} className="flex gap-1.5">
                          <div className="relative flex-1 min-w-0">
                            <input
                              type="text"
                              maxLength={240}
                              value={chatText}
                              onChange={(e) => setChatText(e.target.value)}
                              placeholder="Написать в чат клана..."
                              className="w-full h-10 pl-3 pr-12 rounded-xl bg-[#1a222d] border border-white/12 focus:border-[#ff6a1a] outline-none text-xs text-white placeholder:text-white/35"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono-num text-[9px] text-white/35 pointer-events-none">
                              {chatText.length}/240
                            </span>
                          </div>
                          <button
                            type="submit"
                            disabled={busy || !chatText.trim()}
                            aria-label="Отправить"
                            className="h-10 w-10 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* SUB-TAB 2: MEMBERS (with Mute, Transfer Ownership, Kick) */}
                {subTab === 'members' && (
                  <div className="rounded-xl bg-[#1a222d] border border-white/8 p-3 space-y-2 max-h-[42dvh] overflow-y-auto mobile-scroll">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                        Участники ({myClan.members.length}/30)
                      </span>
                      {myClan.isLeader && (
                        <button
                          type="button"
                          onClick={() => setSubTab('settings')}
                          className="text-[11px] font-bold text-[#ff8b4a] hover:text-[#ffb178] flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Пригласить
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {myClan.members.map((m) => {
                        const sc = getScooter(m.curScooter as ScooterId);
                        const mutedNow = isMemberMuted(m.mutedUntil);
                        const showMutePicker = mutePickerMemberId === m.id;
                        const showTransferConfirm = confirmTransferMemberId === m.id;

                        return (
                          <div
                            key={m.id}
                            className="rounded-lg bg-[#121820] border border-white/6 px-2.5 py-2 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {m.isLeader && (
                                    <Crown className="w-3.5 h-3.5 text-[#ffd34d] shrink-0" />
                                  )}
                                  <span className="text-xs font-bold text-white truncate">
                                    @{m.username}
                                  </span>
                                  {m.vip && (
                                    <span className="px-1 rounded bg-[#ffd34d]/20 text-[#ffd34d] text-[9px] font-black">
                                      VIP
                                    </span>
                                  )}
                                  {mutedNow && (
                                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-[#ff938b] text-[9px] font-bold flex items-center gap-0.5">
                                      <VolumeX className="w-2.5 h-2.5" />
                                      Мут ({formatMuteRemaining(m.mutedUntil)})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-white/50 font-mono-num truncate">
                                  {sc.name} · 🪙 {Math.floor(m.coins).toLocaleString('ru-RU')}
                                </div>
                              </div>

                              {myClan.isLeader && !m.isLeader && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {
                                      setConfirmTransferMemberId(null);
                                      if (mutedNow) {
                                        handleMuteMember(m.id, 0);
                                      } else {
                                        setMutePickerMemberId(showMutePicker ? null : m.id);
                                      }
                                    }}
                                    title={mutedNow ? 'Снять мут' : 'Выдать мут'}
                                    className={`h-7 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                                      mutedNow
                                        ? 'bg-emerald-500/20 hover:bg-emerald-500/32 text-emerald-300'
                                        : showMutePicker
                                          ? 'bg-amber-500 text-[#11161d]'
                                          : 'bg-amber-500/15 hover:bg-amber-500/28 text-amber-300'
                                    }`}
                                  >
                                    {mutedNow ? (
                                      <>
                                        <Volume2 className="w-3 h-3" />
                                        Размут
                                      </>
                                    ) : (
                                      <>
                                        <VolumeX className="w-3 h-3" />
                                        Мут
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {
                                      setMutePickerMemberId(null);
                                      setConfirmTransferMemberId(showTransferConfirm ? null : m.id);
                                    }}
                                    title="Передать владение кланом"
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition ${
                                      showTransferConfirm
                                        ? 'bg-[#ffd34d] text-[#11161d]'
                                        : 'bg-[#ffd34d]/15 hover:bg-[#ffd34d]/28 text-[#ffd34d]'
                                    }`}
                                  >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleKick(m.id)}
                                    title="Исключить из клана"
                                    className="h-7 w-7 rounded-lg bg-red-500/15 hover:bg-red-500/28 text-[#ff8b82] flex items-center justify-center transition"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Inline Mute Duration Picker */}
                            {showMutePicker && (
                              <div className="pt-1.5 border-t border-white/8 flex items-center justify-between gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-amber-300">
                                  Мут @{m.username}:
                                </span>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {MUTE_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.label}
                                      type="button"
                                      disabled={busy}
                                      onClick={() => handleMuteMember(m.id, opt.minutes)}
                                      className="h-6 px-2 rounded bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/35 text-amber-200 font-bold text-[10px] transition"
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Inline Transfer Ownership Confirmation */}
                            {showTransferConfirm && (
                              <div className="pt-1.5 border-t border-[#ffd34d]/25 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-[#ffd34d]">
                                  Передать главу клана @{m.username}?
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleTransferOwnership(m.id, m.username)}
                                    className="h-6 px-2.5 rounded bg-[#ffd34d] hover:bg-[#ffe074] text-[#11161d] font-extrabold text-[10px] transition"
                                  >
                                    Передать
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setConfirmTransferMemberId(null)}
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
                  </div>
                )}

                {/* SUB-TAB 3: CLAN SETTINGS & INVITES (Leader only) */}
                {subTab === 'settings' && myClan.isLeader && (
                  <div className="space-y-3 max-h-[44dvh] overflow-y-auto mobile-scroll pr-0.5">
                    {/* Invite player block */}
                    <div className="rounded-xl bg-[#1a222d] border border-emerald-400/25 p-3 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <UserPlus className="w-4 h-4 text-emerald-400" />
                        Пригласить игрока по @юзу
                      </div>
                      <form onSubmit={handleInvitePlayer} className="flex gap-2">
                        <input
                          type="text"
                          value={inviteUsername}
                          onChange={(e) => setInviteUsername(e.target.value)}
                          placeholder="@юз игрока"
                          className="flex-1 h-9 px-3 rounded-lg bg-[#121820] border border-white/12 focus:border-emerald-400 outline-none text-xs text-white placeholder:text-white/35"
                        />
                        <button
                          type="submit"
                          disabled={busy || !inviteUsername.trim()}
                          className="h-9 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 text-[#06150e] font-extrabold text-xs whitespace-nowrap transition"
                        >
                          Позвать
                        </button>
                      </form>

                      {myClan.invites.length > 0 && (
                        <div className="pt-2 border-t border-white/8 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                            Ожидают ответа ({myClan.invites.length})
                          </div>
                          {myClan.invites.map((inv) => (
                            <div
                              key={inv.userId}
                              className="flex items-center justify-between gap-2 rounded-lg bg-[#121820] px-2.5 py-1.5 border border-white/6 text-xs"
                            >
                              <span className="font-bold text-white/90 truncate">
                                @{inv.username}
                              </span>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleCancelInvite(inv.userId)}
                                className="text-[10px] font-bold text-[#ff8b82] hover:text-white px-2 py-0.5 rounded bg-red-500/15 transition"
                              >
                                Отменить
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Edit Clan Settings Form */}
                    <form
                      onSubmit={handleSaveSettings}
                      className="rounded-xl bg-[#1a222d] border border-white/10 p-3 space-y-3"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Settings className="w-4 h-4 text-[#ff8b4a]" />
                        Настройки клана
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-white/65 mb-1">
                          Название клана
                        </label>
                        <input
                          type="text"
                          minLength={3}
                          maxLength={20}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-[#121820] border border-white/12 focus:border-[#ff6a1a] outline-none text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-white/65 mb-1">
                          Описание
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Коротко о клане"
                          className="w-full h-9 px-3 rounded-lg bg-[#121820] border border-white/12 focus:border-[#ff6a1a] outline-none text-xs text-white"
                        />
                      </div>

                      {/* Color swatches */}
                      <div>
                        <label className="block text-[11px] font-bold text-white/65 mb-1.5">
                          Цвет клана
                        </label>
                        <div className="flex items-center gap-2">
                          {CLAN_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditColor(c)}
                              className={`w-7 h-7 rounded-lg border-2 transition ${
                                editColor === c ? 'border-white scale-110' : 'border-transparent opacity-70'
                              }`}
                              style={{ background: c }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Avatar picker */}
                      {renderAvatarPicker(editAvatar, editColor, setEditAvatar, editFileInputRef)}

                      {/* Invite-only toggle */}
                      <div className="flex items-center justify-between gap-2 rounded-lg bg-[#121820] border border-white/8 px-3 py-2">
                        <div>
                          <div className="text-xs font-bold text-white">Только по приглашениям</div>
                          <div className="text-[10px] text-white/50">
                            {editInviteOnly
                              ? 'Вход закрыт — только кого позовёшь'
                              : 'Открытый — может вступить любой'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditInviteOnly((v) => !v)}
                          className={`h-8 px-3 rounded-lg font-bold text-[11px] transition whitespace-nowrap ${
                            editInviteOnly
                              ? 'bg-amber-500 text-[#11161d]'
                              : 'bg-white/10 text-white/80 hover:bg-white/15'
                          }`}
                        >
                          {editInviteOnly ? 'Закрыт' : 'Открыт'}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full h-10 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Check className="w-4 h-4" />
                        Сохранить настройки
                      </button>
                    </form>

                    {/* Danger zone: Delete clan */}
                    <div className="rounded-xl bg-red-500/8 border border-red-400/25 p-3">
                      {!confirmDeleteClan ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmDeleteClan(true)}
                          className="w-full h-9 rounded-lg bg-red-500/18 hover:bg-red-500/30 text-[#ff938b] font-bold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Удалить клан навсегда
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#ff938b]">
                            Точно удалить [{myClan.tag}]?
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={handleDeleteClan}
                              className="h-8 px-3 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-xs transition"
                            >
                              Да, удалить
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setConfirmDeleteClan(false)}
                              className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/16 text-white/80 font-semibold text-xs transition"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 3: CREATE CLAN (COSTS 1,000,000 COINS) */}
        {tab === 'create' && (
          <form
            onSubmit={handleCreate}
            className="space-y-3 max-h-[56dvh] overflow-y-auto mobile-scroll pr-0.5"
          >
            {/* Price banner */}
            <div
              className={`rounded-xl p-3 border flex items-center justify-between gap-2 ${
                canAffordCreate
                  ? 'bg-[#ffd34d]/10 border-[#ffd34d]/35'
                  : 'bg-red-500/10 border-red-400/35'
              }`}
            >
              <div>
                <div className="text-[11px] font-bold text-white/75">Стоимость создания клана</div>
                <div className="font-mono-num text-base font-black text-[#ffd34d]">
                  🪙 {createCost.toLocaleString('ru-RU')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/55">Твой баланс</div>
                <div
                  className={`font-mono-num text-xs font-extrabold ${
                    canAffordCreate ? 'text-emerald-300' : 'text-[#ff938b]'
                  }`}
                >
                  🪙 {Math.floor(coins).toLocaleString('ru-RU')}
                </div>
              </div>
            </div>

            {myClan && (
              <div className="rounded-xl bg-amber-500/15 border border-amber-400/35 px-3 py-2 text-xs text-amber-200 font-semibold">
                Ты уже в клане [{myClan.tag}]. Сначала выйди из него, чтобы создать новый.
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-white/65 mb-1">
                  Название (3–20 симв.)
                </label>
                <input
                  type="text"
                  minLength={3}
                  maxLength={20}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="BLACK STANT CREW"
                  className="w-full h-10 px-3 rounded-xl bg-[#111720] border border-white/12 focus:border-[#ff6a1a] outline-none text-sm text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/65 mb-1">
                  Тег (2–5)
                </label>
                <input
                  type="text"
                  minLength={2}
                  maxLength={5}
                  required
                  value={tag}
                  onChange={(e) => setTag(e.target.value.toUpperCase())}
                  placeholder="BST"
                  className="w-full h-10 px-3 rounded-xl bg-[#111720] border border-white/12 focus:border-[#ff6a1a] outline-none text-sm font-mono-num font-black uppercase text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/65 mb-1">
                Описание (необязательно)
              </label>
              <input
                type="text"
                maxLength={80}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Катим на заднем без остановки!"
                className="w-full h-10 px-3 rounded-xl bg-[#111720] border border-white/12 focus:border-[#ff6a1a] outline-none text-sm text-white placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/65 mb-1.5">Цвет клана</label>
              <div className="flex items-center gap-2">
                {CLAN_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-lg border-2 transition ${
                      color === c ? 'border-white scale-110' : 'border-transparent opacity-70'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Avatar picker */}
            {renderAvatarPicker(avatar, color, setAvatar, createFileInputRef)}

            {/* Invite-only toggle */}
            <div className="flex items-center justify-between gap-2 rounded-xl bg-[#111720] border border-white/8 px-3 py-2.5">
              <div>
                <div className="text-xs font-bold text-white">Вход только по приглашению</div>
                <div className="text-[10px] text-white/50">
                  {inviteOnly
                    ? 'Игроки смогут вступить только по твоему приглашению'
                    : 'Любой игрок сможет вступить из списка кланов'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInviteOnly((v) => !v)}
                className={`h-8 px-3 rounded-lg font-bold text-[11px] transition whitespace-nowrap ${
                  inviteOnly
                    ? 'bg-amber-500 text-[#11161d]'
                    : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
              >
                {inviteOnly ? 'По приглас.' : 'Открытый'}
              </button>
            </div>

            <button
              type="submit"
              disabled={busy || !user || Boolean(myClan) || !canAffordCreate}
              className="w-full h-11 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-45 text-white font-display font-bold text-sm transition"
            >
              {busy
                ? 'Создаём...'
                : canAffordCreate
                  ? `Создать клан за 🪙 ${createCost.toLocaleString('ru-RU')}`
                  : `Нужно 🪙 ${createCost.toLocaleString('ru-RU')}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
