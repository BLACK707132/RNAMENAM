import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Layers, Play, Shirt, Sparkles } from 'lucide-react';
import {
  drawStyledRider,
  getOutfit,
  OUTFITS,
  STUNT_SETS,
  type OutfitId,
  type RiderGearSet,
  type RiderOutfit,
  type StyledRiderPose,
} from '../data/outfits';
import { getHelmet, type HelmetId, type MotocrossHelmet } from '../data/helmets';

interface OutfitModalProps {
  coins: number;
  ownedOutfits: OutfitId[];
  ownedHelmets: HelmetId[];
  equippedOutfit: OutfitId;
  equippedHelmet: HelmetId;
  scooterAccent: string;
  helmet: MotocrossHelmet;
  onBack: () => void;
  onStartPlay: () => void;
  onPickOutfit: (id: OutfitId) => void;
  onBuyOutfit: (id: OutfitId) => void;
  onEquipSet: (set: RiderGearSet) => void;
  onBuySet: (set: RiderGearSet, price: number) => void;
}

const PREVIEW_POSE: StyledRiderPose = {
  hip: { x: 54, y: 112 },
  shoulder: { x: 58, y: 63 },
  head: { x: 61, y: 38 },
  backKnee: { x: 48, y: 145 },
  backFoot: { x: 39, y: 175 },
  frontKnee: { x: 67, y: 145 },
  frontFoot: { x: 64, y: 175 },
  backElbow: { x: 80, y: 78 },
  backHand: { x: 96, y: 67 },
  frontElbow: { x: 75, y: 84 },
  frontHand: { x: 92, y: 71 },
  flatFeet: true,
};

function OutfitPreviewCanvas({
  outfit,
  scooterAccent,
  helmet,
}: {
  outfit: RiderOutfit;
  scooterAccent: string;
  helmet: MotocrossHelmet;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 128;
    const H = 196;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(56, 180, 29, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    drawStyledRider(ctx, PREVIEW_POSE, 1, outfit, scooterAccent, helmet);
  }, [outfit, scooterAccent, helmet]);

  return <canvas ref={ref} className="w-[96px] h-[146px] sm:w-[104px] sm:h-[158px]" />;
}

export function getEffectiveSetPrice(
  set: RiderGearSet,
  ownedOutfits: OutfitId[],
  ownedHelmets: HelmetId[]
): number {
  const hasOutfit = ownedOutfits.includes(set.outfitId);
  const hasHelmet = ownedHelmets.includes(set.helmetId);
  if (hasOutfit && hasHelmet) return 0;
  if (!hasOutfit && hasHelmet) {
    return Math.min(set.bundlePrice, getOutfit(set.outfitId).price);
  }
  if (hasOutfit && !hasHelmet) {
    return Math.min(set.bundlePrice, 4500);
  }
  return set.bundlePrice;
}

