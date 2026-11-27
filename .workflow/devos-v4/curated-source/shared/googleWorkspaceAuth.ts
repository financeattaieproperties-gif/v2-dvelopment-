import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.acls',
  'https://www.googleapis.com/auth/calendar.acls.readonly',
  'https://www.googleapis.com/auth/calendar.app.created',
  'https://www.googleapis.com/auth/calendar.calendarlist',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.calendars',
  'https://www.googleapis.com/auth/calendar.calendars.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
  'https://www.googleapis.com/auth/calendar.events.owned',
  'https://www.googleapis.com/auth/calendar.events.owned.readonly',
  'https://www.googleapis.com/auth/calendar.events.public.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.settings.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
] as const;

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export { firebaseConfig };

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
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
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionCheckPromise: Promise<void> | null = null;

export async function testConnection(): Promise<void> {
  if (connectionCheckPromise) return connectionCheckPromise;
  connectionCheckPromise = (async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration.');
      }
      // Non-offline errors (e.g. non-existent probe doc) are intentionally ignored
    }
  })();
  return connectionCheckPromise;
}

const workspaceProvider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  workspaceProvider.addScope(scope);
}

const basicGoogleProvider = new GoogleAuthProvider();
basicGoogleProvider.setCustomParameters({ prompt: 'select_account' });

// Flag to indicate if we are in the middle of a Workspace OAuth flow.
let isSigningIn = false;
// Cache the Workspace OAuth access token in memory only (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

export async function syncUserProfileToFirestore(user: User): Promise<void> {
  if (!user.uid || !user.emailVerified) return;

  const displayName = (user.displayName || user.email?.split('@')[0] || 'Staff Member').slice(0, 120);
  const photoURL = (user.photoURL || '').slice(0, 512);
  const email = (user.email || '').trim().slice(0, 254);
  const userPath = `users/${user.uid}`;
  const privatePath = `users/${user.uid}/private/account`;

  try {
    const profileRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(profileRef);
    if (!existingSnap.exists()) {
      await setDoc(profileRef, {
        uid: user.uid,
        displayName,
        photoURL,
        role: 'member',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        profileRef,
        {
          displayName,
          photoURL,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.toLowerCase().includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, userPath);
    }
  }

  if (email.length >= 3) {
    try {
      const privateRef = doc(db, 'users', user.uid, 'private', 'account');
      await setDoc(
        privateRef,
        {
          uid: user.uid,
          email,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('permission')) {
        handleFirestoreError(err, OperationType.WRITE, privatePath);
      }
    }
  }
}

export const subscribeFirebaseAuthState = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

export const signInWithGoogleAuth = async (): Promise<{
  user: User;
  idToken: string;
}> => {
  const result = await signInWithPopup(auth, basicGoogleProvider);
  const idToken = await result.user.getIdToken();
  await syncUserProfileToFirestore(result.user).catch(() => {
    // Non-blocking: authentication still succeeds if Firestore profile sync encounters transient network issues
  });
  return { user: result.user, idToken };
};

export const signInWithEmailAuth = async (
  email: string,
  password: string
): Promise<{ user: User; idToken: string }> => {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  const idToken = await result.user.getIdToken();
  if (result.user.emailVerified) {
    await syncUserProfileToFirestore(result.user).catch(() => {});
  }
  return { user: result.user, idToken };
};

export const sendFirebasePasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim());
};

export const getFirebaseIdToken = async (
  forceRefresh = false
): Promise<string | null> => {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken(forceRefresh);
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, workspaceProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    await syncUserProfileToFirestore(result.user).catch(() => {});
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getWorkspaceUserEmail = (): string | null => {
  return auth.currentUser?.email || null;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
