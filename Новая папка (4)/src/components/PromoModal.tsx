import { useEffect, useState } from 'react';
import { X, Gift, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  loadPromoHistory,
  redeemPromoCodeAsync,
  type PromoHistoryItem,
} from '../utils/promos';
import { sound } from '../utils/sound';

interface PromoModalProps {
  coins: number;
  onClaimCoins: (amount: number) => void;
  onClose: () => void;
}

export function PromoModal({ coins, onClaimCoins, onClose }: PromoModalProps) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reward, setReward] = useState<{ code: string; coins: number; label: string } | null>(
    null
  );
  const [history, setHistory] = useState<PromoHistoryItem[]>(() => loadPromoHistory());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setReward(null);
    setSubmitting(true);

    const res = await redeemPromoCodeAsync(code);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }

    onClaimCoins(res.coins);
    sound.playPromo();
    setReward({ code: res.code, coins: res.coins, label: res.label });
    setCode('');
    setHistory(loadPromoHistory());
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center p-3.5 sm:p-4 bg-[#0a0d12]/82 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-[#161c24]/98 border border-white/10 p-5 sm:p-6 shadow-2xl my-auto text-left">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#ff6a1a]/15 border border-[#ff6a1a]/30 flex items-center justify-center text-[#ff8b4a] shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-black text-white leading-tight">
                Промокоды
              </h2>
              <div className="text-xs text-[#ffd34d] font-bold font-mono-num mt-0.5">
                Баланс: 🪙 {Math.floor(coins).toLocaleString('ru-RU')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть промокоды"
            className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Promo Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-white/75 mb-1.5">
              Введи промокод для бонуса
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Введи промокод..."
              autoComplete="off"
              spellCheck={false}
              className="w-full h-12 px-3.5 rounded-xl bg-[#1d2530] border border-white/15 focus:border-[#ff6a1a] outline-none text-base font-extrabold tracking-widest uppercase text-white font-mono-num placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-white/35"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ff7b72]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {reward && (
            <div className="rounded-xl bg-gradient-to-r from-[#ff6a1a]/25 via-[#ffd34d]/20 to-emerald-500/20 border border-[#ffd34d]/45 p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ffd34d]/20 flex items-center justify-center text-[#ffd34d] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-display font-black text-base text-white">
                  +{reward.coins.toLocaleString('ru-RU')} 🪙 ПОЛУЧЕНО!
                </div>
                <div className="text-xs text-emerald-300 font-semibold truncate">
                  {reward.code} успешно активирован
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim() || submitting}
            className="w-full h-12 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 disabled:hover:bg-[#ff6a1a] text-white font-display font-bold text-base flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Gift className="w-4 h-4" />
            {submitting ? 'Проверяем...' : 'Активировать'}
          </button>
        </form>

        {/* Redeemed history */}
        {history.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-white/8">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/45 mb-2">
              Активированные промокоды
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto mobile-scroll pr-0.5">
              {history.map((item) => (
                <div
                  key={`${item.code}-${item.redeemedAt}`}
                  className="rounded-lg bg-[#1b222c] border border-white/8 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono-num font-bold text-white truncate">
                      {item.code}
                    </span>
                  </div>
                  <span className="font-mono-num font-extrabold text-[#ffd34d] shrink-0">
                    +{item.coins.toLocaleString('ru-RU')} 🪙
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
