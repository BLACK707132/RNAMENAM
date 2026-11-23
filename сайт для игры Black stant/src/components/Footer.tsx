export function Footer() {
  return (
    <footer className="bg-[#0B0E14] py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap"
          >
            BLACK <span className="text-orange-500">STANT</span>
          </a>
          <p className="mt-1 text-xs font-medium text-slate-500">
            © 2026 BLACK STANT. Уличная стант-игра.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-400">
          <a href="#features" className="transition-colors hover:text-white whitespace-nowrap">
            Об игре
          </a>
          <a href="#download" className="transition-colors hover:text-white whitespace-nowrap">
            PWA-приложение
          </a>
        </div>
      </div>
    </footer>
  );
}
