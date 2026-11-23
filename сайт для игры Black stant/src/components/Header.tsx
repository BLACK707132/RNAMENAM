import { useState } from 'react';
import { Menu, User, X } from 'lucide-react';

export interface RegisteredUser {
  nickname: string;
  createdAt: string;
}

interface HeaderProps {
  user: RegisteredUser | null;
  onOpenAuth: () => void;
}

const NAV_LINKS = [
  { href: '#features', label: 'Об игре' },
  { href: '#download', label: 'PWA-приложение' },
];

export function Header({ user, onOpenAuth }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0B0E14]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-6">
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
        >
          BLACK <span className="text-orange-500">STANT</span>
        </a>

        <nav
          aria-label="Основная навигация"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 border-b-2 border-transparent py-1 transition-colors duration-150 hover:border-orange-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenAuth}
            className={`hidden sm:inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 ${
              user
                ? 'border border-lime-400/40 bg-lime-400/10 text-lime-300 hover:bg-lime-400/20'
                : 'bg-orange-500 text-slate-950 hover:bg-orange-400 hover:shadow-[0_0_20px_-4px_rgba(249,115,22,0.55)]'
            }`}
          >
            {user ? (
              <>
                <User className="h-4 w-4" aria-hidden="true" />
                <span className="max-w-36 truncate">{user.nickname}</span>
              </>
            ) : (
              <span>Вход и регистрация</span>
            )}
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#191F2C] text-slate-200 transition-colors hover:bg-slate-800 md:hidden focus-visible:outline-2 focus-visible:outline-orange-500 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#11151E] px-6 py-4 md:hidden">
          <nav aria-label="Мобильная навигация" className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center text-base font-semibold text-slate-200 transition-colors hover:text-orange-400"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth();
              }}
              className="mt-2 flex min-h-11 w-full items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-orange-400 cursor-pointer"
            >
              {user ? `Игрок: ${user.nickname}` : 'Вход и регистрация'}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
