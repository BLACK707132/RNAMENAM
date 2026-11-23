import { ArrowDownLeft, ArrowDownRight, Coins, Sparkles, X } from 'lucide-react';

interface ControlTutorialOverlayProps {
  onClose: () => void;
}

export function ControlTutorialOverlay({ onClose }: ControlTutorialOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center p-3.5 sm:p-4 bg-[#080b10]/76 backdrop-blur-[3px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-[#151c25]/96 border border-white/12 p-4 sm:p-5 shadow-2xl my-auto text-left">
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#ff8b4a]">
              Подсказка по управлению
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-white leading-tight mt-0.5">
              Как делать стант
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть подсказку"
            className="h-9 w-9 shrink-0 rounded-xl bg-white/6 hover:bg-white/12 text-white/80 flex items-center justify-center border border-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Gas & Brake two-column row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-[#1c2430] border border-red-400/25 p-3">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-display font-extrabold text-xs text-red-300 uppercase tracking-wide">
                  ТОРМОЗ
                </span>
                <ArrowDownLeft className="w-4 h-4 text-red-300/80 shrink-0" />
              </div>
              <p className="text-[11px] sm:text-xs text-white/75 leading-snug">
                <b>Слева внизу</b> — опускай самокат, чтобы не перевернуться.
              </p>
              <div className="mt-1.5 text-[10px] font-mono-num text-white/45">ПК: S / ↓ / Shift</div>
            </div>

            <div className="rounded-xl bg-[#1c2430] border border-[#ff6a1a]/35 p-3">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-display font-extrabold text-xs text-[#ffb085] uppercase tracking-wide">
                  ГАЗ
                </span>
                <ArrowDownRight className="w-4 h-4 text-[#ff8b4a] shrink-0" />
              </div>
              <p className="text-[11px] sm:text-xs text-white/75 leading-snug">
                <b>Справа внизу</b> — держи, чтобы поднять переднее колесо в вилли.
              </p>
              <div className="mt-1.5 text-[10px] font-mono-num text-white/45">ПК: W / ↑</div>
            </div>
          </div>

          {/* Stunt Tricks */}
          <div className="rounded-xl bg-[#1c2430] border border-white/10 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-4 h-4 text-[#ffd34d] shrink-0" />
              <span className="font-display font-extrabold text-xs text-white uppercase tracking-wide">
                Кнопки трюков (справа над газом)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-center mb-1.5">
              <div className="rounded-lg bg-emerald-500/12 border border-emerald-400/30 px-1.5 py-1.5">
                <div className="font-display font-extrabold text-[10px] text-emerald-200">
                  РУЛЕВАЯ
                </div>
                <div className="font-mono-num text-[10px] text-emerald-300/90 mt-0.5">×1.4 · Z</div>
              </div>
              <div className="rounded-lg bg-sky-500/12 border border-sky-400/30 px-1.5 py-1.5">
                <div className="font-display font-extrabold text-[10px] text-sky-200">КОЛЕНО</div>
                <div className="font-mono-num text-[10px] text-sky-300/90 mt-0.5">×1.3 · X</div>
              </div>
              <div className="rounded-lg bg-[#ff6a1a]/15 border border-[#ff8b4a]/35 px-1.5 py-1.5">
                <div className="font-display font-extrabold text-[10px] text-[#ffc99e]">1 РУКА</div>
                <div className="font-mono-num text-[10px] text-[#ff9f66] mt-0.5">×1.35 · C</div>
              </div>
              <div className="rounded-lg bg-pink-500/15 border border-pink-400/35 px-1.5 py-1.5">
                <div className="font-display font-extrabold text-[10px] text-pink-200">БЕЗ РУК</div>
                <div className="font-mono-num text-[10px] text-pink-300/95 mt-0.5">×1.85 · V</div>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-white/70 leading-snug">
              <b>РУЛЕВАЯ</b> ставит ногу на рулевую колонку (на электроскутерах и питбайках —{' '}
              <b>обе ноги на руль</b>), а <b>БЕЗ РУК</b> отпускает руль. Зажми <b>ГАЗ + ТОРМОЗ</b>{' '}
              на двух колёсах для <b className="text-[#ff8b4a]">БЕРНАУТА</b>! Комбо{' '}
              <b>БЕЗ РУК + РУЛЕВАЯ</b> — <b className="text-[#ffd34d]">×2.15</b>.
            </p>
          </div>

          {/* How to bank coins */}
          <div className="rounded-xl bg-[#ffd34d]/10 border border-[#ffd34d]/30 p-3 flex items-start gap-2.5">
            <Coins className="w-4 h-4 text-[#ffd34d] shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-white/85 leading-snug">
              <b>Опусти колесо на асфальт</b> до переворота на 13 часах — тогда все накопленные за
              трюк монеты зачислятся на баланс.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full h-12 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] active:scale-[0.99] text-white font-display font-extrabold text-base tracking-wide shadow-lg transition"
        >
          Понятно, поехали!
        </button>
      </div>
    </div>
  );
}
