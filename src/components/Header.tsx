import React, { useState } from 'react';
import { Calendar, Award, Beer, RefreshCw, UserCheck, ChevronDown, Check } from 'lucide-react';
import { Tester, TesterId } from '../types.ts';
import { TESTERS } from '../data/initialBeers.ts';

interface HeaderProps {
  currentView: 'calendar' | 'day' | 'leaderboard';
  onNavigate: (view: 'calendar' | 'day' | 'leaderboard') => void;
  activeTesterId: TesterId;
  onSelectTester: (id: TesterId) => void;
  onOpenSyncModal: () => void;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  selectedDay: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  activeTesterId,
  onSelectTester,
  onOpenSyncModal,
  syncStatus,
  selectedDay,
}) => {
  const [isTesterMenuOpen, setIsTesterMenuOpen] = useState(false);
  const activeTester = TESTERS.find((t) => t.id === activeTesterId) || TESTERS[0];

  return (
    <header className="sticky top-0 z-40 border-b border-amber-950/30 bg-[#0c1412]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 md:gap-8 px-4 py-3 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('calendar')}
          className="group flex items-center gap-2.5 text-left text-lg md:text-xl font-bold tracking-tight text-amber-100 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 font-cinzel"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:bg-amber-500/30">
            🎄
          </span>
          <span>Julölskalendern</span>
        </button>

        {/* Zone 2: 4 single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
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
            onClick={() => onNavigate('day')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 ${
              currentView === 'day' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : 'text-slate-300'
            }`}
          >
            <Beer className="w-4 h-4" />
            <span>Dag {selectedDay}</span>
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

          <button
            type="button"
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 text-slate-400 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-amber-400' : ''}`} />
            <span>Google Sheet</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action — Active Tester Persona Switcher */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsTesterMenuOpen(!isTesterMenuOpen)}
            className="flex items-center gap-2 rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 border border-slate-700/80 hover:border-amber-500/50 hover:bg-slate-800 transition-all shadow-sm"
            aria-expanded={isTesterMenuOpen}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-slate-950"
              style={{ backgroundColor: activeTester.avatarColor }}
            >
              {activeTester.shortName}
            </span>
            <span className="hidden sm:inline text-slate-400">Provar:</span>
            <span className="font-semibold text-white">{activeTester.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Persona Switcher Dropdown */}
          {isTesterMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsTesterMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#14201c] p-2 text-slate-200 shadow-2xl border border-amber-950/50 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-amber-400/80 border-b border-slate-800/80">
                  Vem sätter betyg nu?
                </div>
                <div className="mt-1 space-y-1">
                  {TESTERS.map((tester) => {
                    const isSelected = tester.id === activeTesterId;
                    return (
                      <button
                        key={tester.id}
                        type="button"
                        onClick={() => {
                          onSelectTester(tester.id);
                          setIsTesterMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                          isSelected
                            ? 'bg-amber-500/15 text-white font-semibold'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-slate-950 shadow-sm"
                            style={{ backgroundColor: tester.avatarColor }}
                          >
                            {tester.shortName}
                          </span>
                          <div>
                            <div className="font-medium">{tester.name}</div>
                            <div className="text-[10px] text-slate-400">{tester.favoriteStyle}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-900 bg-[#0c1412]/95 px-2 py-2 text-xs">
        <button
          type="button"
          onClick={() => onNavigate('calendar')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
            currentView === 'calendar' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Kalender</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('day')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
            currentView === 'day' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Beer className="w-4 h-4" />
          <span>Dag {selectedDay}</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('leaderboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
            currentView === 'leaderboard' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Topplista</span>
        </button>
        <button
          type="button"
          onClick={onOpenSyncModal}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-slate-400"
        >
          <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin text-amber-400' : ''}`} />
          <span>Sync</span>
        </button>
      </div>
    </header>
  );
};
