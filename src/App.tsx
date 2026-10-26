import React, { useState, useEffect, useCallback } from 'react';
import { BeerDay, CalendarRatings, GoogleSheetConfig, TesterId, UserRating } from './types.ts';
import { INITIAL_BEERS, TESTERS } from './data/initialBeers.ts';
import { Header } from './components/Header.tsx';
import { CalendarOverview } from './components/CalendarOverview.tsx';
import { DayView } from './components/DayView.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal.tsx';
import { parseBeersFromCsv } from './utils/googleSheets.ts';

const RATINGS_STORAGE_KEY = 'julol_calendar_ratings_2026';
const BEERS_STORAGE_KEY = 'julol_calendar_beers_2026';
const CONFIG_STORAGE_KEY = 'julol_sheet_config_2026';
const ACTIVE_TESTER_STORAGE_KEY = 'julol_active_tester_2026';

export default function App() {
  // Determine initial day based on current date (defaults to day in December, or Day 1)
  const getInitialDay = () => {
    const today = new Date();
    if (today.getMonth() === 11) {
      // December (0-indexed 11)
      const day = today.getDate();
      return Math.min(24, Math.max(1, day));
    }
    return 1;
  };

  const [selectedDay, setSelectedDay] = useState<number>(getInitialDay);
  const [currentView, setCurrentView] = useState<'calendar' | 'day' | 'leaderboard'>('calendar');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Active tester
  const [activeTesterId, setActiveTesterId] = useState<TesterId>(() => {
    const saved = localStorage.getItem(ACTIVE_TESTER_STORAGE_KEY);
    if (saved && (saved === 'isak' || saved === 'ingrid' || saved === 'gustav' || saved === 'louise')) {
      return saved as TesterId;
    }
    return 'isak';
  });

  // Beer catalog
  const [beers, setBeers] = useState<BeerDay[]>(() => {
    try {
      const saved = localStorage.getItem(BEERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved beers', e);
    }
    return INITIAL_BEERS;
  });

  // Ratings map
  const [ratings, setRatings] = useState<CalendarRatings>(() => {
    try {
      const saved = localStorage.getItem(RATINGS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not parse saved ratings', e);
    }
    return {};
  });

  // Google Sheet Configuration
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not parse saved sheet config', e);
    }
    return {
      sheetUrl: '',
      autoSync: true,
      syncStatus: 'idle',
    };
  });

  // Save active tester to localStorage
  const handleSelectTester = (id: TesterId) => {
    setActiveTesterId(id);
    localStorage.setItem(ACTIVE_TESTER_STORAGE_KEY, id);
  };

  // Save ratings to localStorage
  const handleUpdateRating = (day: number, testerId: TesterId, userRating: UserRating) => {
    setRatings((prev) => {
      const nextDayRatings = {
        ...(prev[day] || {}),
        [testerId]: userRating,
      };
      const nextRatings = {
        ...prev,
        [day]: nextDayRatings,
      };
      localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(nextRatings));
      return nextRatings;
    });
  };

  // Save sheet config to localStorage
  const handleSaveConfig = (newConfig: GoogleSheetConfig) => {
    setSheetConfig(newConfig);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
  };

  // Google Sheet Sync fetcher
  const syncWithGoogleSheet = useCallback(
    async (overrideUrl?: string): Promise<boolean> => {
      const urlToFetch = overrideUrl || sheetConfig.sheetUrl;
      if (!urlToFetch) return false;

      try {
        setSheetConfig((prev) => ({ ...prev, syncStatus: 'syncing' }));

        const response = await fetch(urlToFetch, { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error(`Kunde inte hämta kalkylark: HTTP ${response.status}`);
        }

        const csvText = await response.text();
        const { beers: updatedBeers, ratingsPatch } = parseBeersFromCsv(csvText);

        if (updatedBeers.length > 0) {
          setBeers(updatedBeers);
          localStorage.setItem(BEERS_STORAGE_KEY, JSON.stringify(updatedBeers));
        }

        if (ratingsPatch && Object.keys(ratingsPatch).length > 0) {
          setRatings((prev) => {
            const merged: CalendarRatings = { ...prev };
            for (const [dayStr, tRatings] of Object.entries(ratingsPatch)) {
              const d = parseInt(dayStr, 10);
              merged[d] = {
                ...(merged[d] || {}),
                ...tRatings,
              };
            }
            localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }

        const updatedConfig: GoogleSheetConfig = {
          ...sheetConfig,
          sheetUrl: urlToFetch,
          syncStatus: 'success',
          lastSyncTime: new Date().toLocaleTimeString('sv-SE', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        handleSaveConfig(updatedConfig);
        return true;
      } catch (err: any) {
        console.error('Google Sheet sync failed:', err);
        const errorConfig: GoogleSheetConfig = {
          ...sheetConfig,
          sheetUrl: urlToFetch,
          syncStatus: 'error',
          errorMessage: err.message || 'Okänt fel vid synkning',
        };
        handleSaveConfig(errorConfig);
        return false;
      }
    },
    [sheetConfig]
  );

  // Auto-sync on mount if enabled
  useEffect(() => {
    if (sheetConfig.autoSync && sheetConfig.sheetUrl) {
      syncWithGoogleSheet();
    }
  }, []);

  const currentBeer = beers.find((b) => b.day === selectedDay) || beers[0] || INITIAL_BEERS[0];
  const currentDayRatings = ratings[selectedDay] || {};

  return (
    <div className="min-h-screen bg-[#0c1412] text-slate-100 selection:bg-amber-500 selection:text-slate-950 flex flex-col font-sans">
      {/* Universal Top Navigation Header */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        activeTesterId={activeTesterId}
        onSelectTester={handleSelectTester}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        syncStatus={sheetConfig.syncStatus}
        selectedDay={selectedDay}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 pb-16">
        {currentView === 'calendar' && (
          <CalendarOverview
            beers={beers}
            ratings={ratings}
            activeTesterId={activeTesterId}
            onSelectDay={(day) => {
              setSelectedDay(day);
              setCurrentView('day');
            }}
            onOpenSync={() => setIsSyncModalOpen(true)}
          />
        )}

        {currentView === 'day' && (
          <DayView
            day={selectedDay}
            beer={currentBeer}
            totalDays={beers.length}
            ratings={currentDayRatings}
            activeTesterId={activeTesterId}
            onUpdateRating={handleUpdateRating}
            onNavigateDay={(day) => setSelectedDay(day)}
          />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView
            beers={beers}
            ratings={ratings}
            onSelectDay={(day) => {
              setSelectedDay(day);
              setCurrentView('day');
            }}
          />
        )}
      </main>

      {/* Google Sheets Sync Drawer / Modal */}
      <GoogleSheetSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        config={sheetConfig}
        onSaveConfig={handleSaveConfig}
        onTriggerSync={syncWithGoogleSheet}
        beers={beers}
        ratings={ratings}
      />

      {/* Subtle Hygge Footer */}
      <footer className="border-t border-amber-950/30 bg-[#080d0c] py-6 px-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-cinzel font-bold text-amber-400">Julölskalendern 2026</span>
            <span>·</span>
            <span>Isak, Ingrid, Gustav & Louise</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>24 Svenska Julöl</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="text-amber-400 hover:underline"
            >
              Google Sheets Sync
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
