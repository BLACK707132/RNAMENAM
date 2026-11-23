import { ArrowLeft, Crown, Coins, Send, CheckCircle2, UserPlus } from 'lucide-react';
import type { AuthUser } from '../utils/accountApi';

interface DonateModalProps {
  coins: number;
  vip: boolean;
  user: AuthUser | null;
  onOpenRegister: () => void;
  onClose: () => void;
}

interface CoinPack {
  id: string;
  amount: number;
  label: string;
  shortLabel: string;
  priceUsd: number;
  note: string;
  featured?: boolean;
}

const TELEGRAM_HANDLE = 'durov0113';

const COIN_PACKS: CoinPack[] = [
  {
    id: 'coins_10k',
    amount: 10000,
    label: '10 000 монет',
    shortLabel: '10К монет',
    priceUsd: 0.5,
    note: 'Старт на Kugoo G2',
  },
  {
    id: 'coins_50k',
    amount: 50000,
    label: '50 000 монет',
    shortLabel: '50К монет',
    priceUsd: 1,
    note: 'Хватит на Kugoo F3',
  },
  {
    id: 'coins_100k',
    amount: 100000,
    label: '100 000 монет',
    shortLabel: '100К монет',
    priceUsd: 2,
    note: 'Сразу на Kugoo G2 Pro',
  },
  {
    id: 'coins_500k',
    amount: 500000,
    label: '500 000 монет',
    shortLabel: '500К монет',
    priceUsd: 4,
    note: 'Хватит на Dualtron Thunder 3',
  },
  {
    id: 'coins_1m',
    amount: 1000000,
    label: '1 000 000 монет',
    shortLabel: '1 лям монет',
    priceUsd: 6,
    note: 'Максимальная выгода · 3 кейса + гараж',
    featured: true,
  },
];

function buildTelegramDonateUrl(itemTitle: string, priceUsd: number, username?: string | null): string {
  const accountPart = username ? ` Мой ник в игре: @${username}.` : '';
  const text = `Привет! Хочу купить донат в BLACK STANT: ${itemTitle} за $${priceUsd}.${accountPart}`;
  return `https://t.me/${TELEGRAM_HANDLE}?text=${encodeURIComponent(text)}`;
}

export function DonateModal({
  coins,
  vip,
  user,
  onOpenRegister,
  onClose,
}: DonateModalProps) {
  const vipBuyUrl = buildTelegramDonateUrl('VIP статус (×2 монеты)', 2, user?.username);
  const directTgUrl = `https://t.me/${TELEGRAM_HANDLE}?text=${encodeURIComponent(
    user?.username
      ? `Привет! Вопрос по донату в BLACK STANT. Мой ник: @${user.username}`
      : 'Привет! Вопрос по донату в BLACK STANT.'
  )}`;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center p-3.5 sm:p-4 bg-[#0a0d12]/80 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-[#161c24]/95 border border-white/10 p-4 sm:p-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Донат-магазин
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Покупка и выдача через Telegram <span className="text-sky-300 font-semibold">@{TELEGRAM_HANDLE}</span>
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-white/70 font-mono-num">
              <span>Баланс: 🪙 {Math.floor(coins).toLocaleString('ru-RU')}</span>
              <span className="text-white/25" aria-hidden="true">·</span>
              <span>{vip ? 'VIP активен (×2)' : 'Статус: обычный'}</span>
              {user && (
                <>
                  <span className="text-white/25" aria-hidden="true">·</span>
                  <span className="text-emerald-300 font-sans font-semibold">@{user.username}</span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-semibold text-sm flex items-center gap-1.5 border border-white/10 transition whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>

        {/* Account hint so admin knows who to credit */}
        {!user && (
          <div className="mb-4 rounded-xl bg-[#1e2631] border border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-3">
            <p className="text-xs text-white/75 leading-snug">
              Войди в аккаунт, чтобы твой ник автоматически подставился в сообщение для выдачи доната.
            </p>
            <button
              type="button"
              onClick={onOpenRegister}
              className="h-9 px-3 rounded-lg bg-[#2a3646] hover:bg-[#354458] text-white text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#ff8b4a]" />
              Войти
            </button>
          </div>
        )}

        <div className="space-y-4 max-h-[64dvh] overflow-y-auto pr-0.5 mobile-scroll">
          {/* VIP Featured Card */}
          <div className="rounded-xl bg-[#1d242f] border border-[#ffd34d]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#ffd34d]/15 border border-[#ffd34d]/35 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 text-[#ffd34d]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-lg sm:text-xl font-extrabold text-white leading-tight">
                    VIP Статус
                  </h3>
                  {vip && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Уже активен
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-white/70 mt-1 leading-snug">
                  Удваивает все монеты за вилли и трюки (×2) · золотой статус VIP в игре и топе
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/8">
              <div className="font-mono-num text-2xl font-black text-[#ffd34d]">$2</div>
              <a
                href={vipBuyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-5 rounded-xl bg-[#ffd34d] hover:bg-[#ffe07d] active:scale-[0.98] text-[#11151c] font-display font-extrabold text-sm flex items-center justify-center gap-1.5 transition whitespace-nowrap"
              >
                <Send className="w-4 h-4 shrink-0" />
                Купить VIP
              </a>
            </div>
          </div>

          {/* Coin Packs */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#ff8b4a]" />
                Пакеты монет
              </h3>
              <span className="text-xs text-white/45">Переход сразу в Telegram</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COIN_PACKS.map((pack) => {
                const buyUrl = buildTelegramDonateUrl(pack.label, pack.priceUsd, user?.username);
                return (
                  <div
                    key={pack.id}
                    className={`rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 border transition ${
                      pack.featured
                        ? 'sm:col-span-2 bg-[#202936] border-[#ff6a1a]/55'
                        : 'bg-[#1b222c] border-white/8 hover:border-white/20'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-mono-num text-lg sm:text-xl font-extrabold text-white leading-tight">
                        🪙 {pack.amount.toLocaleString('ru-RU')}
                      </div>
                      <div className="text-xs text-white/60 mt-1">
                        {pack.shortLabel} · {pack.note}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="font-mono-num text-lg sm:text-xl font-black text-[#ffd34d]">
                        ${pack.priceUsd}
                      </div>
                      <a
                        href={buyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 px-4 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] active:scale-[0.98] text-white font-display font-bold text-sm flex items-center justify-center gap-1.5 transition whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5 shrink-0" />
                        Купить
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct Support Footer */}
          <div className="pt-2 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-white/55">
            <span>Нажми «Купить» — сразу откроется чат с @{TELEGRAM_HANDLE} с готовым сообщением.</span>
            <a
              href={directTgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-300 hover:text-sky-200 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Написать в Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
