import React, { useState, useRef } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { TESTERS } from '../data/initialBeers.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface LoginScreenProps {
  onSubmit: (usernameOrEmail: string, password: string) => Promise<void>;
  isSigningIn: boolean;
  error: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSubmit,
  isSigningIn,
  error,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const trimmedUsername = username.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedUsername || !password || isSigningIn) return;
    await onSubmit(trimmedUsername, password);
  };

  return (
    <div className="min-h-screen bg-[#0c1412] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Subtle festive ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_55%)]" />

      <div className="relative w-full max-w-md">
        {/* Brand Emblem & Title */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-3xl border border-amber-500/30 shadow-lg shadow-amber-950/30">
            🎄
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-100 font-cinzel tracking-tight">
            Julölskalendern 2026
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Logga in med ditt konto för att öppna kalendern och sätta betyg.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-[#14201c] p-6 sm:p-8 border border-amber-950/60 shadow-2xl text-slate-200">
          {/* Quick-select profile chips */}
          <div className="mb-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Välj vem du är
            </div>
            <div className="grid grid-cols-3 gap-2">
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
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all border ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm'
                        : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span
                      className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-slate-950 shrink-0"
                      style={{ backgroundColor: tester.avatarColor }}
                    >
                      {tester.shortName}
                    </span>
                    <span className="truncate">{tester.name}</span>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50 shadow-lg shadow-amber-950/30"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSigningIn ? 'Loggar in...' : 'Logga in'}</span>
            </button>
          </form>
        </div>

        <div className="mt-5 flex justify-center">
          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
};
