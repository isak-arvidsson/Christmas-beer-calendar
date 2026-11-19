import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Award,
  Beer,
  LogOut,
  X,
} from 'lucide-react';
import { TesterId } from '../types.ts';
import { TESTERS } from '../data/initialBeers.ts';

interface HeaderProps {
  currentView: 'calendar' | 'day' | 'leaderboard';
  onNavigate: (view: 'calendar' | 'day' | 'leaderboard') => void;
  activeTesterId: TesterId;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  activeTesterId,
  onSignOut,
}) => {
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const activeTester = TESTERS.find((t) => t.id === activeTesterId) || TESTERS[0];

  useEffect(() => {
    if (!isLogoutDialogOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLogoutDialogOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoutDialogOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-amber-950/30 bg-[#0c1412]/90 backdrop-blur-md">
        <div className="mx-auto flex md:grid md:grid-cols-[1fr_auto_1fr] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={() => onNavigate('day')}
              className="group flex items-center gap-2.5 text-left text-base sm:text-lg md:text-xl font-bold tracking-tight text-amber-100 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 font-cinzel"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:bg-amber-500/30">
                🎄
              </span>
              <span>Julölskalendern</span>
            </button>
          </div>

          {/* Zone 2: 3 centered navigation links */}
          <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-10 text-sm font-medium text-slate-300">
            <button
              type="button"
              onClick={() => onNavigate('day')}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 ${
                currentView === 'day' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-300'
              }`}
            >
              <Beer className="w-4 h-4" />
              <span>Dagens lucka</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 ${
                currentView === 'calendar' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Kalender</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('leaderboard')}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 ${
                currentView === 'leaderboard' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-300'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Topplista</span>
            </button>
          </nav>

          {/* Zone 3: Locked Profile Button (opens logout confirmation dialog) */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(true)}
              title={`Inloggad som ${activeTester.name}. Klicka för att logga ut.`}
              className="flex items-center gap-2 rounded-xl bg-slate-900/90 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 border border-slate-700/80 hover:border-amber-500/50 hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap shrink-0"
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-slate-950"
                style={{ backgroundColor: activeTester.avatarColor }}
              >
                {activeTester.shortName}
              </span>
              <span className="hidden lg:inline text-slate-400">Provar:</span>
              <span className="font-semibold text-white">{activeTester.name}</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <nav className="grid grid-cols-3 md:hidden border-t border-slate-900 bg-[#0c1412]/95 px-2 py-2 text-xs">
          <button
            type="button"
            onClick={() => onNavigate('day')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-lg text-center ${
              currentView === 'day' ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Beer className="w-4 h-4" />
            <span>Dagens lucka</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-lg text-center ${
              currentView === 'calendar' ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Kalender</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('leaderboard')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-lg text-center ${
              currentView === 'leaderboard' ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Topplista</span>
          </button>
        </nav>
      </header>

      {/* Logout Confirmation Dialog */}
      {isLogoutDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setIsLogoutDialogOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-[#14201c] p-6 border border-amber-950/60 shadow-2xl text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Stäng"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-slate-950 shrink-0 shadow-sm"
                style={{ backgroundColor: activeTester.avatarColor }}
              >
                {activeTester.shortName}
              </span>
              <div>
                <h2 id="logout-dialog-title" className="text-lg font-bold text-white font-cinzel">
                  Vill du logga ut?
                </h2>
                <p className="text-xs text-slate-400">
                  Inloggad som {activeTester.name}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              För att sätta betyg med en annan profil behöver du logga ut och logga in på nytt.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsLogoutDialogOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutDialogOpen(false);
                  onSignOut();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition-colors shadow-md"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logga ut</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
