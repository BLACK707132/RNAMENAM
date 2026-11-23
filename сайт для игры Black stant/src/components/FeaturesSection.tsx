import { GAME_FEATURES } from '../data/gameData';

export function FeaturesSection() {
  return (
    <section id="features" className="border-b border-white/10 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-wider text-orange-400">Об игре</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white text-balance md:text-4xl">
              Динамика, трюки и городской стиль
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate-400">
            Аркадная стант-игра про заезды на электросамокате с быстрым запуском в формате PWA.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {GAME_FEATURES.map((feature) => (
            <article
              key={feature.id}
              className="surface-card flex flex-col justify-between rounded-2xl border border-white/10 p-6 md:p-7 transition-colors hover:border-orange-500/35"
            >
              <div>
                <div className="font-mono text-xs font-medium text-orange-400 tabular-nums">
                  {feature.index}
                </div>
                <h3 className="font-display mt-3 text-lg font-bold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
