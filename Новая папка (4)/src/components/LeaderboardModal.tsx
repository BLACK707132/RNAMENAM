import { useCallback, useEffect, useState } from 'react';
import { X, Trophy, Crown, RefreshCw, UserPlus, WifiOff } from 'lucide-react';
import {
  fetchLeaderboard,
  type AuthUser,
  type LeaderboardEntry,
  type LeaderboardResponse,
} from '../utils/accountApi';
import { getScooter, type ScooterId } from '../data/scooters';

interface LeaderboardModalProps {
  user: AuthUser | null;
  localCoins: number;
  onOpenRegister: () => void;
  onRankLoaded?: (rank: number | null) => void;
  onClose: () => void;
}

function getScooterLabel(id: string): string {
  return getScooter(id as ScooterId).name;
}

export function LeaderboardModal({
  user,
  localCoins,
  onOpenRegister,
  onRankLoaded,
  onClose,
}: LeaderboardModalProps) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetchLeaderboard();
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setData(res.data);
    setFromCache(Boolean(res.fromCache));
    onRankLoaded?.(res.data.myRank);
  }, [onRankLoaded]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const entries: LeaderboardEntry[] = data?.entries ?? [];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3.5 sm:p-4 bg-[#0a0d12]/82 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#161c24]/98 border border-white/10 p-5 sm:p-6 shadow-2xl my-auto text-left">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#ffd34d]/15 border border-[#ffd34d]/35 flex items-center justify-center text-[#ffd34d] shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-black text-white leading-tight">
                Топ богатых
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                {data
                  ? `Игроков в рейтинге: ${data.totalRegistered.toLocaleString('ru-RU')}`
                  : 'Рейтинг игроков по монетам'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              aria-label="Обновить топ"
              className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть топ богатых"
              className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Guest registration banner */}
        {!user && (
          <div className="mb-4 rounded-xl bg-gradient-to-r from-[#ff6a1a]/18 to-[#ffd34d]/12 border border-[#ff6a1a]/35 p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white">
                Тебя ещё нет в топе!
              </div>
              <div className="text-[11px] text-white/70 mt-0.5">
                Создай юз с паролем — твои 🪙 {Math.floor(localCoins).toLocaleString('ru-RU')} сразу попадут сюда
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="h-9 px-3 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Создать юз
            </button>
          </div>
        )}

        {/* Logged-in player's current standing banner */}
        {user && data?.myEntry && (
          <div className="mb-3.5 rounded-xl bg-[#ff6a1a]/15 border border-[#ff6a1a]/40 px-3.5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono-num text-sm font-black text-[#ff8b4a] shrink-0">
                #{data.myEntry.rank}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-white truncate">
                  @{user.username}{' '}
                  <span className="text-[11px] font-semibold text-[#ff8b4a]">(ты)</span>
                </div>
                <div className="text-[11px] text-white/60 truncate">
                  {getScooterLabel(data.myEntry.curScooter)}
                </div>
              </div>
            </div>
            <div className="font-mono-num text-sm font-extrabold text-[#ffd34d] shrink-0">
              🪙 {Math.floor(data.myEntry.coins).toLocaleString('ru-RU')}
            </div>
          </div>
        )}

        {fromCache && (
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-300/90">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>Показан сохранённый топ (офлайн)</span>
          </div>
        )}

        {/* List */}
        <div className="max-h-[52dvh] overflow-y-auto mobile-scroll pr-0.5 space-y-2">
          {loading && entries.length === 0 ? (
            <div className="py-10 text-center text-sm text-white/55">Загружаем Топ богатых...</div>
          ) : error && entries.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#ff7b72]">{error}</div>
          ) : entries.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Trophy className="w-9 h-9 text-[#ffd34d]/60 mx-auto" />
              <div className="text-sm font-bold text-white">Пока никого нет</div>
              <div className="text-xs text-white/55">
                Зарегистрируйся первым и займи #1 место в BLACK STANT!
              </div>
            </div>
          ) : (
            entries.map((entry) => {
              const medal =
                entry.rank === 1
                  ? '🥇'
                  : entry.rank === 2
                    ? '🥈'
                    : entry.rank === 3
                      ? '🥉'
                      : null;
              const rowStyle =
                entry.rank === 1
                  ? 'bg-gradient-to-r from-[#ffd34d]/18 via-[#212936] to-[#1b222c] border-[#ffd34d]/45'
                  : entry.rank === 2
                    ? 'bg-gradient-to-r from-slate-300/12 via-[#1e2632] to-[#1b222c] border-slate-300/30'
                    : entry.rank === 3
                      ? 'bg-gradient-to-r from-amber-600/15 via-[#1e2632] to-[#1b222c] border-amber-500/35'
                      : entry.isMe
                        ? 'bg-[#ff6a1a]/12 border-[#ff6a1a]/40'
                        : 'bg-[#1b222c] border-white/8';

              return (
                <div
                  key={entry.id}
                  className={`rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-3 ${rowStyle}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 text-center shrink-0">
                      {medal ? (
                        <span className="text-lg leading-none">{medal}</span>
                      ) : (
                        <span className="font-mono-num text-xs font-bold text-white/55">
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {entry.clanTag && (
                          <span
                            className="text-[10px] font-extrabold px-1.5 py-0.5 rounded border shrink-0"
                            style={{
                              color: entry.clanColor || '#ff8b4a',
                              borderColor: `${entry.clanColor || '#ff8b4a'}66`,
                              backgroundColor: `${entry.clanColor || '#ff8b4a'}1a`,
                            }}
                          >
                            [{entry.clanTag}]
                          </span>
                        )}
                        <span className="font-display font-bold text-sm sm:text-base text-white truncate">
                          @{entry.username}
                        </span>
                        {entry.vip && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#ffd34d]/20 border border-[#ffd34d]/45 text-[#ffd34d] shrink-0">
                            VIP ×2
                          </span>
                        )}
                        {entry.isMe && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ff6a1a]/25 text-[#ffc599] shrink-0">
                            ТЫ
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-white/55 truncate">
                        {getScooterLabel(entry.curScooter)}
                        {entry.bestRun > 0
                          ? ` · Рекорд ${entry.bestRun.toLocaleString('ru-RU')}`
                          : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono-num text-sm sm:text-base font-extrabold text-[#ffd34d]">
                      🪙 {Math.floor(entry.coins).toLocaleString('ru-RU')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
