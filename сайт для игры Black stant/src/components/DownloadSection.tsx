import { useState } from 'react';
import { ExternalLink, Laptop, Smartphone, UserPlus } from 'lucide-react';
import { GAME_PWA_URL, GAME_SCREENSHOT, PWA_GUIDES, type PwaPlatformGuide } from '../data/gameData';
import type { RegisteredUser } from './Header';
import { ResilientImage } from './ResilientImage';

interface DownloadSectionProps {
  user: RegisteredUser | null;
  onOpenAuth: () => void;
}

export function DownloadSection({ user, onOpenAuth }: DownloadSectionProps) {
  const [selectedGuide, setSelectedGuide] = useState<PwaPlatformGuide['id']>('android');
  const [guideHighlighted, setGuideHighlighted] = useState(false);

  const hasPwaUrl = GAME_PWA_URL.trim().length > 0;
  const activeGuide = PWA_GUIDES.find((g) => g.id === selectedGuide) ?? PWA_GUIDES[0];

  const renderPlatformIcon = (id: PwaPlatformGuide['id']) => {
    if (id === 'desktop') return <Laptop className="h-4 w-4" aria-hidden="true" />;
    return <Smartphone className="h-4 w-4" aria-hidden="true" />;
  };

  const handleGuideFocus = () => {
    setGuideHighlighted(true);
    const guideEl = document.getElementById('pwa-install-guide');
    if (guideEl) {
      guideEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <section
      id="download"
      className="bg-subtle-grid relative border-b border-white/10 bg-[#0E121A] py-20 md:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(249,115,22,0.10),transparent)]"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          <div className="surface-card flex flex-col justify-between rounded-2xl border border-white/10 p-6 md:p-8 lg:col-span-7">
            <div>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[#87B0C9]">
                  <ResilientImage
                    src={GAME_SCREENSHOT.src}
                    alt={GAME_SCREENSHOT.alt}
                    title="BLACK STANT"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-wider text-orange-400">
                    PWA-приложение
                  </p>
                  <h2 className="font-display mt-1.5 text-2xl font-bold text-white md:text-3xl">
                    Установить BLACK STANT как приложение
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2.5 text-xs font-medium text-slate-400">
                    <span>Только PWA</span>
                    <span aria-hidden="true">·</span>
                    <span>Без скачивания установочных файлов</span>
                    <span aria-hidden="true">·</span>
                    <span>Работает на экране телефона и ПК</span>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-slate-300">
                Никаких тяжёлых архивов и APK: игра запускается напрямую как веб-приложение и
                добавляется как обычная иконка на главный экран.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {hasPwaUrl ? (
                <a
                  href={GAME_PWA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2.5 rounded-lg bg-orange-500 px-7 py-3 text-sm font-bold text-slate-950 whitespace-nowrap transition-all hover:bg-orange-400 hover:shadow-[0_0_24px_-4px_rgba(249,115,22,0.6)]"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span>Открыть PWA-приложение</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleGuideFocus}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2.5 rounded-lg bg-orange-500 px-7 py-3 text-sm font-bold text-slate-950 whitespace-nowrap transition-all hover:bg-orange-400 hover:shadow-[0_0_24px_-4px_rgba(249,115,22,0.6)] cursor-pointer"
                >
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                  <span>Установить PWA</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#0B0E14] px-5 py-3 text-sm font-semibold text-slate-100 whitespace-nowrap transition-colors hover:border-orange-500/60 hover:text-orange-300 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>{user ? `Игрок: ${user.nickname}` : 'Создать ник и пароль'}</span>
              </button>
            </div>
          </div>

          <div
            id="pwa-install-guide"
            className={`surface-card flex flex-col justify-between rounded-2xl border p-6 md:p-8 lg:col-span-5 transition-colors duration-200 ${
              guideHighlighted ? 'border-orange-500/70' : 'border-white/10'
            }`}
          >
            <div>
              <p className="text-xs font-semibold tracking-wider text-orange-400">
                Как добавить на экран
              </p>
              <h3 className="font-display mt-1.5 text-xl font-bold text-white">
                Установка PWA за 10 секунд
              </h3>

              <div
                role="tablist"
                aria-label="Выбор устройства для установки PWA"
                className="mt-5 grid grid-cols-3 gap-1.5 rounded-lg border border-white/10 bg-[#0B0E14] p-1"
              >
                {PWA_GUIDES.map((guide) => {
                  const isActive = guide.id === activeGuide.id;
                  return (
                    <button
                      key={guide.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedGuide(guide.id)}
                      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-orange-500 text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {renderPlatformIcon(guide.id)}
                      <span>{guide.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 text-xs font-medium text-slate-400">
                Браузер: <span className="text-slate-200">{activeGuide.browser}</span>
              </div>

              <ol className="mt-4 space-y-3 border-t border-white/10 pt-4">
                {activeGuide.steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="font-mono text-xs font-medium text-orange-400 pt-0.5 tabular-nums">
                      0{index + 1}.
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-slate-400">
              После добавления на экран игра открывается на весь экран как нативное приложение.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
