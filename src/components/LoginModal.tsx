import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { TESTERS } from '../data/initialBeers.ts';
import { AUTH_EMAIL_DOMAIN } from '../firebase.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (usernameOrEmail: string, password: string) => Promise<void>;
  isSigningIn: boolean;
  error: string | null;
  defaultUsername?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSigningIn,
  error,
  defaultUsername = '',
}) => {
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUsername((prev) => prev || defaultUsername);
      setPassword('');
    }
  }, [isOpen, defaultUsername]);

  if (!isOpen) return null;

  const trimmedUsername = username.trim();
  const resolvedPreview =
    trimmedUsername && !trimmedUsername.includes('@')
      ? `${trimmedUsername.toLowerCase()}@${AUTH_EMAIL_DOMAIN}`
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedUsername || !password || isSigningIn) return;
    await onSubmit(trimmedUsername, password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#14201c] p-6 sm:p-7 border border-amber-950/60 shadow-2xl text-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Stäng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-cinzel">Logga in</h2>
            <p className="text-xs text-slate-400">
              Välj ditt namn eller ange användarnamn och lösenord.
            </p>
          </div>
        </div>

        {/* Quick-select profile chips */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Snabbval användare
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TESTERS.map((tester) => {
              const isActive = trimmedUsername.toLowerCase() === tester.id;
              return (
                <button
                  key={tester.id}
                  type="button"
                  onClick={() => {
                    setUsername(tester.id);
                    passwordInputRef.current?.focus();
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/50'
                      : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-slate-950"
                    style={{ backgroundColor: tester.avatarColor }}
                  >
                    {tester.shortName}
                  </span>
                  <span>{tester.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-username"
              className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1.5"
            >
              Användarnamn eller e-post
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                required
                placeholder="t.ex. isak"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            {resolvedPreview && (
              <p className="mt-1 text-[11px] text-slate-500">
                Loggar in som <span className="font-mono text-slate-400">{resolvedPreview}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1.5"
            >
              Lösenord
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={passwordInputRef}
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Ange lösenord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSigningIn || !trimmedUsername || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSigningIn ? 'Loggar in...' : 'Logga in'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
