import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Cloud, LogIn, AlertCircle, Upload } from 'lucide-react';
import { BeerDay, CalendarRatings, GoogleSheetConfig, TesterId, UserRating } from './types.ts';
import { INITIAL_BEERS } from './data/initialBeers.ts';
import { Header } from './components/Header.tsx';
import { CalendarOverview } from './components/CalendarOverview.tsx';
import { DayView } from './components/DayView.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { parseBeersFromCsv } from './utils/googleSheets.ts';
import {
  inferTesterIdFromEmail,
  isValidTesterId,
  loadUserProfilePreference,
  saveRatingToFirestore,
  saveUserProfilePreference,
  signInWithUsernameAndPassword,
  signOutUser,
  subscribeToAuth,
  subscribeToRatings,
} from './firebase.ts';
import firebaseConfig from '../firebase-applet-config.json';

const RATINGS_STORAGE_KEY = 'julol_calendar_ratings_2026';
const BEERS_STORAGE_KEY = 'julol_calendar_beers_2026';
const CONFIG_STORAGE_KEY = 'julol_sheet_config_2026';
const ACTIVE_TESTER_STORAGE_KEY = 'julol_active_tester_2026';

function readLocalRatings(): CalendarRatings {
  try {
    const saved = localStorage.getItem(RATINGS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not parse saved ratings', e);
  }
  return {};
}

function formatDatabaseError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("Quota exceeded for quota metric 'Free daily read units per project (free tier database)'")) {
    return `Firestore-kvoten är tillfälligt full för idag och återställs imorgon. Se databasen i Firebase Console: https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;
  }
  if (raw.includes('Quota exceeded')) {
    return 'Firestore-kvoten för den fria nivån är tillfälligt full och återställs imorgon.';
  }
  return 'Kunde inte synka med databasen. Kontrollera din anslutning eller logga in igen.';
}

export default function App() {
  // Determine initial day based on current date (defaults to day in December, or Day 1)
  const getInitialDay = () => {
    const today = new Date();
    if (today.getMonth() === 11) {
      const day = today.getDate();
      return Math.min(24, Math.max(1, day));
    }
    return 1;
  };

  const [selectedDay, setSelectedDay] = useState<number>(getInitialDay);
  const [currentView, setCurrentView] = useState<'calendar' | 'day' | 'leaderboard'>('calendar');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  // Firebase Auth & Shared Database state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dbError, setDbError] = useState<string | null>(null);
  const [hasLoadedRemoteRatings, setHasLoadedRemoteRatings] = useState<boolean>(false);
  const [isMigratingLocal, setIsMigratingLocal] = useState<boolean>(false);

  // Active tester
  const [activeTesterId, setActiveTesterId] = useState<TesterId>(() => {
    const saved = localStorage.getItem(ACTIVE_TESTER_STORAGE_KEY);
    if (saved && isValidTesterId(saved)) {
      return saved;
    }
    return 'isak';
  });

  // Beer catalog
  const [beers, setBeers] = useState<BeerDay[]>(() => {
    try {
      const saved = localStorage.getItem(BEERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: BeerDay) => {
            const init = INITIAL_BEERS.find((b) => b.day === p.day);
            return {
              ...init,
              ...p,
              imageUrl: p.imageUrl || init?.imageUrl,
            };
          });
        }
      }
    } catch (e) {
      console.warn('Could not parse saved beers', e);
    }
    return INITIAL_BEERS;
  });

  // Ratings map (shared Firestore truth when signed in)
  const [ratings, setRatings] = useState<CalendarRatings>(() => readLocalRatings());

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

  // Debounce timers and pending optimistic payloads for smooth slider writes
  const pendingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingPayloadsRef = useRef<
    Record<string, { day: number; testerId: TesterId; userRating: UserRating }>
  >({});
  const activeWritesCountRef = useRef<number>(0);
  const savedResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (!user) {
        setHasLoadedRemoteRatings(false);
        setSavingState('idle');
      }
    });
    return () => unsubscribe();
  }, []);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(pendingTimersRef.current).forEach((timer) => clearTimeout(timer));
      if (savedResetTimerRef.current) {
        clearTimeout(savedResetTimerRef.current);
      }
    };
  }, []);

  // Subscribe to Firestore ratings & load user's saved taster profile only when authenticated
  useEffect(() => {
    if (!authReady || !authUser) {
      return;
    }

    let isCancelled = false;

    loadUserProfilePreference(authUser.uid)
      .then((preferredTester) => {
        if (!isCancelled && preferredTester) {
          setActiveTesterId(preferredTester);
          localStorage.setItem(ACTIVE_TESTER_STORAGE_KEY, preferredTester);
        }
      })
      .catch((err) => {
        console.warn('Could not load profile preference:', err);
      });

    const unsubscribeRatings = subscribeToRatings(
      (remoteRatings) => {
        if (isCancelled) return;
        const merged: CalendarRatings = { ...remoteRatings };
        // Preserve any local optimistic edits currently awaiting debounce/write
        for (const pending of Object.values(pendingPayloadsRef.current)) {
          merged[pending.day] = {
            ...(merged[pending.day] || {}),
            [pending.testerId]: pending.userRating,
          };
        }
        setRatings(merged);
        setHasLoadedRemoteRatings(true);
        setDbError(null);
      },
      (err) => {
        if (isCancelled) return;
        setDbError(formatDatabaseError(err));
      }
    );

    return () => {
      isCancelled = true;
      unsubscribeRatings();
    };
  }, [authReady, authUser]);

  // Detect any pre-existing localStorage ratings not yet stored in Firestore
  const unmigratedLocalEntries = useMemo(() => {
    if (!authUser || !hasLoadedRemoteRatings) return [];
    const local = readLocalRatings();
    const missing: { day: number; testerId: TesterId; userRating: UserRating }[] = [];
    for (const [dayStr, dayRatings] of Object.entries(local)) {
      const day = parseInt(dayStr, 10);
      if (!day || day < 1 || day > 24 || !dayRatings) continue;
      for (const [testerKey, rating] of Object.entries(dayRatings)) {
        if (!isValidTesterId(testerKey) || !rating || typeof rating.score !== 'number') continue;
        if (ratings[day]?.[testerKey] === undefined) {
          missing.push({ day, testerId: testerKey, userRating: rating });
        }
      }
    }
    return missing;
  }, [authUser, hasLoadedRemoteRatings, ratings]);

  const handleMigrateLocalRatings = async () => {
    if (!authUser || unmigratedLocalEntries.length === 0) return;
    setIsMigratingLocal(true);
    setDbError(null);
    try {
      for (const entry of unmigratedLocalEntries) {
        await saveRatingToFirestore(entry.day, entry.testerId, entry.userRating, authUser.uid);
      }
    } catch (err) {
      setDbError(formatDatabaseError(err));
    } finally {
      setIsMigratingLocal(false);
    }
  };

  // Open username/password login modal
  const handleOpenLogin = () => {
    setLoginError(null);
    setDbError(null);
    setIsLoginModalOpen(true);
  };

  // Handle Username/Email + Password Sign-In
  const handleLoginSubmit = async (usernameOrEmail: string, password: string) => {
    setIsSigningIn(true);
    setLoginError(null);
    setDbError(null);
    try {
      const user = await signInWithUsernameAndPassword(usernameOrEmail, password);
      const inferredTester = inferTesterIdFromEmail(user.email);
      if (inferredTester) {
        setActiveTesterId(inferredTester);
        localStorage.setItem(ACTIVE_TESTER_STORAGE_KEY, inferredTester);
        try {
          await saveUserProfilePreference(user.uid, inferredTester);
        } catch (prefErr) {
          console.warn('Could not sync inferred profile preference:', prefErr);
        }
      }
      setIsLoginModalOpen(false);
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-email'
      ) {
        setLoginError('Fel användarnamn eller lösenord.');
      } else if (code === 'auth/operation-not-allowed') {
        setLoginError(
          'E-post/lösenord är inte aktiverat i Firebase Console ännu (Authentication → Sign-in method → Email/Password).'
        );
      } else if (code === 'auth/too-many-requests') {
        setLoginError('För många inloggningsförsök. Vänta en stund och försök igen.');
      } else if (code === 'auth/user-disabled') {
        setLoginError('Detta konto har inaktiverats.');
      } else {
        setLoginError('Inloggningen misslyckades. Försök igen.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Sign-Out
  const handleSignOut = async () => {
    setDbError(null);
    try {
      await signOutUser();
      setRatings(readLocalRatings());
    } catch {
      setDbError('Kunde inte logga ut just nu.');
    }
  };

  // Select active taster profile and persist to Firestore & localStorage
  const handleSelectTester = (id: TesterId) => {
    if (!isValidTesterId(id)) return;
    setActiveTesterId(id);
    localStorage.setItem(ACTIVE_TESTER_STORAGE_KEY, id);
    if (authUser) {
      saveUserProfilePreference(authUser.uid, id).catch((err) => {
        console.warn('Could not save profile preference:', err);
      });
    }
  };

  // Update rating optimistically and persist debounced to Firestore
  const handleUpdateRating = (day: number, testerId: TesterId, userRating: UserRating) => {
    if (!authUser) return;

    const writeKey = `${day}_${testerId}`;
    pendingPayloadsRef.current[writeKey] = { day, testerId, userRating };

    // Immediate optimistic state update for responsive slider dragging
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

    setSavingState('saving');
    if (savedResetTimerRef.current) {
      clearTimeout(savedResetTimerRef.current);
      savedResetTimerRef.current = null;
    }

    if (pendingTimersRef.current[writeKey]) {
      clearTimeout(pendingTimersRef.current[writeKey]);
    }

    const uid = authUser.uid;
    pendingTimersRef.current[writeKey] = setTimeout(async () => {
      delete pendingTimersRef.current[writeKey];
      const latestPayload = pendingPayloadsRef.current[writeKey];
      if (!latestPayload) return;

      activeWritesCountRef.current += 1;
      try {
        await saveRatingToFirestore(
          latestPayload.day,
          latestPayload.testerId,
          latestPayload.userRating,
          uid
        );
        // Clear pending marker only if no newer edit queued while writing
        if (pendingPayloadsRef.current[writeKey] === latestPayload) {
          delete pendingPayloadsRef.current[writeKey];
        }
        setDbError(null);
        activeWritesCountRef.current = Math.max(0, activeWritesCountRef.current - 1);
        if (activeWritesCountRef.current === 0 && Object.keys(pendingTimersRef.current).length === 0) {
          setSavingState('saved');
          savedResetTimerRef.current = setTimeout(() => {
            setSavingState('idle');
          }, 2000);
        }
      } catch (err) {
        activeWritesCountRef.current = Math.max(0, activeWritesCountRef.current - 1);
        delete pendingPayloadsRef.current[writeKey];
        setSavingState('error');
        setDbError(formatDatabaseError(err));
      }
    }, 300);
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

          if (authUser) {
            for (const [dayStr, tRatings] of Object.entries(ratingsPatch)) {
              const d = parseInt(dayStr, 10);
              for (const [testerKey, rating] of Object.entries(tRatings)) {
                if (isValidTesterId(testerKey) && rating) {
                  await saveRatingToFirestore(d, testerKey, rating, authUser.uid);
                }
              }
            }
          }
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
    [sheetConfig, authUser]
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
        authUser={authUser}
        onSignIn={handleOpenLogin}
        onSignOut={handleSignOut}
        isSigningIn={isSigningIn}
      />

      {/* Shared Database Auth / Error / Migration Notices */}
      {authReady && !authUser && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-amber-200">
              <Cloud className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Logga in med ditt användarnamn och lösenord för att hämta och spara betyg i den gemensamma databasen.
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenLogin}
              disabled={isSigningIn}
              className="inline-flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-60 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isSigningIn ? 'Loggar in...' : 'Logga in'}</span>
            </button>
          </div>
        </div>
      )}

      {dbError && (
        <div className="border-b border-red-500/30 bg-red-950/50 px-4 py-2.5">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{dbError}</span>
            </div>
            <button
              type="button"
              onClick={() => setDbError(null)}
              className="text-red-300 hover:text-white underline shrink-0"
            >
              Stäng
            </button>
          </div>
        </div>
      )}

      {authUser && unmigratedLocalEntries.length > 0 && (
        <div className="border-b border-emerald-500/20 bg-emerald-950/30 px-4 py-2.5">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-200">
              <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Det finns {unmigratedLocalEntries.length} lokalt sparade betyg som ännu inte ligger i den gemensamma databasen.
              </span>
            </div>
            <button
              type="button"
              onClick={handleMigrateLocalRatings}
              disabled={isMigratingLocal}
              className="inline-flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-60 shrink-0"
            >
              <span>{isMigratingLocal ? 'Laddar upp...' : 'Synka till databasen'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main App Content Viewport */}
      <main className="flex-1 pb-16">
        {currentView === 'calendar' && (
          <CalendarOverview
            beers={beers}
            ratings={ratings}
            onSelectDay={(day) => {
              setSelectedDay(day);
              setCurrentView('day');
            }}
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
            isAuthenticated={Boolean(authUser)}
            onSignIn={handleOpenLogin}
            isSigningIn={isSigningIn}
            savingState={savingState}
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

      {/* Username & Password Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSubmit={handleLoginSubmit}
        isSigningIn={isSigningIn}
        error={loginError}
        defaultUsername={activeTesterId}
      />

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
            <span>Isak, Ingrid, Gustav, Louise, Ludwig & Emil</span>
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
