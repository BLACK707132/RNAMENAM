import { useEffect, useState } from 'react';
import {
  X,
  UserPlus,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  AtSign,
  Lock,
  Trophy,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  clearAuthSession,
  loginAccount,
  registerAccount,
  type AuthUser,
  type SyncSavePayload,
} from '../utils/accountApi';

interface AuthModalProps {
  user: AuthUser | null;
  currentSave: SyncSavePayload;
  myRank: number | null;
  initialTab?: 'register' | 'login';
  onAuthSuccess: (user: AuthUser, serverSave: SyncSavePayload, isNewRegistration: boolean) => void;
  onLogout: () => void;
  onOpenLeaderboard: () => void;
  onClose: () => void;
}

export function AuthModal({
  user,
  currentSave,
  myRank,
  initialTab = 'register',
  onAuthSuccess,
  onLogout,
  onOpenLeaderboard,
  onClose,
}: AuthModalProps) {
  const [tab, setTab] = useState<'register' | 'login'>(initialTab);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().replace(/^@+/, '');
    if (cleanUser.length < 3 || cleanUser.length > 18) {
      setError('Юз должен быть от 3 до 18 символов (буквы, цифры, _ или -).');
      return;
    }
    if (password.length < 4) {
      setError('Пароль должен быть минимум 4 символа.');
      return;
    }
    if (tab === 'register' && password !== confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    setLoading(true);
    if (tab === 'register') {
      const res = await registerAccount(cleanUser, password, currentSave);
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onAuthSuccess(res.data.user, res.data.save, true);
      onClose();
    } else {
      const res = await loginAccount(cleanUser, password);
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onAuthSuccess(res.data.user, res.data.save, false);
      onClose();
    }
  };

  const handleLogoutClick = () => {
    clearAuthSession();
    onLogout();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center p-3.5 sm:p-4 bg-[#0a0d12]/82 backdrop-blur-[2px] overflow-y-auto mobile-scroll"
      style={{
        paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-[#161c24]/98 border border-white/10 p-5 sm:p-6 shadow-2xl my-auto text-left">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#ff6a1a]/15 border border-[#ff6a1a]/30 flex items-center justify-center text-[#ff8b4a] shrink-0">
              {user ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : tab === 'register' ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-black text-white leading-tight">
                {user ? 'Мой аккаунт' : tab === 'register' ? 'Регистрация' : 'Вход в аккаунт'}
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                {user
                  ? 'Твои монеты участвуют в Топе богатых'
                  : 'Создай юз с паролем, чтобы попасть в Топ богатых'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно аккаунта"
            className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#1e2631] border border-white/10 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-white/55 font-semibold">Твой юз</span>
                <span className="font-display text-lg font-extrabold text-white">
                  @{user.username}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/8">
                <span className="text-xs text-white/55 font-semibold">Баланс в топе</span>
                <span className="font-mono-num text-sm font-extrabold text-[#ffd34d]">
                  🪙 {Math.floor(currentSave.coins).toLocaleString('ru-RU')}
                </span>
              </div>
              {myRank !== null && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/8">
                  <span className="text-xs text-white/55 font-semibold">Место в топе</span>
                  <span className="font-mono-num text-sm font-extrabold text-[#ff8b4a]">
                    #{myRank}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLeaderboard();
                }}
                className="w-full h-11 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-display font-bold text-base flex items-center justify-center gap-2 transition"
              >
                <Trophy className="w-4 h-4" />
                Открыть Топ богатых
              </button>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full h-11 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-400/35 text-white/80 hover:text-red-200 font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                Выйти из аккаунта
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#10151c] border border-white/8 mb-4">
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError('');
                }}
                className={`h-9 rounded-lg text-xs sm:text-sm font-bold transition ${
                  tab === 'register'
                    ? 'bg-[#ff6a1a] text-white shadow'
                    : 'text-white/65 hover:text-white'
                }`}
              >
                Регистрация
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError('');
                }}
                className={`h-9 rounded-lg text-xs sm:text-sm font-bold transition ${
                  tab === 'login'
                    ? 'bg-[#ff6a1a] text-white shadow'
                    : 'text-white/65 hover:text-white'
                }`}
              >
                Уже есть юз
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Username (Юз) */}
              <div>
                <label className="block text-xs font-semibold text-white/75 mb-1.5">
                  {tab === 'register' ? 'Создать юз (никнейм)' : 'Твой юз'}
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.replace(/\s+/g, ''));
                      setError('');
                    }}
                    placeholder="stant_pro"
                    maxLength={18}
                    autoComplete="username"
                    spellCheck={false}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#1d2530] border border-white/15 focus:border-[#ff6a1a] outline-none text-sm font-bold text-white placeholder:font-normal placeholder:text-white/35"
                  />
                </div>
                {tab === 'register' && (
                  <p className="text-[11px] text-white/45 mt-1">
                    От 3 до 18 символов: буквы, цифры, _ или -
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-white/75 mb-1.5">
                  {tab === 'register' ? 'Придумай пароль' : 'Пароль'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Минимум 4 символа"
                    maxLength={64}
                    autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                    className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#1d2530] border border-white/15 focus:border-[#ff6a1a] outline-none text-sm font-semibold text-white placeholder:font-normal placeholder:text-white/35"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Скрыть пароль' : 'Показать пароль'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center text-white/55 hover:text-white hover:bg-white/5 transition"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password on Register */}
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-white/75 mb-1.5">
                    Повтори пароль
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="Введи пароль ещё раз"
                      maxLength={64}
                      autoComplete="new-password"
                      className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#1d2530] border border-white/15 focus:border-[#ff6a1a] outline-none text-sm font-semibold text-white placeholder:font-normal placeholder:text-white/35"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Скрыть пароль' : 'Показать пароль'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center text-white/55 hover:text-white hover:bg-white/5 transition"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {tab === 'register' && (
                <div className="rounded-xl bg-[#1b222c] border border-white/8 px-3.5 py-2.5 text-xs text-white/70">
                  Твой текущий баланс{' '}
                  <b className="text-[#ffd34d] font-mono-num">
                    🪙 {Math.floor(currentSave.coins).toLocaleString('ru-RU')}
                  </b>{' '}
                  и все самокаты сохранятся на этот юз.
                </div>
              )}

              {error && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ff7b72]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !username.trim() || !password}
                className="w-full h-12 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] disabled:opacity-40 text-white font-display font-bold text-base flex items-center justify-center gap-2 shadow-lg transition"
              >
                {tab === 'register' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    {loading ? 'Создаём юз...' : 'Зарегистрироваться'}
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    {loading ? 'Входим...' : 'Войти'}
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