export function OutfitModal({
  coins,
  ownedOutfits,
  ownedHelmets,
  equippedOutfit,
  equippedHelmet,
  scooterAccent,
  helmet,
  onBack,
  onStartPlay,
  onPickOutfit,
  onBuyOutfit,
  onEquipSet,
  onBuySet,
}: OutfitModalProps) {
  const [tab, setTab] = useState<'outfits' | 'sets'>('outfits');

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center p-3.5 sm:p-4 bg-[#0a0d12]/78 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-[#161c24]/95 border border-white/10 p-4 sm:p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between gap-4 mb-3.5">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <Shirt className="w-6 h-6 text-[#ff8b4a]" />
              Одежда и сеты
            </h2>
            <p className="text-sm text-white/65 font-mono-num mt-0.5">
              Баланс: 🪙 {Math.floor(coins).toLocaleString('ru-RU')}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="h-10 px-4 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-semibold text-sm flex items-center gap-1.5 border border-white/10 transition whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>

        {/* Mode Switcher: Individual Outfits vs Full Matching Sets */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#0e131a] border border-white/8 mb-4">
          <button
            type="button"
            onClick={() => setTab('outfits')}
            className={`h-9 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              tab === 'outfits'
                ? 'bg-[#ff6a1a] text-white shadow'
                : 'text-white/65 hover:text-white'
            }`}
          >
            <Shirt className="w-4 h-4" />
            Вся одежда ({OUTFITS.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('sets')}
            className={`h-9 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              tab === 'sets'
                ? 'bg-[#ff6a1a] text-white shadow'
                : 'text-white/65 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Готовые сеты ({STUNT_SETS.length})
          </button>
        </div>

        {tab === 'outfits' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-[55dvh] overflow-y-auto pr-1 mobile-scroll">
            {OUTFITS.map((o) => {
              const owned = ownedOutfits.includes(o.id);
              const selected = equippedOutfit === o.id;
              const canAfford = coins >= o.price;

              return (
                <div
                  key={o.id}
                  className={`rounded-xl p-3 flex flex-col items-center text-center border transition ${
                    selected
                      ? 'bg-[#202936] border-[#ff6a1a]'
                      : 'bg-[#1b222c] border-white/8 hover:border-white/20'
                  }`}
                >
                  <div className="w-full h-36 sm:h-40 rounded-lg bg-gradient-to-b from-[#6e90a8] via-[#8eb0c7] to-[#464b52] flex items-center justify-center mb-2.5 overflow-hidden">
                    <OutfitPreviewCanvas
                      outfit={o}
                      scooterAccent={scooterAccent}
                      helmet={helmet}
                    />
                  </div>

                  <div className="font-display font-bold text-base text-white leading-tight">
                    {o.name}
                  </div>
                  <div className="text-xs text-white/60 mt-0.5 mb-2.5">{o.subtitle}</div>

                  {selected ? (
                    <div className="mt-auto w-full h-9 rounded-lg bg-[#ff6a1a]/15 text-[#ff8b4a] font-bold text-sm flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" />
                      Надет
                    </div>
                  ) : owned ? (
                    <button
                      type="button"
                      onClick={() => onPickOutfit(o.id)}
                      className="mt-auto w-full h-9 rounded-lg bg-[#2a3646] hover:bg-[#354458] text-white font-bold text-sm transition"
                    >
                      Надеть
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onBuyOutfit(o.id)}
                      className="mt-auto w-full h-9 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 disabled:hover:bg-[#ff6a1a] text-white font-bold text-sm font-mono-num transition"
                    >
                      Купить {o.price.toLocaleString('ru-RU')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55dvh] overflow-y-auto pr-1 mobile-scroll">
            {STUNT_SETS.map((set) => {
              const setOutfit = getOutfit(set.outfitId);
              const setHelmet = getHelmet(set.helmetId);
              const hasOutfit = ownedOutfits.includes(set.outfitId);
              const hasHelmet = ownedHelmets.includes(set.helmetId);
              const ownsBoth = hasOutfit && hasHelmet;
              const isEquipped =
                equippedOutfit === set.outfitId && equippedHelmet === set.helmetId;
              const effectivePrice = getEffectiveSetPrice(set, ownedOutfits, ownedHelmets);
              const canAfford = coins >= effectivePrice;

              return (
                <div
                  key={set.id}
                  className={`rounded-xl p-3 flex gap-3 items-center border transition ${
                    isEquipped
                      ? 'bg-[#202936] border-[#ff6a1a]'
                      : 'bg-[#1b222c] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="w-24 sm:w-26 h-36 rounded-lg bg-gradient-to-b from-[#6e90a8] via-[#8eb0c7] to-[#464b52] flex items-center justify-center shrink-0 overflow-hidden">
                    <OutfitPreviewCanvas
                      outfit={setOutfit}
                      scooterAccent={scooterAccent}
                      helmet={setHelmet}
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col self-stretch">
                    <div
                      className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase mb-1"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: set.accentColor,
                      }}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {set.tag}
                    </div>
                    <div className="font-display font-bold text-base text-white leading-tight">
                      {set.name}
                    </div>
                    <div className="text-[11px] text-white/65 leading-snug mt-1">
                      {set.subtitle}
                    </div>
                    <div className="text-[10px] text-white/45 mt-1">
                      {hasOutfit ? '✓ Одежда' : '○ Одежда'} · {hasHelmet ? '✓ Шлем' : '○ Шлем'}
                    </div>

                    <div className="mt-auto pt-2">
                      {isEquipped ? (
                        <div className="w-full h-9 rounded-lg bg-[#ff6a1a]/15 text-[#ff8b4a] font-bold text-xs flex items-center justify-center gap-1">
                          <Check className="w-4 h-4" />
                          Сет надет
                        </div>
                      ) : ownsBoth ? (
                        <button
                          type="button"
                          onClick={() => onEquipSet(set)}
                          className="w-full h-9 rounded-lg bg-[#2a3646] hover:bg-[#354458] text-white font-bold text-xs transition"
                        >
                          Надеть сет целиком
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onBuySet(set, effectivePrice)}
                          className="w-full h-9 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 text-white font-bold text-xs font-mono-num transition"
                        >
                          Купить сет · {effectivePrice.toLocaleString('ru-RU')} 🪙
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onStartPlay}
            className="w-full sm:w-auto px-7 h-11 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-display font-bold text-base flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            В заезд
          </button>
        </div>
      </div>
    </div>
  );
}
