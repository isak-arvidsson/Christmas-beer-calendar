import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { AlertCircle, Loader2 } from 'lucide-react';
import { CalendarRatings, TesterId, UserRating } from './types.ts';
import { INITIAL_BEERS } from './data/initialBeers.ts';
import { Header } from './components/Header.tsx';
import { CalendarOverview } from './components/CalendarOverview.tsx';
import { DayView } from './components/DayView.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import {
  deleteRatingFromFirestore,
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

const LEGACY_RATINGS_STORAGE_KEY = 'julol_calendar_ratings_2026';
const ACTIVE_TESTER_STORAGE_KEY = 'julol_active_tester_2026';

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

function getTodayHatchDay(): number {
  const today = new Date();
  if (today.getMonth() === 11) {
    return Math.min(24, Math.max(1, today.getDate()));
  }
  return 1;
}

export default function App() {
  const [selectedDay, setSelectedDay] = useState<number>(getTodayHatchDay);
  const [currentView, setCurrentView] = useState<'calendar' | 'day' | 'leaderboard'>('day');

  // Firebase Auth & Shared Database state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dbError, setDbError] = useState<string | null>(null);

  // Active tester (locked to the signed-in account)
  const [activeTesterId, setActiveTesterId] = useState<TesterId>(() => {
    const saved = localStorage.getItem(ACTIVE_TESTER_STORAGE_KEY);
    if (saved && isValidTesterId(saved)) {
      return saved;
    }
    return 'isak';
  });

  // Static beer catalog
  const beers = INITIAL_BEERS;

  // Ratings map (Firestore is the sole source of truth)
  const [ratings, setRatings] = useState<CalendarRatings>({});
  const remoteRatingsRef = useRef<CalendarRatings>({});

  // Debounce timers and pending optimistic payloads for smooth slider writes
  const pendingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingPayloadsRef = useRef<
    Record<string, { day: number; testerId: TesterId; userRating: UserRating }>
  >({});
  const activeWritesCountRef = useRef<number>(0);
  const savedResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Remove any legacy locally cached ratings from previous versions
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_RATINGS_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Subscribe to Firebase Auth and lock activeTesterId to the signed-in user
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (user) {
        const inferred = inferTesterIdFromEmail(user.email);
        if (inferred) {
          setActiveTesterId(inferred);
          localStorage.setItem(ACTIVE_TESTER_STORAGE_KEY, inferred);
        }
      } else {
        setSavingState('idle');
        remoteRatingsRef.current = {};
        setRatings({});
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

  // Subscribe to Firestore ratings & sync profile preference only when authenticated
  useEffect(() => {
    if (!authReady || !authUser) {
      return;
    }

    let isCancelled = false;

    const inferred = inferTesterIdFromEmail(authUser.email);
    if (!inferred) {
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
    }

    const unsubscribeRatings = subscribeToRatings(
      (remoteRatings) => {
        if (isCancelled) return;
        remoteRatingsRef.current = remoteRatings;
        const merged: CalendarRatings = { ...remoteRatings };
        // Preserve in-flight slider edits currently awaiting debounced Firestore write
        for (const pending of Object.values(pendingPayloadsRef.current)) {
          merged[pending.day] = {
            ...(merged[pending.day] || {}),
            [pending.testerId]: pending.userRating,
          };
        }
        setRatings(merged);
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

  // Handle Sign-Out (returns user to mandatory LoginScreen so another profile can log in)
  const handleSignOut = async () => {
    setDbError(null);
    setLoginError(null);
    Object.values(pendingTimersRef.current).forEach((timer) => clearTimeout(timer));
    pendingTimersRef.current = {};
    pendingPayloadsRef.current = {};
    try {
      await signOutUser();
    } catch {
      setDbError('Kunde inte logga ut just nu.');
    }
  };

  // Update rating optimistically for the locked active tester and persist debounced to Firestore
  const handleUpdateRating = (day: number, testerId: TesterId, userRating: UserRating) => {
    if (!authUser || testerId !== activeTesterId) return;

    const writeKey = `${day}_${testerId}`;
    pendingPayloadsRef.current[writeKey] = { day, testerId, userRating };

    // Immediate in-memory optimistic state update for responsive slider dragging
    setRatings((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [testerId]: userRating,
      },
    }));

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
        // Revert UI back to confirmed database state on write failure
        const reverted: CalendarRatings = { ...remoteRatingsRef.current };
        for (const pending of Object.values(pendingPayloadsRef.current)) {
          reverted[pending.day] = {
            ...(reverted[pending.day] || {}),
            [pending.testerId]: pending.userRating,
          };
        }
        setRatings(reverted);
        setSavingState('error');
        setDbError(formatDatabaseError(err));
      }
    }, 300);
  };

  // Clear the active tester's rating for a specific day in Firestore
  const handleClearRating = async (day: number, testerId: TesterId) => {
    if (!authUser || testerId !== activeTesterId) return;

    const writeKey = `${day}_${testerId}`;
    if (pendingTimersRef.current[writeKey]) {
      clearTimeout(pendingTimersRef.current[writeKey]);
      delete pendingTimersRef.current[writeKey];
    }
    delete pendingPayloadsRef.current[writeKey];

    // Optimistic removal in memory
    setRatings((prev) => {
      const existingDay = prev[day];
      if (!existingDay || existingDay[testerId] === undefined) return prev;
      const nextDay = { ...existingDay };
      delete nextDay[testerId];
      return {
        ...prev,
        [day]: nextDay,
      };
    });

    setSavingState('saving');
    if (savedResetTimerRef.current) {
      clearTimeout(savedResetTimerRef.current);
      savedResetTimerRef.current = null;
    }

    activeWritesCountRef.current += 1;
    try {
      await deleteRatingFromFirestore(day, testerId);
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
      const reverted: CalendarRatings = { ...remoteRatingsRef.current };
      for (const pending of Object.values(pendingPayloadsRef.current)) {
        reverted[pending.day] = {
          ...(reverted[pending.day] || {}),
          [pending.testerId]: pending.userRating,
        };
      }
      setRatings(reverted);
      setSavingState('error');
      setDbError(formatDatabaseError(err));
    }
  };

  // Initial auth loading screen
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0c1412] text-slate-100 flex flex-col items-center justify-center gap-3 font-sans">
        <span className="text-3xl">🎄</span>
        <div className="flex items-center gap-2 text-sm text-amber-200">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Laddar Julölskalendern...</span>
        </div>
      </div>
    );
  }

  // Mandatory Login Gate before accessing the app
  if (!authUser) {
    return (
      <>
        <LoginScreen
          onSubmit={handleLoginSubmit}
          isSigningIn={isSigningIn}
          error={loginError}
        />
        <OfflineIndicator />
      </>
    );
  }

  const handleNavigate = (view: 'calendar' | 'day' | 'leaderboard') => {
    if (view === 'day') {
      setSelectedDay(getTodayHatchDay());
    }
    setCurrentView(view);
  };

  const currentBeer = beers.find((b) => b.day === selectedDay) || beers[0];
  const currentDayRatings = ratings[selectedDay] || {};

  return (
    <div className="min-h-screen bg-[#0c1412] text-slate-100 selection:bg-amber-500 selection:text-slate-950 flex flex-col font-sans">
      {/* Universal Top Navigation Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        activeTesterId={activeTesterId}
        onSignOut={handleSignOut}
      />

      {/* Shared Database Error Notice */}
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
            onClearRating={handleClearRating}
            onNavigateDay={(day) => setSelectedDay(day)}
            isAuthenticated={Boolean(authUser)}
            onSignIn={() => {}}
            isSigningIn={isSigningIn}
            savingState={savingState}
          />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView
            beers={beers}
            ratings={ratings}
            activeTesterId={activeTesterId}
            onSelectDay={(day) => {
              setSelectedDay(day);
              setCurrentView('day');
            }}
          />
        )}
      </main>
      <OfflineIndicator />
    </div>
  );
}
