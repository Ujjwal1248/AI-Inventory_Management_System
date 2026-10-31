/**
 * AuthContext.jsx — Global authentication state provider.
 * Wraps the app and exposes { user, loading, login, logout, register } via useAuth().
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkSession, loginUser, logoutUser, registerUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);  // true until we've checked the session

  // ── On mount: verify existing session ──────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await checkSession();
        if (!cancelled) {
          setUser(res.authenticated ? res.user : null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Login ───────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await loginUser(email, password);
    setUser(res.user);
    return res;
  }, []);

  // ── Register ────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const res = await registerUser(name, email, password);
    setUser(res.user);
    return res;
  }, []);

  // ── Logout ──────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Even if the request fails, clear local state
    }
    setUser(null);
  }, []);

  const value = { user, loading, login, logout, register, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
