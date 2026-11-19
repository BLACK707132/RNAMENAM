import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Package, Play, Sparkles, CheckCircle2, Info, FastForward } from 'lucide-react';
import { getScooter, type ScooterId, type ScooterSpec } from '../data/scooters';
import { sound } from '../utils/sound';

export const SCOOTER_CASE_PRICE = 300_000;

export interface ScooterCaseDrop {
  scooterId: ScooterId;
  chance: number; // percent (sums to 100)
  rarityLabel: string;
  rarityColor: string;
  borderColor: string;
  bgTint: string;
  legendary?: boolean;
}

export const SCOOTER_CASE_DROPS: ScooterCaseDrop[] = [
  {
    scooterId: 'thunder3',
    chance: 12,
    rarityLabel: 'ЛЕГЕНДАРНЫЙ',
    rarityColor: '#22d3ee',
    borderColor: 'rgba(34, 211, 238, 0.72)',
    bgTint: 'rgba(6, 182, 212, 0.16)',
    legendary: true,
  },
  {
    scooterId: 'g4max',
    chance: 15,
    rarityLabel: 'МИФИЧЕСКИЙ',
    rarityColor: '#ffd34d',
    borderColor: 'rgba(255, 211, 77, 0.65)',
    bgTint: 'rgba(255, 174, 25, 0.14)',
    legendary: true,
  },
  {
    scooterId: 'g2ultra',
    chance: 21,
    rarityLabel: 'РЕДКИЙ',
    rarityColor: '#fb923c',
    borderColor: 'rgba(251, 146, 60, 0.5)',
    bgTint: 'rgba(249, 115, 22, 0.12)',
  },
  {
    scooterId: 'gm',
    chance: 24,
    rarityLabel: 'НЕОБЫЧНЫЙ',
    rarityColor: '#c084fc',
    borderColor: 'rgba(192, 132, 252, 0.45)',
    bgTint: 'rgba(168, 85, 247, 0.10)',
  },
  {
    scooterId: 'c3',
    chance: 28,
    rarityLabel: 'ОБЫЧНЫЙ',
    rarityColor: '#94a3b8',
    borderColor: 'rgba(148, 163, 184, 0.35)',
    bgTint: 'rgba(148, 163, 184, 0.08)',
  },
];

function rollCaseDrop(): ScooterCaseDrop {
  const r = Math.random() * 100;
  let acc = 0;
  for (const drop of SCOOTER_CASE_DROPS) {
    acc += drop.chance;
    if (r < acc) return drop;
  }
  return SCOOTER_CASE_DROPS[SCOOTER_CASE_DROPS.length - 1];
}

interface CaseModalProps {
  coins: number;
  ownedScooters: ScooterId[];
  onSpendForCase: () => boolean;
  onCaseWin: (scooterId: ScooterId) => { alreadyOwned: boolean };
  onEquipAndPlay: (scooterId: ScooterId) => void;
  onBack: () => void;
}

const CARD_W = 128;
const CARD_GAP = 10;
const STEP_W = CARD_W + CARD_GAP;
const REEL_LEN = 46;
const WIN_INDEX = 36;

