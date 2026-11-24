import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BatteryCharging,
  Check,
  Cpu,
  Lightbulb,
  Moon,
  Paintbrush,
  RotateCcw,
  Settings2,
  Sun,
  Zap,
} from 'lucide-react';
import {
  getEffectiveScooterStats,
  getScooter,
  getScooterAkb,
  getScooterLight,
  getScooterUnderglow,
  getScooterUnderglowHex,
  getSecondMotorPower,
  getSecondMotorPrice,
  getVescPrice,
  SCOOTER_AKBS,
  SCOOTER_LIGHTS,
  SCOOTER_PAINT_SWATCHES,
  SCOOTER_UNDERGLOWS,
  SCOOTERS,
  type AkbId,
  type LightId,
  type ScooterId,
  type ScooterPaint,
  type ScooterPaintMap,
  type ScooterSpec,
  type UnderglowId,
} from '../data/scooters';
import { loadScooterImageCached } from './GameCanvas';
import { renderPaintedScooterCanvas } from '../utils/wheelRig';

type CustomTab = 'paint' | 'light' | 'vesc' | 'motor' | 'akb';

interface ScooterThumbProps {
  scooter: ScooterSpec;
  paint?: ScooterPaint;
  className?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}

export function ScooterThumb({
  scooter,
  paint,
  className = 'w-full h-full object-contain drop-shadow-sm',
  fetchPriority = 'auto',
}: ScooterThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const hasPaint = Boolean(paint && (paint.primary || paint.secondary));

  useEffect(() => {
    if (!hasPaint) {
      setCanvasReady(false);
      return;
    }
    let cancelled = false;
    loadScooterImageCached(scooter, true).then((img) => {
      if (cancelled || !img || !canvasRef.current) return;
      const out = renderPaintedScooterCanvas(img, scooter.id, paint, canvasRef.current);
      if (out) setCanvasReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [scooter, hasPaint, paint?.primary, paint?.secondary]);

  if (hasPaint) {
    return (
      <>
        <canvas
          ref={canvasRef}
          className={`${className} ${canvasReady ? 'block' : 'hidden'}`}
        />
        {!canvasReady && (
          <img
            src={scooter.spriteSrc}
            alt={scooter.name}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            className={className}
          />
        )}
      </>
    );
  }

  return (
    <img
      src={scooter.spriteSrc}
      alt={scooter.name}
      loading="eager"
      decoding="async"
      fetchPriority={fetchPriority}
      referrerPolicy="no-referrer"
      onError={(e) => {
        if (!e.currentTarget.dataset.fallback && scooter.originalSrc !== scooter.spriteSrc) {
          e.currentTarget.dataset.fallback = '1';
          e.currentTarget.src = scooter.originalSrc;
        }
      }}
      className={className}
    />
  );
}

interface PaintModalProps {
  coins: number;
  currentScooterId: ScooterId;
  ownedScooters: ScooterId[];
  paints: ScooterPaintMap;
  ownedLights: LightId[];
  currentLight: LightId;
  ownedUnderglows: UnderglowId[];
  currentUnderglow: UnderglowId;
  ownedAkbs: AkbId[];
  currentAkb: AkbId;
  ownedVesc: ScooterId[];
  ownedMotors: ScooterId[];
  onSetPaint: (scooterId: ScooterId, paint: ScooterPaint | null) => void;
  onSelectLight: (id: LightId) => void;
  onBuyLight: (id: LightId) => void;
  onSelectUnderglow: (id: UnderglowId) => void;
  onBuyUnderglow: (id: UnderglowId) => void;
  onSelectAkb: (id: AkbId) => void;
  onBuyAkb: (id: AkbId) => void;
  onBuyVesc: (scooterId: ScooterId) => void;
  onBuySecondMotor: (scooterId: ScooterId) => void;
  onSelectScooter: (scooterId: ScooterId) => void;
  onClose: () => void;
}

export function PaintModal({
  coins,
  currentScooterId,
  ownedScooters,
  paints,
  ownedLights,
  currentLight,
  ownedUnderglows,
  currentUnderglow,
  ownedAkbs,
  currentAkb,
  ownedVesc,
  ownedMotors,
  onSetPaint,
  onSelectLight,
  onBuyLight,
  onSelectUnderglow,
  onBuyUnderglow,
  onSelectAkb,
  onBuyAkb,
  onBuyVesc,
  onBuySecondMotor,
  onSelectScooter,
  onClose,
}: PaintModalProps) {
  const [selectedId, setSelectedId] = useState<ScooterId>(currentScooterId);
  const [tab, setTab] = useState<CustomTab>('light');
  const [lightSubTab, setLightSubTab] = useState<'headlight' | 'underglow'>('headlight');
  const [previewNight, setPreviewNight] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewReady, setPreviewReady] = useState(false);

  const scooter = getScooter(selectedId);
  const paint: ScooterPaint = paints[selectedId] ?? {};
  const isSingleColor = scooter.paintMode === 'single';
  const ownedList = SCOOTERS.filter((s) => ownedScooters.includes(s.id));
  const activeLight = getScooterLight(currentLight);
  const activeUnderglowSpec = getScooterUnderglow(currentUnderglow);
  const activeUnderglowHex = getScooterUnderglowHex(scooter, currentUnderglow);
  const activeAkb = getScooterAkb(currentAkb);

  const hasVesc = ownedVesc.includes(selectedId);
  const vescPrice = getVescPrice(scooter);
  const vescMaxKmh = getEffectiveScooterStats(scooter, true, false, currentAkb).maxKmh;

  const hasSecondMotor = ownedMotors.includes(selectedId);
  const motorPrice = getSecondMotorPrice(scooter);
  const motorPower = getSecondMotorPower(scooter);

  const effStats = getEffectiveScooterStats(scooter, hasVesc, hasSecondMotor, currentAkb);
  const fullComboStats = getEffectiveScooterStats(scooter, true, true, currentAkb);
  const showNightGlow = previewNight || tab === 'light';

  const f3UnderglowOverride = scooter.skipCyanLed
    ? currentUnderglow === 'default'
      ? undefined
      : currentUnderglow === 'off'
        ? null
        : activeUnderglowHex
    : undefined;

  useEffect(() => {
    let cancelled = false;
    setPreviewReady(false);
    loadScooterImageCached(scooter, true).then((img) => {
      if (cancelled || !img || !previewCanvasRef.current) return;
      const rendered = renderPaintedScooterCanvas(
        img,
        scooter.id,
        paint,
        previewCanvasRef.current,
        f3UnderglowOverride
      );
      if (rendered) setPreviewReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [scooter, paint.primary, paint.secondary, f3UnderglowOverride]);

  const updateColor = (slot: 'primary' | 'secondary', hex?: string) => {
    const next: ScooterPaint = {
      ...paint,
      [slot]: hex || undefined,
    };
    if (isSingleColor) {
      delete next.secondary;
    }
    if (!next.primary && !next.secondary) {
      onSetPaint(selectedId, null);
    } else {
      onSetPaint(selectedId, next);
    }
  };

  const handleReset = () => {
    onSetPaint(selectedId, null);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center p-3.5 sm:p-4 bg-[#0a0d12]/82 backdrop-blur-[3px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-[#161c24]/98 border border-white/10 p-4 sm:p-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="min-w-0">
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-[#ff8b4a] shrink-0" />
              Кастомизация
            </h2>
            <p className="text-xs text-white/65 font-mono-num mt-0.5">
              Баланс: 🪙 {Math.floor(coins).toLocaleString('ru-RU')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 border border-white/10 transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>

        {/* Owned scooter selector */}
        {ownedList.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 mobile-scroll">
            {ownedList.map((s) => {
              const active = s.id === selectedId;
              const hasCustom = Boolean(paints[s.id]?.primary || paints[s.id]?.secondary);
              const sHasUpgrades = ownedVesc.includes(s.id) || ownedMotors.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition flex items-center gap-1.5 shrink-0 ${
                    active
                      ? 'bg-[#ff6a1a] text-white border-[#ff6a1a]'
                      : 'bg-[#1e2631] hover:bg-[#27313f] text-white/80 border-white/10'
                  }`}
                >
                  <span>{s.name}</span>
                  {sHasUpgrades && <Zap className="w-3 h-3 text-[#ffd34d] shrink-0" />}
                  {hasCustom && (
                    <span
                      className="w-2 h-2 rounded-full border border-white/70"
                      style={{
                        backgroundColor:
                          paints[s.id]?.secondary ?? paints[s.id]?.primary ?? '#ff6a1a',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Live Studio Preview */}
        <div
          className={`rounded-xl p-4 mb-3.5 flex flex-col items-center justify-center relative overflow-hidden border transition-colors ${
            showNightGlow
              ? 'bg-[#0e1522] border-sky-400/25'
              : 'bg-[#e8edf3] border-white/15'
          }`}
        >

          <button
            type="button"
            onClick={() => setPreviewNight((v) => !v)}
            title={showNightGlow ? 'Светлый фон' : 'Ночной фон (проверить фару)'}
            className={`absolute top-2.5 right-2.5 z-10 h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition ${
              showNightGlow
                ? 'bg-white/10 hover:bg-white/18 text-white border-white/15'
                : 'bg-[#161c24]/80 hover:bg-[#161c24] text-white border-black/15'
            }`}
          >
            {showNightGlow ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                День
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-300" />
                Ночь
              </>
            )}
          </button>

          <div className="relative w-full h-44 sm:h-48 flex items-center justify-center">
            {showNightGlow && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-[8%] top-[24%] w-48 h-28 rounded-full blur-2xl opacity-75"
                style={{
                  background: `radial-gradient(ellipse at 18% 48%, ${activeLight.coreHex} 0%, ${activeLight.beamHex} 42%, transparent 78%)`,
                }}
              />
            )}
            {activeUnderglowHex && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-1.5 w-48 h-7 blur-xl transition-opacity"
                style={{
                  opacity: showNightGlow ? 0.85 : 0.42,
                  background: `radial-gradient(ellipse at center, ${activeUnderglowHex} 0%, transparent 74%)`,
                }}
              />
            )}
            <canvas
              ref={previewCanvasRef}
              className={`relative z-[1] max-w-full max-h-full object-contain drop-shadow-md ${
                previewReady ? 'block' : 'hidden'
              }`}
            />
            {!previewReady && (
              <img
                src={scooter.spriteSrc}
                alt={scooter.name}
                className="relative z-[1] max-w-full max-h-full object-contain drop-shadow-md"
              />
            )}
          </div>

          <div className="mt-2 px-3 py-1 rounded-lg bg-[#161c24]/90 text-white text-xs font-bold flex items-center gap-2 flex-wrap justify-center">
            <span>{scooter.name}</span>
            <span className="font-mono-num text-white/75">до {effStats.maxKmh} км/ч</span>
            <span className="font-mono-num text-white/60">Газ ×{effStats.power}</span>
            {hasVesc && (
              <span className="text-emerald-300 inline-flex items-center gap-0.5">
                <Cpu className="w-3 h-3" />
                Веск
              </span>
            )}
            {hasSecondMotor && (
              <span className="text-[#ffd34d] inline-flex items-center gap-0.5">
                <Zap className="w-3 h-3" />
                2-й мотор
              </span>
            )}
            {activeAkb.bonusKmh > 0 && (
              <span className="text-sky-300 inline-flex items-center gap-0.5">
                <BatteryCharging className="w-3 h-3" />
                +{activeAkb.bonusKmh} км/ч
              </span>
            )}
            {selectedId === currentScooterId && (
              <span className="text-emerald-300 font-semibold">· Выбран</span>
            )}
          </div>
        </div>

        {/* 4 Square Upgrade & Light Tiles: Свет / Веск / Мотор / АКБ + Покраска switcher */}
        <div className="mb-3.5 space-y-2">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
            {/* Square 1: Свет */}
            <button
              type="button"
              onClick={() => setTab('light')}
              className={`aspect-square min-h-[78px] sm:min-h-[92px] rounded-2xl p-1.5 sm:p-2 border flex flex-col items-center justify-center gap-1 text-center transition ${
                tab === 'light'
                  ? 'bg-[#ff6a1a]/18 border-[#ff6a1a] text-white shadow-lg'
                  : 'bg-[#1e2631] border-white/10 text-white/80 hover:border-white/25 hover:text-white'
              }`}
            >
              <span
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-white/20 flex items-center justify-center shrink-0"
                style={{
                  background: `radial-gradient(circle, ${activeLight.coreHex}28 0%, #111722 85%)`,
                  boxShadow: tab === 'light' ? `0 0 14px ${activeLight.beamHex}55` : undefined,
                }}
              >
                <Lightbulb className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color: activeLight.beamHex }} />
              </span>
              <span className="font-display text-[11px] sm:text-sm font-extrabold leading-none">
                Свет
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-white/60 leading-tight line-clamp-1 max-w-full">
                {activeUnderglowHex ? activeUnderglowSpec.name : activeLight.name}
              </span>
            </button>

            {/* Square 2: Веск */}
            <button
              type="button"
              onClick={() => setTab('vesc')}
              className={`aspect-square min-h-[78px] sm:min-h-[92px] rounded-2xl p-1.5 sm:p-2 border flex flex-col items-center justify-center gap-1 text-center transition ${
                tab === 'vesc'
                  ? 'bg-[#ff6a1a]/18 border-[#ff6a1a] text-white shadow-lg'
                  : 'bg-[#1e2631] border-white/10 text-white/80 hover:border-white/25 hover:text-white'
              }`}
            >
              <span
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  hasVesc
                    ? 'bg-emerald-500/18 border-emerald-400/45 text-emerald-300'
                    : 'bg-[#111722] border-white/15 text-emerald-300'
                }`}
              >
                <Cpu className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </span>
              <span className="font-display text-[11px] sm:text-sm font-extrabold leading-none">
                Веск
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-bold font-mono-num leading-tight ${
                  hasVesc ? 'text-emerald-300' : 'text-white/65'
                }`}
              >
                {hasVesc ? 'Стоит' : `${vescPrice.toLocaleString('ru-RU')} 🪙`}
              </span>
            </button>

            {/* Square 3: Мотор */}
            <button
              type="button"
              onClick={() => setTab('motor')}
              className={`aspect-square min-h-[78px] sm:min-h-[92px] rounded-2xl p-1.5 sm:p-2 border flex flex-col items-center justify-center gap-1 text-center transition ${
                tab === 'motor'
                  ? 'bg-[#ff6a1a]/18 border-[#ff6a1a] text-white shadow-lg'
                  : 'bg-[#1e2631] border-white/10 text-white/80 hover:border-white/25 hover:text-white'
              }`}
            >
              <span
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  hasSecondMotor
                    ? 'bg-amber-400/18 border-amber-300/45 text-[#ffd34d]'
                    : 'bg-[#111722] border-white/15 text-[#ffd34d]'
                }`}
              >
                <Zap className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </span>
              <span className="font-display text-[11px] sm:text-sm font-extrabold leading-none">
                Мотор
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-bold font-mono-num leading-tight ${
                  hasSecondMotor ? 'text-[#ffd34d]' : 'text-white/65'
                }`}
              >
                {hasSecondMotor ? 'Стоит' : `${motorPrice.toLocaleString('ru-RU')} 🪙`}
              </span>
            </button>

            {/* Square 4: АКБ */}
            <button
              type="button"
              onClick={() => setTab('akb')}
              className={`aspect-square min-h-[78px] sm:min-h-[92px] rounded-2xl p-1.5 sm:p-2 border flex flex-col items-center justify-center gap-1 text-center transition ${
                tab === 'akb'
                  ? 'bg-[#ff6a1a]/18 border-[#ff6a1a] text-white shadow-lg'
                  : 'bg-[#1e2631] border-white/10 text-white/80 hover:border-white/25 hover:text-white'
              }`}
            >
              <span
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  activeAkb.bonusKmh > 0
                    ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                    : 'bg-[#111722] border-white/15 text-sky-300'
                }`}
              >
                <BatteryCharging className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </span>
              <span className="font-display text-[11px] sm:text-sm font-extrabold leading-none">
                АКБ
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-bold font-mono-num leading-tight ${
                  activeAkb.bonusKmh > 0 ? 'text-sky-300' : 'text-white/65'
                }`}
              >
                {activeAkb.bonusKmh > 0 ? `+${activeAkb.bonusKmh} км/ч` : 'Сток'}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTab('paint')}
            className={`w-full h-11 rounded-xl px-3.5 border flex items-center justify-between text-xs sm:text-sm font-extrabold transition ${
              tab === 'paint'
                ? 'bg-[#ff6a1a] border-[#ff8b4a] text-white'
                : 'bg-[#1e2631] border-white/10 text-white/80 hover:border-white/25 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Paintbrush className="w-4 h-4 shrink-0" />
              Покраска корпуса
            </span>
            <span className="text-[11px] font-semibold opacity-80">
              {paint.primary || paint.secondary ? 'Свой цвет' : 'Сток'}
            </span>
          </button>
        </div>

        {/* Tab 1: Paint */}
        {tab === 'paint' && (
          <>
            <div className="mb-2.5 rounded-xl bg-amber-500/12 border border-amber-400/35 px-3 py-2 text-[11px] font-semibold text-amber-200 leading-snug">
              Многие раскраски и детали ещё не появились — дождитесь окончания обновления!
            </div>
            <p className="text-[11px] text-white/55 mb-2">
              {isSingleColor
                ? '1 цвет (рама и бугель). Одежда райдера не перекрашивается.'
                : '2 окраса: выбери основной и второй цвет. Одежда райдера не меняется.'}
            </p>
            <div className="rounded-xl bg-[#1e2631] border border-white/8 p-3.5 mb-3">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  {isSingleColor ? 'Цвет рамы и бугеля' : '1. Основной цвет'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateColor('primary', undefined)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                      !paint.primary
                        ? 'bg-white/18 text-white border-white/40'
                        : 'bg-white/5 hover:bg-white/12 text-white/70 border-white/10'
                    }`}
                  >
                    Сток
                  </button>
                  <label className="cursor-pointer px-2 py-1 rounded-md bg-white/8 hover:bg-white/14 border border-white/15 text-[11px] font-bold text-white/85 flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-sm border border-white/40"
                      style={{ backgroundColor: paint.primary ?? '#181c24' }}
                    />
                    Свой
                    <input
                      type="color"
                      value={paint.primary ?? '#181c24'}
                      onChange={(e) => updateColor('primary', e.target.value)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                {SCOOTER_PAINT_SWATCHES.map((sw) => {
                  const active = paint.primary?.toLowerCase() === sw.hex.toLowerCase();
                  return (
                    <button
                      key={sw.id}
                      type="button"
                      title={sw.name}
                      onClick={() => updateColor('primary', sw.hex)}
                      className={`h-8 rounded-lg border transition flex items-center justify-center ${
                        active
                          ? 'border-white scale-105 ring-2 ring-[#ff6a1a]'
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: sw.hex }}
                    >
                      {active && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            sw.id === 'white' || sw.id === 'yellow' || sw.id === 'lime'
                              ? 'text-slate-900'
                              : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {!isSingleColor && (
              <div className="rounded-xl bg-[#1e2631] border border-white/8 p-3.5 mb-3">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    2. Второй цвет (акцент)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateColor('secondary', undefined)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                        !paint.secondary
                          ? 'bg-white/18 text-white border-white/40'
                          : 'bg-white/5 hover:bg-white/12 text-white/70 border-white/10'
                      }`}
                    >
                      Сток
                    </button>
                    <label className="cursor-pointer px-2 py-1 rounded-md bg-white/8 hover:bg-white/14 border border-white/15 text-[11px] font-bold text-white/85 flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-sm border border-white/40"
                        style={{ backgroundColor: paint.secondary ?? scooter.accent }}
                      />
                      Свой
                      <input
                        type="color"
                        value={paint.secondary ?? '#ff6a1a'}
                        onChange={(e) => updateColor('secondary', e.target.value)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {SCOOTER_PAINT_SWATCHES.map((sw) => {
                    const active = paint.secondary?.toLowerCase() === sw.hex.toLowerCase();
                    return (
                      <button
                        key={sw.id}
                        type="button"
                        title={sw.name}
                        onClick={() => updateColor('secondary', sw.hex)}
                        className={`h-8 rounded-lg border transition flex items-center justify-center ${
                          active
                            ? 'border-white scale-105 ring-2 ring-[#ff6a1a]'
                            : 'border-white/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: sw.hex }}
                      >
                        {active && (
                          <Check
                            className={`w-3.5 h-3.5 ${
                              sw.id === 'white' || sw.id === 'yellow' || sw.id === 'lime'
                                ? 'text-slate-900'
                                : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Headlight & Underglow LED Shop */}
        {tab === 'light' && (
          <div className="rounded-xl bg-[#1e2631] border border-white/8 p-3.5 mb-3">
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => setLightSubTab('headlight')}
                className={`h-9 rounded-lg text-xs font-extrabold border transition ${
                  lightSubTab === 'headlight'
                    ? 'bg-[#ff6a1a] border-[#ff8b4a] text-white'
                    : 'bg-[#141921] border-white/10 text-white/75 hover:text-white'
                }`}
              >
                Фара ({activeLight.name})
              </button>
              <button
                type="button"
                onClick={() => setLightSubTab('underglow')}
                className={`h-9 rounded-lg text-xs font-extrabold border transition ${
                  lightSubTab === 'underglow'
                    ? 'bg-[#ff6a1a] border-[#ff8b4a] text-white'
                    : 'bg-[#141921] border-white/10 text-white/75 hover:text-white'
                }`}
              >
                Подсветка снизу
              </button>
            </div>

            {lightSubTab === 'headlight' ? (
              <>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    Цвет фары (виден ночью и на линзе)
                  </span>
                  <span className="text-[11px] font-bold text-sky-300">{activeLight.name}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto mobile-scroll pr-0.5">
                  {SCOOTER_LIGHTS.map((l) => {
                    const owned = l.price === 0 || ownedLights.includes(l.id);
                    const selected = currentLight === l.id;
                    const canAfford = coins >= l.price;
                    return (
                      <div
                        key={l.id}
                        className={`rounded-xl p-2.5 border flex items-center justify-between gap-2.5 transition ${
                          selected
                            ? 'bg-[#253140] border-[#ff6a1a]'
                            : 'bg-[#141921] border-white/8'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-8 h-8 rounded-lg border border-white/25 shrink-0"
                            style={{
                              background: `radial-gradient(circle, ${l.coreHex} 10%, ${l.beamHex} 80%)`,
                              boxShadow: `0 0 12px ${l.beamHex}`,
                            }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{l.name}</div>
                            <div className="text-[10px] text-white/55 truncate">{l.subtitle}</div>
                          </div>
                        </div>
                        {selected ? (
                          <span className="px-2.5 py-1.5 rounded-lg bg-[#ff6a1a]/18 text-[#ff8b4a] font-bold text-[11px] shrink-0">
                            Выбран
                          </span>
                        ) : owned ? (
                          <button
                            type="button"
                            onClick={() => onSelectLight(l.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#2a3646] hover:bg-[#354458] text-white font-bold text-[11px] shrink-0 transition"
                          >
                            Выбрать
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => onBuyLight(l.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 text-white font-bold text-[11px] font-mono-num shrink-0 transition"
                          >
                            {l.price.toLocaleString('ru-RU')} 🪙
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    Подсветка снизу и на деке F3
                  </span>
                  <span className="text-[11px] font-bold text-sky-300">
                    {activeUnderglowSpec.name}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto mobile-scroll pr-0.5">
                  {SCOOTER_UNDERGLOWS.map((ug) => {
                    const owned = ug.price === 0 || ownedUnderglows.includes(ug.id);
                    const selected = currentUnderglow === ug.id;
                    const canAfford = coins >= ug.price;
                    const swatchHex =
                      ug.id === 'default'
                        ? (scooter.underglow ?? '#38bdf8')
                        : ug.hex ?? '#1f2937';
                    return (
                      <div
                        key={ug.id}
                        className={`rounded-xl p-2.5 border flex items-center justify-between gap-2.5 transition ${
                          selected
                            ? 'bg-[#253140] border-[#ff6a1a]'
                            : 'bg-[#141921] border-white/8'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-8 h-8 rounded-lg border border-white/25 shrink-0 flex items-center justify-center text-[10px] font-bold text-white/70"
                            style={{
                              background:
                                ug.id === 'off'
                                  ? '#11161f'
                                  : `radial-gradient(circle, #ffffff 6%, ${swatchHex} 78%)`,
                              boxShadow: ug.id === 'off' ? undefined : `0 0 12px ${swatchHex}`,
                            }}
                          >
                            {ug.id === 'off' ? 'OFF' : ''}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{ug.name}</div>
                            <div className="text-[10px] text-white/55 truncate">{ug.subtitle}</div>
                          </div>
                        </div>
                        {selected ? (
                          <span className="px-2.5 py-1.5 rounded-lg bg-[#ff6a1a]/18 text-[#ff8b4a] font-bold text-[11px] shrink-0">
                            Выбрана
                          </span>
                        ) : owned ? (
                          <button
                            type="button"
                            onClick={() => onSelectUnderglow(ug.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#2a3646] hover:bg-[#354458] text-white font-bold text-[11px] shrink-0 transition"
                          >
                            Выбрать
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => onBuyUnderglow(ug.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 text-white font-bold text-[11px] font-mono-num shrink-0 transition"
                          >
                            {ug.price.toLocaleString('ru-RU')} 🪙
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Hidden VESC (+35% speed, +12% launch torque, up to +58% with 2nd motor) */}
        {tab === 'vesc' && (
          <div className="rounded-xl bg-[#1e2631] border border-white/8 p-4 mb-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-300" />
                  Контроллер Веск (скрытый)
                </div>
                <div className="text-xs text-white/60 mt-0.5 leading-snug">
                  Не виден внешне, ставится внутрь деки/рамы: даёт +35% максималки и резкий подрыв с места (в паре с 2-м мотором — до {fullComboStats.maxKmh} км/ч!). Цена — 30% от транспорта.
                </div>
              </div>
              {hasVesc && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-extrabold shrink-0">
                  Установлен
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-[#141921] border border-white/8 p-2.5">
                <div className="text-[11px] text-white/50">Макс. скорость (+35%)</div>
                <div className="font-mono-num font-extrabold text-white mt-0.5">
                  {scooter.maxKmh} →{' '}
                  <span className="text-emerald-300">
                    {hasSecondMotor ? fullComboStats.maxKmh : vescMaxKmh} км/ч
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-[#141921] border border-white/8 p-2.5">
                <div className="text-[11px] text-white/50">Рывок с места</div>
                <div className="font-mono-num font-extrabold text-white mt-0.5">
                  ×{hasVesc ? effStats.power : getEffectiveScooterStats(scooter, true, hasSecondMotor).power}{' '}
                  {hasSecondMotor ? '(+ 2-й мотор)' : '(с Веск)'}
                </div>
              </div>
            </div>

            {hasVesc ? (
              <div className="rounded-xl bg-emerald-500/12 border border-emerald-400/30 p-3 text-xs text-emerald-200 font-semibold">
                На {scooter.name} уже установлен скрытый Веск — максимальная скорость {effStats.maxKmh} км/ч!
              </div>
            ) : (
              <button
                type="button"
                disabled={coins < vescPrice}
                onClick={() => onBuyVesc(selectedId)}
                className="w-full h-11 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <Cpu className="w-4 h-4" />
                Купить Веск за {vescPrice.toLocaleString('ru-RU')} 🪙
              </button>
            )}
          </div>
        )}

        {/* Tab 4: Hidden 2nd Motor (+72% torque, +18% speed / +58% combined with VESC) */}
        {tab === 'motor' && (
          <div className="rounded-xl bg-[#1e2631] border border-white/8 p-4 mb-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#ffd34d]" />
                  Второй мотор (скрытый апгрейд)
                </div>
                <div className="text-xs text-white/60 mt-0.5 leading-snug">
                  Не виден внешне, как и Веск! Даёт +72% тяги, звук двойного мотора Dualtron Thunder 3 и разгон с Веск до {fullComboStats.maxKmh} км/ч. Цена — 30% от транспорта.
                </div>
              </div>
              {hasSecondMotor && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-extrabold shrink-0">
                  Установлен
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-[#141921] border border-white/8 p-2.5">
                <div className="text-[11px] text-white/50">Мощность и старт (+72%)</div>
                <div className="font-mono-num font-extrabold text-white mt-0.5">
                  ×{scooter.power} →{' '}
                  <span className="text-[#ffd34d]">
                    ×{hasSecondMotor ? effStats.power : hasVesc ? fullComboStats.power : motorPower}
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-[#141921] border border-white/8 p-2.5">
                <div className="text-[11px] text-white/50">Макс. скорость</div>
                <div className="font-mono-num font-extrabold text-white mt-0.5">
                  {getEffectiveScooterStats(scooter, hasVesc, true).maxKmh} км/ч{' '}
                  {hasVesc ? '(+ Веск!)' : '(+18%)'}
                </div>
              </div>
            </div>

            {hasSecondMotor ? (
              <div className="rounded-xl bg-emerald-500/12 border border-emerald-400/30 p-3 text-xs text-emerald-200 font-semibold">
                На {scooter.name} уже установлен скрытый 2-й мотор — мощность ×{effStats.power}, до {effStats.maxKmh} км/ч!
              </div>
            ) : (
              <button
                type="button"
                disabled={coins < motorPrice}
                onClick={() => onBuySecondMotor(selectedId)}
                className="w-full h-11 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <Zap className="w-4 h-4" />
                Купить 2-й мотор за {motorPrice.toLocaleString('ru-RU')} 🪙
              </button>
            )}
          </div>
        )}

        {/* Tab 5: АКБ (Batteries +10 / +20 / +50 km/h) */}
        {tab === 'akb' && (
          <div className="rounded-xl bg-[#1e2631] border border-white/8 p-3.5 sm:p-4 mb-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <BatteryCharging className="w-4 h-4 text-sky-300" />
                  Батарея (АКБ)
                </div>
                <div className="text-xs text-white/60 mt-0.5 leading-snug">
                  Повышает вольтаж и прибавляет чистую максимальную скорость к любому твоему самокату и питбайку.
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-sky-500/18 border border-sky-400/35 text-sky-300 text-[11px] font-bold font-mono-num shrink-0">
                +{activeAkb.bonusKmh} км/ч
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SCOOTER_AKBS.map((akb) => {
                const owned = akb.price === 0 || ownedAkbs.includes(akb.id);
                const selected = currentAkb === akb.id;
                const canAfford = coins >= akb.price;
                const previewMax = getEffectiveScooterStats(
                  scooter,
                  hasVesc,
                  hasSecondMotor,
                  akb.id
                ).maxKmh;
                return (
                  <div
                    key={akb.id}
                    className={`rounded-xl p-3 border flex items-center justify-between gap-2.5 transition ${
                      selected
                        ? 'bg-[#253140] border-[#ff6a1a]'
                        : 'bg-[#141921] border-white/8'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-white truncate flex items-center gap-1.5">
                        <span>{akb.name}</span>
                        {akb.bonusKmh > 0 && (
                          <span className="text-sky-300 font-mono-num">+{akb.bonusKmh}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/55 truncate mt-0.5">
                        {akb.subtitle} · до {previewMax} км/ч
                      </div>
                    </div>
                    {selected ? (
                      <span className="px-2.5 py-1.5 rounded-lg bg-[#ff6a1a]/18 text-[#ff8b4a] font-bold text-[11px] shrink-0">
                        Выбрана
                      </span>
                    ) : owned ? (
                      <button
                        type="button"
                        onClick={() => onSelectAkb(akb.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#2a3646] hover:bg-[#354458] text-white font-bold text-[11px] shrink-0 transition"
                      >
                        Выбрать
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyAkb(akb.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 text-white font-bold text-[11px] font-mono-num shrink-0 transition"
                      >
                        {akb.price.toLocaleString('ru-RU')} 🪙
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {tab === 'paint' ? (
            <button
              type="button"
              onClick={handleReset}
              disabled={!paint.primary && !paint.secondary}
              className="h-10 px-3.5 rounded-xl bg-white/6 hover:bg-white/12 disabled:opacity-35 text-white/85 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-white/10 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Сбросить краску
            </button>
          ) : (
            <div className="text-[11px] text-white/50">Изменения сохраняются сразу</div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {selectedId !== currentScooterId && (
              <button
                type="button"
                onClick={() => {
                  onSelectScooter(selectedId);
                  onClose();
                }}
                className="h-10 px-4 rounded-xl bg-[#242e3b] hover:bg-[#2d3948] text-white font-bold text-xs sm:text-sm border border-white/10 transition"
              >
                Выбрать {scooter.name}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-display font-bold text-sm transition"
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
