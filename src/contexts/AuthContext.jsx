import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const ALLOWED_EMAILS = [
  'sunit.mathur@gmail.com',
  'sara.tariq01@gmail.com',
];

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Handle redirect result when returning from Google sign-in
    getRedirectResult(auth).catch((err) => {
      console.error('Redirect auth error:', err.code, err.message);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(`Login failed: ${err.code || err.message}`);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && ALLOWED_EMAILS.includes(firebaseUser.email)) {
        setUser(firebaseUser);
        setError(null);
      } else if (firebaseUser) {
        signOut(auth);
        setUser(null);
        setError('Sorry, this app is only for Sara and Sunit.');
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = () => {
    setError(null);
    signInWithRedirect(auth, googleProvider);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
