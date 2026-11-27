import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { api } from '../api';
import {
  logout as firebaseLogout,
  signInWithGoogleAuth,
  subscribeFirebaseAuthState,
} from '../../../shared/googleWorkspaceAuth';

interface AuthState {
  loggedIn: boolean;
  firebaseUser: User | null;
  authReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(() =>
    sessionStorage.getItem('admin_logged_in') === 'true'
  );
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = subscribeFirebaseAuthState((user) => {
      setFirebaseUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const login = async (username: string, password: string) => {
    await api.login(username, password);
    sessionStorage.setItem('admin_logged_in', 'true');
    setLoggedIn(true);
  };

  const loginWithGoogle = async () => {
    const { user, idToken } = await signInWithGoogleAuth();
    await api.loginWithFirebase(idToken);
    setFirebaseUser(user);
    sessionStorage.setItem('admin_logged_in', 'true');
    setLoggedIn(true);
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      await firebaseLogout().catch(() => {});
      sessionStorage.removeItem('admin_logged_in');
      setFirebaseUser(null);
      setLoggedIn(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ loggedIn, firebaseUser, authReady, login, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
