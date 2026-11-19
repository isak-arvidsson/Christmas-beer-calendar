import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { CalendarRatings, TesterId, UserRating } from './types.ts';

const CALENDAR_ID = 'julol-2026';
const VALID_TESTER_IDS: TesterId[] = ['emil', 'gustav', 'hanna', 'ingrid', 'isak', 'louise', 'ludwig'];
export const AUTH_EMAIL_DOMAIN = 'julol.local';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export function isValidTesterId(id: string): id is TesterId {
  return VALID_TESTER_IDS.includes(id as TesterId);
}

export function resolveLoginEmail(usernameOrEmail: string): string {
  const trimmed = usernameOrEmail.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  return `${trimmed}@${AUTH_EMAIL_DOMAIN}`;
}

export function inferTesterIdFromEmail(email: string | null | undefined): TesterId | null {
  if (!email) return null;
  const localPart = email.split('@')[0]?.trim().toLowerCase();
  if (localPart && isValidTesterId(localPart)) {
    return localPart;
  }
  return null;
}

export function formatDisplayUsername(
  email: string | null | undefined,
  displayName?: string | null
): string {
  if (email && email.toLowerCase().endsWith(`@${AUTH_EMAIL_DOMAIN}`)) {
    const raw = email.split('@')[0] || '';
    return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Inloggad';
  }
  return email || displayName || 'Inloggad';
}

export async function signInWithUsernameAndPassword(
  usernameOrEmail: string,
  password: string
): Promise<User> {
  const email = resolveLoginEmail(usernameOrEmail);
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/**
 * Subscribe to the shared calendar ratings in real time.
 * Only call when authenticated.
 */
export function subscribeToRatings(
  onData: (ratings: CalendarRatings) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const pathForList = 'ratings';
  const q = query(collection(db, pathForList), where('calendarId', '==', CALENDAR_ID));

  return onSnapshot(
    q,
    (snapshot) => {
      const next: CalendarRatings = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const day = typeof data.day === 'number' ? data.day : NaN;
        const testerId = typeof data.testerId === 'string' ? data.testerId : '';
        if (day >= 1 && day <= 24 && isValidTesterId(testerId) && typeof data.score === 'number') {
          if (!next[day]) {
            next[day] = {};
          }
          const updatedAtIso =
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate().toISOString()
              : new Date().toISOString();

          next[day][testerId] = {
            score: Math.round(data.score * 10) / 10,
            notes: typeof data.notes === 'string' ? data.notes : '',
            flavorTags: Array.isArray(data.flavorTags)
              ? data.flavorTags.filter((t): t is string => typeof t === 'string')
              : [],
            ratedAt: updatedAtIso,
            updatedByUid: typeof data.updatedByUid === 'string' ? data.updatedByUid : undefined,
          };
        }
      });
      onData(next);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, pathForList);
      } catch (wrappedErr) {
        onError(wrappedErr instanceof Error ? wrappedErr : new Error(String(wrappedErr)));
      }
    }
  );
}

/**
 * Persist a single tester's rating for a given day to Firestore.
 * Enforces payload boundaries matching firebase-blueprint.json & firestore.rules.
 */
export async function saveRatingToFirestore(
  day: number,
  testerId: TesterId,
  rating: UserRating,
  uid: string
): Promise<void> {
  const safeDay = Math.min(24, Math.max(1, Math.round(day)));
  if (!isValidTesterId(testerId)) {
    throw new Error(`Invalid tester ID: ${testerId}`);
  }

  const docId = `day_${safeDay}_${testerId}`;
  const docRef = doc(db, 'ratings', docId);
  const pathForWrite = `ratings/${docId}`;

  const safeScore = Math.min(10, Math.max(0, Math.round(rating.score * 10) / 10));
  const safeNotes = (rating.notes || '').slice(0, 1000);
  const safeTags = (rating.flavorTags || [])
    .filter((t): t is string => typeof t === 'string' && t.length > 0)
    .slice(0, 20)
    .map((t) => t.slice(0, 64));

  try {
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists()) {
      await updateDoc(docRef, {
        score: safeScore,
        notes: safeNotes,
        flavorTags: safeTags,
        updatedByUid: uid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        calendarId: CALENDAR_ID,
        day: safeDay,
        testerId,
        score: safeScore,
        notes: safeNotes,
        flavorTags: safeTags,
        updatedByUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Delete a single tester's rating for a given day from Firestore.
 */
export async function deleteRatingFromFirestore(
  day: number,
  testerId: TesterId
): Promise<void> {
  const safeDay = Math.min(24, Math.max(1, Math.round(day)));
  if (!isValidTesterId(testerId)) {
    throw new Error(`Invalid tester ID: ${testerId}`);
  }

  const docId = `day_${safeDay}_${testerId}`;
  const docRef = doc(db, 'ratings', docId);
  const pathForDelete = `ratings/${docId}`;

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, pathForDelete);
  }
}

export async function loadUserProfilePreference(uid: string): Promise<TesterId | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const selected = snap.data().selectedTesterId;
      if (typeof selected === 'string' && isValidTesterId(selected)) {
        return selected;
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfilePreference(
  uid: string,
  selectedTesterId: TesterId
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await setDoc(doc(db, 'users', uid), {
      selectedTesterId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
