import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  subscribeFirebaseAuthState,
  signInWithGoogleAuth,
  logout as firebaseLogout,
} from '../../lib/firebase';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  isSigningIn: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeFirebaseAuthState((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await signInWithGoogleAuth();
      setUser(res.user);
      return res.user;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Google sign-in failed.';
      setAuthError(msg);
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseLogout();
    setUser(null);
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        isSigningIn,
        authError,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebaseAuth(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebaseAuth must be used inside FirebaseProvider');
  }
  return ctx;
}
