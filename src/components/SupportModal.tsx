import { useCallback, useEffect, useState } from 'react';
import {
  X,
  Bug,
  HelpCircle,
  Lightbulb,
  Send,
  RefreshCw,
  ShieldCheck,
  Crown,
  CheckCircle2,
  Clock,
  MessageSquare,
} from 'lucide-react';
import {
  fetchMyBugTickets,
  fetchSupportStatus,
  submitBugTicket,
  type AuthUser,
  type BugTicket,
  type OnlineAdminInfo,
} from '../utils/accountApi';
import { loadWalletProfile } from '../utils/transfers';

interface SupportModalProps {
  authUser: AuthUser | null;
  currentScooterName: string;
  onClose: () => void;
}

function formatTimeShort(ts: number): string {
  try {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

export function SupportModal({ authUser, currentScooterName, onClose }: SupportModalProps) {
  const [walletId] = useState(() => loadWalletProfile().walletId);
  const [staff, setStaff] = useState<OnlineAdminInfo[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [tickets, setTickets] = useState<BugTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<'bug' | 'help' | 'idea'>('bug');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [status, myTickets] = await Promise.all([
      fetchSupportStatus(),
      fetchMyBugTickets(walletId),
    ]);
    setStaff(status.staff);
    setOnlineCount(status.onlineCount);
    setTickets(myTickets);
    setLoading(false);
  }, [walletId]);

  useEffect(() => {
    loadAll();
    const timer = window.setInterval(() => {
      fetchSupportStatus().then((st) => {
        setStaff(st.staff);
        setOnlineCount(st.onlineCount);
      });
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [loadAll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (clean.length < 4) {
      setFeedback({ kind: 'err', msg: 'Опиши баг или вопрос подробнее (минимум 4 символа).' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    const res = await submitBugTicket({
      category,
      text: clean,
      scooter: currentScooterName,
      clientId: walletId,
      guestName: authUser ? `@${authUser.username}` : `Гость (${walletId.slice(-4)})`,
    });
    setSubmitting(false);
    if (!res.ok) {
      setFeedback({ kind: 'err', msg: res.error });
      return;
    }
    setText('');
    setTickets((prev) => [res.data, ...prev.filter((t) => t.id !== res.data.id)]);
    setFeedback({
      kind: 'ok',
      msg: 'Обращение отправлено админам! Ответ появится прямо здесь.',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3.5 sm:p-4 bg-[#0a0d12]/82 backdrop-blur-[3px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#161c24]/98 border border-white/10 p-4 sm:p-6 shadow-2xl my-auto max-h-[92dvh] overflow-y-auto mobile-scroll">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/18 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <Bug className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-white leading-tight truncate">
                Поддержка и Баги
              </h2>
              <p className="text-[11px] text-white/55">
                Админы помогут и ответят прямо в игре
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={loadAll}
              disabled={loading}
              aria-label="Обновить"
              className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/75 flex items-center justify-center transition disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/75 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Online Admins Section */}
        <div className="rounded-xl bg-[#1d2530] border border-emerald-400/25 p-3.5 mb-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  onlineCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-white/25'
                }`}
              />
              <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                Админы в сети
              </span>
            </div>
            <span
              className={`text-[11px] font-bold font-mono-num px-2 py-0.5 rounded-md ${
                onlineCount > 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                  : 'bg-white/5 text-white/50 border border-white/10'
              }`}
            >
              Онлайн: {onlineCount} / {staff.length || 4}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {staff.map((adm) => (
              <div
                key={adm.id}
                className={`rounded-lg px-2.5 py-2 border flex items-center justify-between sm:flex-col sm:items-start gap-1 ${
                  adm.online
                    ? 'bg-emerald-500/12 border-emerald-400/40'
                    : 'bg-[#141a22] border-white/8'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {adm.role === 'owner' ? (
                    <Crown className="w-3.5 h-3.5 text-[#ffd34d] shrink-0" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  )}
                  <span className="text-xs font-extrabold text-white truncate">
                    {adm.displayName}
                  </span>
                </div>
                <div className="flex items-center justify-between w-full gap-1.5">
                  <span className="text-[10px] text-white/55 truncate">
                    {adm.role === 'owner'
                      ? 'Главный'
                      : adm.role === 'moderator'
                        ? 'Модератор'
                        : adm.role === 'helper'
                          ? 'Помощник'
                          : 'Тестер'}
                  </span>
                  <span
                    className={`text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                      adm.online ? 'text-emerald-300' : 'text-white/38'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        adm.online ? 'bg-emerald-400' : 'bg-white/25'
                      }`}
                    />
                    {adm.online ? 'В сети' : 'Офлайн'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report a Bug / Ask Admin Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-[#1b222c] border border-white/10 p-3.5 mb-4"
        >
          <div className="text-xs font-extrabold uppercase tracking-wider text-white/85 mb-2.5">
            Написать админам (баг / помощь)
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-2.5">
            <button
              type="button"
              onClick={() => setCategory('bug')}
              className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition ${
                category === 'bug'
                  ? 'bg-red-500/25 border-red-400/55 text-red-200'
                  : 'bg-[#12171f] border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              Баг
            </button>
            <button
              type="button"
              onClick={() => setCategory('help')}
              className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition ${
                category === 'help'
                  ? 'bg-sky-500/25 border-sky-400/55 text-sky-200'
                  : 'bg-[#12171f] border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Помощь
            </button>
            <button
              type="button"
              onClick={() => setCategory('idea')}
              className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition ${
                category === 'idea'
                  ? 'bg-amber-500/25 border-amber-400/55 text-amber-200'
                  : 'bg-[#12171f] border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Идея
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={400}
            rows={3}
            placeholder={
              category === 'bug'
                ? 'Опиши баг (на каком самокате и что случилось)...'
                : category === 'help'
                  ? 'Напиши свой вопрос, админы помогут...'
                  : 'Предложи идею для обновления BLACK STANT...'
            }
            className="w-full rounded-xl bg-[#12171f] border border-white/12 px-3 py-2 text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#ff6a1a] resize-none mb-2"
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-white/45 truncate">
              От: {authUser ? `@${authUser.username}` : 'Гость'} · {currentScooterName}
            </span>
            <button
              type="submit"
              disabled={submitting || text.trim().length < 4}
              className="h-9 px-4 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Отправка...' : 'Отправить'}
            </button>
          </div>

          {feedback && (
            <div
              className={`mt-2.5 rounded-lg px-3 py-2 text-xs font-semibold border ${
                feedback.kind === 'ok'
                  ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                  : 'bg-red-500/15 border-red-400/35 text-red-200'
              }`}
            >
              {feedback.msg}
            </div>
          )}
        </form>

        {/* Player's Tickets & Admin Replies */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-white/75 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#ff8b4a]" />
              Мои обращения ({tickets.length})
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="rounded-xl bg-[#1b222c]/70 border border-white/8 p-4 text-center text-xs text-white/50">
              У тебя пока нет обращений. Если нашёл баг — напиши выше, админы ответят прямо здесь!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-0.5 mobile-scroll">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl bg-[#1b222c] border border-white/10 p-3 text-left"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          t.category === 'bug'
                            ? 'bg-red-500/20 text-red-300'
                            : t.category === 'help'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {t.category === 'bug' ? 'Баг' : t.category === 'help' ? 'Помощь' : 'Идея'}
                      </span>
                      <span className="text-[10px] text-white/45 font-mono-num">
                        {formatTimeShort(t.createdAt)}
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                        t.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : t.status === 'in_progress'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-white/8 text-white/65'
                      }`}
                    >
                      {t.status === 'resolved' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Решено
                        </>
                      ) : t.status === 'in_progress' ? (
                        <>
                          <Clock className="w-3 h-3" /> В работе
                        </>
                      ) : (
                        'Открыт'
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-white/90 leading-relaxed break-words">{t.text}</p>

                  {t.replies.length > 0 && (
                    <div className="mt-2.5 space-y-1.5 border-t border-white/8 pt-2">
                      {t.replies.map((rep) => (
                        <div
                          key={rep.id}
                          className="rounded-lg bg-emerald-500/12 border border-emerald-400/28 px-2.5 py-2"
                        >
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-[11px] font-extrabold text-emerald-300">
                              {rep.adminRole === 'owner' ? '👑 ' : '🛡 '}
                              {rep.adminName}{' '}
                              <span className="font-normal text-emerald-200/70">
                                ({rep.adminRole === 'owner' ? 'Главный админ' : rep.adminRole === 'moderator' ? 'Модератор' : rep.adminRole === 'helper' ? 'Помощник' : 'Тестер'})
                              </span>
                            </span>
                            <span className="text-[10px] text-white/40 font-mono-num">
                              {formatTimeShort(rep.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-white/95 leading-snug break-words">
                            {rep.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Telegram Support Link */}
        <a
          href="https://t.me/durov0113"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-10 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/35 text-sky-200 font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <Send className="w-3.5 h-3.5 text-sky-300" />
          Написать напрямую в Telegram (@durov0113)
        </a>
      </div>
    </div>
  );
}
