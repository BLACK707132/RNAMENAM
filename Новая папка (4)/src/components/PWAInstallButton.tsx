import { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  X,
  ExternalLink,
  Send,
  Package,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [apkAvailable, setApkAvailable] = useState(false);
  const [apkSizeMb, setApkSizeMb] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/apk/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { available?: boolean; sizeBytes?: number } | null) => {
        if (!active || !data) return;
        if (data.available) {
          setApkAvailable(true);
          if (typeof data.sizeBytes === 'number' && data.sizeBytes > 0) {
            setApkSizeMb((data.sizeBytes / (1024 * 1024)).toFixed(1));
          }
        }
      })
      .catch(() => {
        // Offline or dev reload
      });
    return () => {
      active = false;
    };
  }, []);

  if (isInstalled && !apkAvailable) return null;

  const currentOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://ais-pre-m5koscwjvrn7gdvnqadrvf-890183634344.asia-northeast1.run.app';

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(
    currentOrigin
  )}`;

  const telegramApkUrl = `https://t.me/durov0113?text=${encodeURIComponent(
    'Привет! Скинь, пожалуйста, APK BLACK STANT на Android.'
  )}`;

  const handleMainClick = () => {
    if (apkAvailable) {
      const a = document.createElement('a');
      a.href = '/api/apk/download';
      a.download = 'BLACK_STANT.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    setShowModal(true);
  };

  const handleWebApkInstall = async () => {
    if (isInstallable) {
      await promptInstall();
      setShowModal(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleMainClick}
        className="w-full h-11 rounded-xl bg-emerald-500/18 hover:bg-emerald-500/28 active:scale-[0.99] text-emerald-100 font-bold text-sm flex items-center justify-center gap-2 border border-emerald-400/45 transition"
      >
        <Download className="w-4 h-4 text-emerald-300 shrink-0" />
        <span>
          {apkAvailable
            ? `Скачать APK (Android${apkSizeMb ? ` · ${apkSizeMb} МБ` : ''})`
            : 'Скачать APK (Android)'}
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0d12]/82 backdrop-blur-xs overflow-y-auto mobile-scroll">
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
                    Скачать BLACK STANT
                  </h3>
                  <p className="text-xs text-emerald-300 font-semibold">
                    Android APK / Приложение
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
                <p className="text-xs text-white/65 leading-relaxed">
                  На iPhone файлы <b>.apk</b> не поддерживаются, но игру можно установить на рабочий стол как приложение:
                </p>
                <ol className="space-y-2 text-xs text-white/85">
                  <li className="flex items-start gap-2">
                    <span className="font-mono-num font-bold text-[#ff8b4a]">1.</span>
                    <span>
                      Открой игру в Safari и нажми{' '}
                      <Share className="inline w-3.5 h-3.5 text-[#ff8b4a] -mt-0.5" /> <b>Поделиться</b>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono-num font-bold text-[#ff8b4a]">2.</span>
                    <span>
                      Выбери <PlusSquare className="inline w-3.5 h-3.5 text-[#ff8b4a] -mt-0.5" />{' '}
                      <b>На экран «Домой»</b> и нажми <b>Добавить</b>.
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {/* Option 1: Direct Android WebAPK Install */}
                <div className="rounded-xl bg-[#1d2531] border border-emerald-400/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                    <Smartphone className="w-4 h-4 text-emerald-300 shrink-0" />
                    Установить на Android (WebAPK)
                  </div>
                  {isInstallable ? (
                    <>
                      <p className="text-[11px] text-white/70 leading-snug">
                        Chrome сам соберёт и установит Android-пакет приложения на рабочий стол — работает без интернета и на весь экран!
                      </p>
                      <button
                        type="button"
                        onClick={handleWebApkInstall}
                        className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#06150e] font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Download className="w-4 h-4" />
                        Установить на Android сейчас
                      </button>
                    </>
                  ) : (
                    <ol className="space-y-1.5 text-[11px] text-white/75 leading-snug">
                      <li>
                        <b className="text-emerald-300">1.</b> Открой игру в браузере <b>Chrome</b> на Android.
                      </li>
                      <li>
                        <b className="text-emerald-300">2.</b> Нажми меню <b>⋮</b> сверху справа → <b>«Установить приложение»</b> — телефон установит нативный Android WebAPK с иконкой.
                      </li>
                    </ol>
                  )}
                </div>

                {/* Option 2: Package standalone signed .apk via PWABuilder */}
                <div className="rounded-xl bg-[#1d2531] border border-white/10 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                    <Package className="w-4 h-4 text-[#ff8b4a] shrink-0" />
                    Собрать отдельный файл .APK
                  </div>
                  <p className="text-[11px] text-white/65 leading-snug">
                    Чтобы скачать готовый файл <b>BLACK_STANT.apk</b> и раздавать друзьям — нажми кнопку ниже (бесплатная сборка Android APK через PWABuilder за 1 минуту):
                  </p>
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-9 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    Собрать и скачать .APK
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Option 3: Telegram @durov0113 */}
                <a
                  href={telegramApkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-9 rounded-xl bg-[#162635] hover:bg-[#1b3146] border border-sky-400/30 text-sky-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5 text-sky-300" />
                  Запросить APK в Telegram (@durov0113)
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full h-10 rounded-xl bg-white/8 hover:bg-white/14 text-white font-bold text-sm transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