export function CaseModal({
  coins,
  ownedScooters,
  onSpendForCase,
  onCaseWin,
  onEquipAndPlay,
  onBack,
}: CaseModalProps) {
  const [spinning, setSpinning] = useState(false);
  const [reel, setReel] = useState<ScooterCaseDrop[]>(() =>
    Array.from({ length: REEL_LEN }, () => rollCaseDrop())
  );
  const [offsetPx, setOffsetPx] = useState(0);
  const [result, setResult] = useState<{
    drop: ScooterCaseDrop;
    scooter: ScooterSpec;
    alreadyOwned: boolean;
  } | null>(null);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const onCaseWinRef = useRef(onCaseWin);
  onCaseWinRef.current = onCaseWin;

  const activeSpinRef = useRef<{
    drop: ScooterCaseDrop;
    targetOffset: number;
    finished: boolean;
  } | null>(null);

  // Cancel animation ONLY on actual unmount (never when `spinning` changes!)
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // Close with Escape when not spinning
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && !spinning) onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack, spinning]);

  const canAfford = coins >= SCOOTER_CASE_PRICE;

  const finalizeSpin = () => {
    const cur = activeSpinRef.current;
    if (!cur || cur.finished) return;
    cur.finished = true;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setOffsetPx(cur.targetOffset);
    setSpinning(false);
    const { alreadyOwned } = onCaseWinRef.current(cur.drop.scooterId);
    const scooter = getScooter(cur.drop.scooterId);
    if (!alreadyOwned) {
      sound.playWin(Boolean(cur.drop.legendary));
    } else {
      sound.playTick();
    }
    setResult({ drop: cur.drop, scooter, alreadyOwned });
  };

  const handleOpenCase = () => {
    if (spinning) {
      finalizeSpin();
      return;
    }
    if (!canAfford) return;
    if (!onSpendForCase()) return;

    const wonDrop = rollCaseDrop();
    const nextReel = Array.from({ length: REEL_LEN }, () => rollCaseDrop());
    nextReel[WIN_INDEX] = wonDrop;

    // Occasionally tease a top legendary drop right beside the winner
    if (!wonDrop.legendary && Math.random() < 0.45) {
      const teaseIdx = Math.random() < 0.5 ? WIN_INDEX - 1 : WIN_INDEX + 1;
      nextReel[teaseIdx] = SCOOTER_CASE_DROPS[0];
    }

    setReel(nextReel);
    setResult(null);
    setSpinning(true);

    const viewW = viewportRef.current?.clientWidth || 360;
    const jitter = (Math.random() - 0.5) * (CARD_W * 0.42);
    const targetOffset = Math.max(0, WIN_INDEX * STEP_W + CARD_W / 2 - viewW / 2 + jitter);

    activeSpinRef.current = {
      drop: wonDrop,
      targetOffset,
      finished: false,
    };

    const startTime = performance.now();
    const duration = 4200;
    let lastTickCard = -1;

    const step = (now: number) => {
      const cur = activeSpinRef.current;
      if (!cur || cur.finished) return;

      const t = Math.min(1, (now - startTime) / duration);
      // Smooth ease-out for classic case suspense
      const eased = 1 - Math.pow(1 - t, 4.3);
      const curOffset = cur.targetOffset * eased;
      setOffsetPx(curOffset);

      const centerCard = Math.floor((curOffset + viewW / 2) / STEP_W);
      if (centerCard !== lastTickCard) {
        lastTickCard = centerCard;
        sound.playTick();
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        finalizeSpin();
      }
    };

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    setOffsetPx(0);
    rafRef.current = requestAnimationFrame(step);
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-3.5 sm:p-4 bg-[#0a0d12]/82 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-[#161c24]/98 border border-white/10 p-4 sm:p-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#ff6a1a]/18 border border-[#ff6a1a]/40 flex items-center justify-center text-[#ff9d5c] shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-2xl sm:text-3xl font-black text-white leading-tight truncate">
                Кейс самокатов
              </h2>
              <p className="text-xs sm:text-sm text-white/65 font-mono-num">
                Баланс: 🪙 {Math.floor(coins).toLocaleString('ru-RU')}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={spinning}
            onClick={onBack}
            className="h-10 px-4 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] disabled:opacity-45 text-white font-semibold text-sm flex items-center gap-1.5 border border-white/10 transition whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>

        {/* Roulette Reel Window */}
        <div className="relative rounded-2xl bg-[#0e131a] border border-white/10 p-3 mb-4 overflow-hidden">
          {/* Center Pointer Line */}
          <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center justify-between">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-[#ffd34d]" />
            <div className="w-[2px] flex-1 bg-[#ffd34d]/85 shadow-[0_0_12px_rgba(255,211,77,0.8)]" />
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-[#ffd34d]" />
          </div>

          {/* Side fade masks */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0e131a] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0e131a] to-transparent z-10" />

          <div ref={viewportRef} className="overflow-hidden w-full py-2">
            <div
              className="flex will-change-transform"
              style={{
                gap: `${CARD_GAP}px`,
                transform: `translate3d(${-offsetPx}px, 0, 0)`,
              }}
            >
              {reel.map((drop, idx) => {
                const sc = getScooter(drop.scooterId);
                return (
                  <div
                    key={idx}
                    style={{
                      width: `${CARD_W}px`,
                      borderColor: drop.borderColor,
                      background: drop.bgTint,
                    }}
                    className="shrink-0 rounded-xl border p-2 flex flex-col items-center text-center"
                  >
                    <div className="w-full h-20 rounded-lg bg-[#e8edf3] flex items-center justify-center p-1.5 mb-1.5 overflow-hidden">
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
                    <div className="text-[11px] font-display font-bold text-white truncate w-full leading-tight">
                      {sc.name}
                    </div>
                    <div
                      className="text-[9px] font-extrabold tracking-wider mt-0.5 uppercase"
                      style={{ color: drop.rarityColor }}
                    >
                      {drop.chance}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Result Banner */}
        {result && !spinning && (
          <div
            className="mb-4 rounded-xl p-3.5 sm:p-4 border flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left"
            style={{
              borderColor: result.drop.borderColor,
              background: result.drop.bgTint,
            }}
          >
            <div className="w-20 h-20 rounded-xl bg-[#e8edf3] flex items-center justify-center p-2 shrink-0">
              <img
                src={result.scooter.spriteSrc}
                alt={result.scooter.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = result.scooter.originalSrc;
                }}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[11px] font-extrabold tracking-wider uppercase"
                style={{ color: result.drop.rarityColor }}
              >
                {result.drop.rarityLabel} · {result.drop.chance}%
              </div>
              <div className="font-display text-xl font-black text-white truncate">
                Выпал: {result.scooter.name}
              </div>
              {result.alreadyOwned ? (
                <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-white/75">
                  <Info className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Уже есть в гараже — в инвентарь не добавлен.</span>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Добавлен в твой гараж!</span>
                </div>
              )}
            </div>
            {!result.alreadyOwned && (
              <button
                type="button"
                onClick={() => onEquipAndPlay(result.scooter.id)}
                className="h-10 px-4 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-display font-bold text-sm flex items-center gap-1.5 shrink-0 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                Кататься
              </button>
            )}
          </div>
        )}

        {/* Open Case / Skip CTA */}
        <button
          type="button"
          disabled={!spinning && !canAfford}
          onClick={handleOpenCase}
          className="w-full h-13 rounded-xl bg-gradient-to-r from-[#ff6a1a] to-[#ff8c2b] hover:from-[#ff782d] hover:to-[#ffa044] disabled:opacity-45 disabled:hover:from-[#ff6a1a] text-white font-display font-black text-lg flex items-center justify-center gap-2 shadow-lg transition mb-5"
        >
          {spinning ? (
            <>
              <FastForward className="w-5 h-5" />
              Пропустить анимацию
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Открыть кейс — {SCOOTER_CASE_PRICE.toLocaleString('ru-RU')} 🪙
            </>
          )}
        </button>

        {/* Drop Table with exact Chances */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
              Содержимое кейса и шансы
            </h3>
            <span className="text-[11px] text-white/45">Дубликаты в инвентарь не добавляются</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {SCOOTER_CASE_DROPS.map((drop) => {
              const sc = getScooter(drop.scooterId);
              const owned = ownedScooters.includes(drop.scooterId);
              return (
                <div
                  key={drop.scooterId}
                  style={{
                    borderColor: drop.borderColor,
                    background: drop.bgTint,
                  }}
                  className="rounded-xl border p-2.5 flex flex-col items-center text-center relative"
                >
                  <div
                    className="text-[10px] font-mono-num font-extrabold px-1.5 py-0.5 rounded bg-black/45 mb-1.5"
                    style={{ color: drop.rarityColor }}
                  >
                    {drop.chance}%
                  </div>
                  <div className="w-full h-16 rounded-lg bg-[#e8edf3] flex items-center justify-center p-1.5 mb-1.5">
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
                  <div className="font-display font-bold text-xs text-white leading-tight">
                    {sc.name}
                  </div>
                  <div
                    className="text-[9px] font-bold uppercase mt-0.5"
                    style={{ color: drop.rarityColor }}
                  >
                    {drop.rarityLabel}
                  </div>
                  {owned && (
                    <div className="text-[9px] text-emerald-300/90 font-semibold mt-0.5">
                      Есть в гараже
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
