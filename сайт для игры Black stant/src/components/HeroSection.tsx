import { ExternalLink, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { GAME_PWA_URL, GAME_SCREENSHOT } from '../data/gameData';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  onOpenAuth: () => void;
  isRegistered: boolean;
}

export function HeroSection({
  onOpenAuth,
  isRegistered,
}: HeroSectionProps) {
  return (
    <section
      id="top"
      className="bg-subtle-grid relative flex min-h-[84vh] items-center overflow-hidden border-b border-white/10 py-16 md:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[8%] h-[460px] w-[460px] rounded-full bg-[#7EA8C3]/20 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-[10%] h-80 w-80 rounded-full bg-orange-500/15 blur-[100px]"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6"
        >
          <div className="mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-400">
            <span>BLACK STANT</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span>Уличные трюки</span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-lime-400">Веб-приложение (PWA)</span>
          </div>

          <h1
            className="font-display font-bold leading-[1.08] tracking-tight text-white text-balance"
            style={{ fontSize: 'clamp(2.25rem, 4.3vw, 3.65rem)' }}
          >
            Уличные трюки на самокате в BLACK STANT
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300 md:text-lg">
            Запускай игру как лёгкое PWA-приложение без скачивания лишних файлов — делай вилли на
            заднем колесе и катайся по городу.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href={GAME_PWA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg bg-orange-500 px-7 py-3 text-sm font-bold text-slate-950 whitespace-nowrap shrink-0 transition-all duration-150 hover:bg-orange-400 hover:shadow-[0_0_28px_-4px_rgba(249,115,22,0.65)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span>Установить PWA</span>
            </a>

            <button
              type="button"
              onClick={onOpenAuth}
              className="surface-card inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-slate-100 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-orange-500/60 hover:text-orange-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>{isRegistered ? 'Мой профиль' : 'Вход и регистрация'}</span>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center lg:col-span-6 lg:justify-end"
        >
          <div className="surface-card w-full max-w-[440px] rounded-2xl border border-white/15 p-2.5 shadow-[0_28px_80px_-18px_rgba(0,0,0,0.85)]">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-[#87B0C9]">
              <ResilientImage
                src={GAME_SCREENSHOT.src}
                alt={GAME_SCREENSHOT.alt}
                title="BLACK STANT"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
