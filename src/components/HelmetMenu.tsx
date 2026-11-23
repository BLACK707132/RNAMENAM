import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, Lock, Check, Zap } from 'lucide-react';
import {
  HELMETS,
  HELMET_DUPLICATE_REFUND,
  HELMET_SPIN_COST,
  ROULETTE_HELMETS,
  rollRandomHelmet,
  type HelmetId,
  type MotocrossHelmet,
} from '../data/helmets';
import { HelmetIcon } from './HelmetIcon';
import { sound } from '../utils/sound';

interface HelmetMenuProps {
  coins: number;
  ownedHelmets: HelmetId[];
  currentHelmet: HelmetId;
  onSpinStart: () => boolean;
  onSpinFinish: (won: MotocrossHelmet) => { isDuplicate: boolean };
  onEquipHelmet: (id: HelmetId) => void;
  onBack: () => void;
  onPlay: () => void;
}

const SLOT_W = 112; // px (104 card + 8 gap)
const REEL_LEN = 46;
const WIN_INDEX = 36;

function buildInitialReel(): MotocrossHelmet[] {
  return Array.from({ length: REEL_LEN }, (_, i) => ROULETTE_HELMETS[i % ROULETTE_HELMETS.length]);
}

export function HelmetMenu({
  coins,
  ownedHelmets,
  currentHelmet,
  onSpinStart,
  onSpinFinish,
  onEquipHelmet,
  onBack,
  onPlay,
}: HelmetMenuProps) {
  const [reel, setReel] = useState<MotocrossHelmet[]>(() => buildInitialReel());
  const [spinning, setSpinning] = useState(false);
  const [offsetPx, setOffsetPx] = useState(0);
  const [result, setResult] = useState<{ helmet: MotocrossHelmet; isDuplicate: boolean } | null>(
    null
  );

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const onSpinFinishRef = useRef(onSpinFinish);
  onSpinFinishRef.current = onSpinFinish;

  const activeSpinRef = useRef<{
    winner: MotocrossHelmet;
    targetOffset: number;
    finished: boolean;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // If unmounted mid-spin, still award the rolled helmet so coins are never lost
      const cur = activeSpinRef.current;
      if (cur && !cur.finished) {
        cur.finished = true;
        onSpinFinishRef.current(cur.winner);
      }
    };
  }, []);

  const canSpin = !spinning && coins >= HELMET_SPIN_COST;

  const finalizeSpin = () => {
    const cur = activeSpinRef.current;
    if (!cur || cur.finished) return;
    cur.finished = true;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    setOffsetPx(cur.targetOffset);
    setSpinning(false);
    const outcome = onSpinFinishRef.current(cur.winner);
    setResult({ helmet: cur.winner, isDuplicate: outcome.isDuplicate });
    sound.playWin(cur.winner.rarity === 'legendary' || cur.winner.rarity === 'epic');
  };

  const handleSpin = (fast = false) => {
    if (spinning && fast) {
      finalizeSpin();
      return;
    }
    if (!canSpin) return;
    if (!onSpinStart()) return;

    const winner = rollRandomHelmet();
    const nextReel: MotocrossHelmet[] = Array.from({ length: REEL_LEN }, (_, idx) =>
      idx === WIN_INDEX ? winner : rollRandomHelmet()
    );

    setReel(nextReel);
    setResult(null);
    setSpinning(true);

    const viewW = viewportRef.current?.clientWidth || 440;
    const jitter = (Math.random() - 0.5) * 44; // Land naturally inside the winning card
    const cardCenter = WIN_INDEX * SLOT_W + 52;
    const targetOffset = Math.max(0, cardCenter - viewW / 2 + jitter);

    activeSpinRef.current = { winner, targetOffset, finished: false };

    const duration = fast ? 420 : 3900;
    const startTime = performance.now();
    let lastTickSlot = -1;

    const animate = (now: number) => {
      const cur = activeSpinRef.current;
      if (!cur || cur.finished) return;

      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, fast ? 3 : 4.2);
      const curOffset = targetOffset * eased;
      setOffsetPx(curOffset);

      if (!fast) {
        const centerSlot = Math.floor((curOffset + viewW / 2) / SLOT_W);
        if (centerSlot !== lastTickSlot) {
          lastTickSlot = centerSlot;
          sound.playTick();
        }
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        finalizeSpin();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center p-3 sm:p-4 bg-[#0a0d12]/80 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-[#161c24]/95 border border-white/10 p-4 sm:p-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              Шлемы (MX, Фулл-Фейс, GP)
            </h2>
            <p className="text-sm text-white/65 font-mono-num mt-0.5">
              Баланс: 🪙 {Math.floor(coins).toLocaleString('ru-RU')} · Открыто {ownedHelmets.length}/{HELMETS.length}
            </p>
          </div>
          <button
            type="button"
            disabled={spinning}
            onClick={onBack}
            className="h-10 px-4 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] disabled:opacity-40 text-white font-semibold text-sm flex items-center gap-1.5 border border-white/10 transition whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>

        {/* Roulette Spinner Box */}
        <div className="rounded-xl bg-[#11161d] border border-white/10 p-3 sm:p-4 mb-5">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="text-sm font-bold text-white">Рулетка шлемов</div>
            <div className="text-xs text-white/55 font-mono-num">
              Дубликат → +{HELMET_DUPLICATE_REFUND.toLocaleString('ru-RU')} 🪙
            </div>
          </div>

          {/* Reel Viewport */}
          <div
            ref={viewportRef}
            className="relative w-full h-28 rounded-xl bg-[#0b0f15] border border-white/8 overflow-hidden mb-3"
          >
            {/* Center Pointer Line */}
            <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[9px] border-l-transparent border-r-transparent border-t-[#ff6a1a]" />
              <div className="w-[2px] flex-1 bg-[#ff6a1a]/90" />
              <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-b-[9px] border-l-transparent border-r-transparent border-b-[#ff6a1a]" />
            </div>

            {/* Edge fade shadows */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0b0f15] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0b0f15] to-transparent z-10" />

            {/* Moving Strip */}
            <div
              className="flex items-center h-full gap-2 px-0 will-change-transform"
              style={{ transform: `translate3d(-${offsetPx}px, 0, 0)` }}
            >
              {reel.map((h, i) => (
                <div
                  key={`${h.id}-${i}`}
                  className="shrink-0 w-[104px] h-[94px] rounded-lg bg-[#1a222d] border border-white/10 flex flex-col items-center justify-center px-1.5 py-1 relative"
                  style={{ borderBottomWidth: '3px', borderBottomColor: h.rarityColor }}
                >
                  <HelmetIcon helmet={h} className="w-14 h-12" />
                  <div className="text-[11px] font-bold text-white truncate max-w-full leading-tight">
                    {h.name}
                  </div>
                  <div className="text-[10px] font-semibold leading-tight" style={{ color: h.rarityColor }}>
                    {h.rarityLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spin Result Banner */}
          {result && !spinning && (
            <div className="mb-3 rounded-lg bg-[#1b2431] border border-white/10 px-3 py-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <HelmetIcon helmet={result.helmet} className="w-11 h-10 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    Выпал: {result.helmet.name}
                  </div>
                  <div className="text-xs text-white/70">
                    {result.isDuplicate
                      ? `Уже есть в коллекции · возврат +${HELMET_DUPLICATE_REFUND.toLocaleString('ru-RU')} монет`
                      : `Новый шлем (${result.helmet.rarityLabel})!`}
                  </div>
                </div>
              </div>
              {currentHelmet !== result.helmet.id && (
                <button
                  type="button"
                  onClick={() => onEquipHelmet(result.helmet.id)}
                  className="shrink-0 px-3 h-8 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] text-white text-xs font-bold transition whitespace-nowrap"
                >
                  Надеть
                </button>
              )}
            </div>
          )}

          {/* Spin CTA */}
          <button
            type="button"
            disabled={!canSpin}
            onClick={() => handleSpin(false)}
            className="w-full h-12 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 disabled:hover:bg-[#ff6a1a] active:scale-[0.99] text-white font-display font-bold text-lg font-mono-num transition"
          >
            {spinning
              ? 'Крутим рулетку...'
              : `Крутить шлем · ${HELMET_SPIN_COST.toLocaleString('ru-RU')} 🪙`}
          </button>
        </div>

        {/* Helmet Wardrobe */}
        <div className="text-xs font-semibold text-white/60 mb-2">
          Твои шлемы ({ownedHelmets.length}/{HELMETS.length})
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-0.5 mobile-scroll">
          {HELMETS.map((h) => {
            const owned = ownedHelmets.includes(h.id);
            const equipped = currentHelmet === h.id;
            return (
              <button
                key={h.id}
                type="button"
                disabled={!owned || spinning}
                onClick={() => owned && onEquipHelmet(h.id)}
                className={`rounded-xl p-2.5 flex flex-col items-center text-center border transition ${
                  equipped
                    ? 'bg-[#202936] border-[#ff6a1a]'
                    : owned
                      ? 'bg-[#1b222c] border-white/10 hover:border-white/25 cursor-pointer'
                      : 'bg-[#141a22] border-white/5 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="relative w-full h-14 flex items-center justify-center mb-1">
                  <HelmetIcon helmet={h} className="w-16 h-14" />
                  {!owned && (
                    <Lock className="w-3.5 h-3.5 text-white/50 absolute top-0.5 right-0.5" />
                  )}
                  {equipped && (
                    <Check className="w-4 h-4 text-[#ff6a1a] absolute top-0.5 right-0.5" />
                  )}
                </div>
                <div className="text-xs font-bold text-white leading-tight">{h.name}</div>
                <div className="text-[11px] mt-0.5" style={{ color: h.rarityColor }}>
                  {equipped ? 'Надет' : owned ? h.rarityLabel : `${h.rarityLabel} · Рулетка`}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2.5 sm:justify-between">
          <button
            type="button"
            disabled={!spinning && !canSpin}
            onClick={() => handleSpin(true)}
            className="w-full sm:flex-1 h-11 px-5 rounded-xl bg-[#242e3b] hover:bg-[#2f3c4e] disabled:opacity-40 active:scale-[0.99] text-white font-display font-bold text-sm sm:text-base flex items-center justify-center gap-1.5 border border-[#ff6a1a]/45 transition whitespace-nowrap"
          >
            <Zap className="w-4 h-4 text-[#ffd34d] fill-[#ffd34d] shrink-0" />
            {spinning ? 'Пропустить прокрут' : 'Быстрый прокрут'}
          </button>
          <button
            type="button"
            disabled={spinning}
            onClick={onPlay}
            className="w-full sm:w-auto px-7 h-11 rounded-xl bg-[#2fb344] hover:bg-[#35c44c] disabled:opacity-40 text-white font-display font-bold text-base flex items-center justify-center gap-2 transition whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current" />
            В заезд
          </button>
        </div>
      </div>
    </div>
  );
}
