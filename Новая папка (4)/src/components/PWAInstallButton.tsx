import { useState } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  X,
  Copy,
  Check,
  MoreVertical,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Hide completely once running as an installed standalone PWA
  if (isInstalled) return null;

  const handleMainClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      try {
        await promptInstall();
      } finally {
        setInstalling(false);
      }
      return;
    }
    setShowModal(true);
  };

  const handleCopyUrl = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    if (!url) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted browsers
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleMainClick}
        disabled={installing}
        className="w-full h-11 rounded-xl bg-emerald-500/18 hover:bg-emerald-500/28 active:scale-[0.99] disabled:opacity-60 text-emerald-100 font-bold text-sm flex items-center justify-center gap-2 border border-emerald-400/45 transition"
      >
        <Download className="w-4 h-4 text-emerald-300 shrink-0" />
        <span>
          {installing
            ? 'Установка PWA...'
            : isInstallable
              ? 'Установить PWA (1 клик)'
              : 'Установить PWA на телефон'}
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-[#0a0d12]/82 backdrop-blur-xs overflow-y-auto mobile-scroll">
          <div className="w-full max-w-sm rounded-2xl bg-[#161c24] border border-white/12 p-5 text-left shadow-2xl my-auto">
            <div className="flex items-center justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/pwa-192x192.png?v=2"
                  alt="BLACK STANT"
                  className="w-11 h-11 rounded-xl border border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-extrabold text-white leading-tight truncate">
                    Установить PWA
                  </h3>
                  <p className="text-xs text-emerald-300 font-semibold">
                    BLACK STANT · На главный экран
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Закрыть"
                className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/75 shrink-0 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 mb-4">
                <p className="text-xs text-white/70 leading-relaxed">
                  Установи <b>BLACK STANT</b> как полноценное PWA-приложение на iPhone (на весь экран и с иконкой на рабочем столе):
                </p>
                <ol className="space-y-2.5 rounded-xl bg-[#1d2531] border border-emerald-400/25 p-3 text-xs text-white/85">
                  <li className="flex items-start gap-2">
                    <span className="font-mono-num font-bold text-[#ff8b4a]">1.</span>
                    <span>
                      Открой игру в браузере <b>Safari</b> и нажми{' '}
                      <Share className="inline w-3.5 h-3.5 text-[#ff8b4a] -mt-0.5" />{' '}
                      <b>Поделиться</b> внизу экрана.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono-num font-bold text-[#ff8b4a]">2.</span>
                    <span>
                      Выбери{' '}
                      <PlusSquare className="inline w-3.5 h-3.5 text-[#ff8b4a] -mt-0.5" />{' '}
                      <b>На экран «Домой»</b> и нажми <b>Добавить</b>.
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <div className="rounded-xl bg-[#1d2531] border border-emerald-400/30 p-3 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                    <Smartphone className="w-4 h-4 text-emerald-300 shrink-0" />
                    {isAndroid ? 'Установка PWA на Android' : 'Установка PWA в браузере'}
                  </div>
                  <ol className="space-y-2 text-xs text-white/85 leading-snug">
                    <li className="flex items-start gap-2">
                      <span className="font-mono-num font-bold text-emerald-300">1.</span>
                      <span>
                        Открой игру в браузере <b>Chrome</b> (или Яндекс / Edge), а не внутри Telegram.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono-num font-bold text-emerald-300">2.</span>
                      <span>
                        Нажми меню{' '}
                        <MoreVertical className="inline w-3.5 h-3.5 text-emerald-300 -mt-0.5" />{' '}
                        сверху справа → <b>«Установить приложение»</b> или{' '}
                        <b>«Добавить на главный экран»</b>.
                      </span>
                    </li>
                  </ol>
                  <p className="text-[11px] text-white/55 leading-snug">
                    Игра установится мгновенно без скачивания APK, будет работать на весь экран и всегда обновится сама.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="w-full h-9 rounded-xl bg-white/8 hover:bg-white/14 border border-white/12 text-white/90 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      Ссылка скопирована — вставь в Chrome
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white/70" />
                      Скопировать ссылку для Chrome / Safari
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#06150e] font-extrabold text-sm transition"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
}
