import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, LogOut, User, X } from 'lucide-react';
import { GAME_PWA_URL } from '../data/gameData';
import type { RegisteredUser } from './Header';

export interface StoredAccount {
  nickname: string;
  password: string;
  createdAt: string;
}

interface AuthModalProps {
  isOpen: boolean;
  user: RegisteredUser | null;
  onClose: () => void;
  onLoginSuccess: (user: RegisteredUser) => void;
  onLogout: () => void;
}

type AuthMode = 'register' | 'login';

const ACCOUNTS_KEY = 'scooter_stunt_accounts';

function readAccounts(): StoredAccount[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage quota errors
  }
}

export function AuthModal({
  isOpen,
  user,
  onClose,
  onLoginSuccess,
  onLogout,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('register');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetFields = () => {
    setNickname('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanNick = nickname.trim();

    if (cleanNick.length < 3) {
      setError('Никнейм должен быть не короче 3 символов.');
      return;
    }

    if (/\s/.test(cleanNick)) {
      setError('Никнейм не должен содержать пробелы.');
      return;
    }

    if (password.length < 4) {
      setError('Пароль должен быть не короче 4 символов.');
      return;
    }

    const accounts = readAccounts();

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Пароли не совпадают. Проверьте ввод.');
        return;
      }

      const exists = accounts.some(
        (acc) => acc.nickname.toLowerCase() === cleanNick.toLowerCase(),
      );
      if (exists) {
        setError('Этот ник уже занят. Выберите другой или перейдите во вкладку «Вход».');
        return;
      }

      const newAccount: StoredAccount = {
        nickname: cleanNick,
        password,
        createdAt: new Date().toLocaleDateString('ru-RU'),
      };

      saveAccounts([...accounts, newAccount]);
      resetFields();
      onLoginSuccess({
        nickname: newAccount.nickname,
        createdAt: newAccount.createdAt,
      });
      return;
    }

    const matched = accounts.find(
      (acc) =>
        acc.nickname.toLowerCase() === cleanNick.toLowerCase() && acc.password === password,
    );

    if (!matched) {
      setError('Неверный никнейм или пароль.');
      return;
    }

    resetFields();
    onLoginSuccess({
      nickname: matched.nickname,
      createdAt: matched.createdAt,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/15 bg-[#191F2C] p-6 shadow-2xl md:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-wide text-orange-400">
              {user ? 'Профиль игрока' : 'Аккаунт для игры'}
            </p>
            <h2
              id="auth-modal-title"
              className="font-display mt-1 text-2xl font-bold text-white"
            >
              {user
                ? user.nickname
                : mode === 'register'
                  ? 'Регистрация'
                  : 'Вход в игру'}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Закрыть окно"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {user ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-lime-400 text-slate-950">
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-base font-bold text-white">{user.nickname}</div>
                  <div className="text-xs font-medium text-slate-300">
                    Создан: {user.createdAt}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-lime-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Вы вошли в аккаунт игрока.</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={GAME_PWA_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-orange-400"
              >
                Открыть PWA
              </a>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 cursor-pointer"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-[#11151E] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`min-h-10 rounded-md py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-orange-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Регистрация
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`min-h-10 rounded-md py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-orange-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Вход
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
              <div>
                <label htmlFor="auth-nick" className="block text-xs font-semibold text-slate-300">
                  Никнейм
                </label>
                <input
                  id="auth-nick"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Придумайте ник"
                  className="mt-1.5 block min-h-11 w-full rounded-lg border border-white/15 bg-[#11151E] px-3.5 py-2 text-sm font-medium text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="auth-pass" className="block text-xs font-semibold text-slate-300">
                  Пароль
                </label>
                <input
                  id="auth-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 4 символа"
                  className="mt-1.5 block min-h-11 w-full rounded-lg border border-white/15 bg-[#11151E] px-3.5 py-2 text-sm font-medium text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="auth-confirm-pass"
                    className="block text-xs font-semibold text-slate-300"
                  >
                    Повторите пароль
                  </label>
                  <input
                    id="auth-confirm-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Введите пароль ещё раз"
                    className="mt-1.5 block min-h-11 w-full rounded-lg border border-white/15 bg-[#11151E] px-3.5 py-2 text-sm font-medium text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs font-medium text-red-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="min-h-11 w-full rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-orange-400 cursor-pointer"
              >
                {mode === 'register' ? 'Зарегистрироваться' : 'Войти в игру'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
