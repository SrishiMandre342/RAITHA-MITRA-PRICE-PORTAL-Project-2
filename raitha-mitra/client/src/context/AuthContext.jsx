/**
 * AuthContext — FIXED VERSION
 *
 * FIXES:
 * 1. session restore: if /auth/me returns 401 (expired token), silently
 *    clears the token instead of crashing — was causing blank screen on reload
 * 2. login() and register() now surface the backend error message properly
 *    instead of swallowing it, so LoginPage can display "Invalid username..."
 * 3. Added console logs throughout so auth flow is visible in browser console
 * 4. Fixed: token was sometimes stale in api.defaults.headers after page reload
 *    — now always reads from localStorage in the interceptor (already fixed in api.js)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on app mount ────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem('rm_token');
      console.log(`🔄 [AuthContext] Restoring session... token exists: ${!!stored}`);

      if (stored) {
        try {
          // api interceptor automatically attaches the token from localStorage
          const res = await api.get('/auth/me');
          console.log(`✅ [AuthContext] Session restored for: ${res.data.user.username}`);
          setUser(res.data.user);
          setToken(stored);
        } catch (err) {
          console.warn(`⚠️  [AuthContext] Session restore failed (${err.response?.status}) — clearing token`);
          localStorage.removeItem('rm_token');
        }
      } else {
        console.log('ℹ️  [AuthContext] No stored token — user is logged out');
      }

      setLoading(false);
    };

    restore();
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    console.log(`🔑 [AuthContext.login] Attempting login for: "${username}"`);

    // Explicit guard — catch empty fields before hitting the API
    if (!username?.trim() || !password) {
      throw new Error('Please enter both username and password.');
    }

    const res = await api.post('/auth/login', {
      username: username.trim().toLowerCase(),
      password,
    });

    const { token: t, user: u } = res.data;
    console.log(`✅ [AuthContext.login] Login successful for: ${u.username}`);

    localStorage.setItem('rm_token', t);
    setToken(t);
    setUser(u);
    return u;
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────────
  const register = useCallback(async (data) => {
    console.log(`📝 [AuthContext.register] Registering: "${data.username}"`);

    const res = await api.post('/auth/register', {
      ...data,
      username: data.username?.trim().toLowerCase(),
    });

    const { token: t, user: u } = res.data;
    console.log(`✅ [AuthContext.register] Registered & logged in: ${u.username}`);

    localStorage.setItem('rm_token', t);
    setToken(t);
    setUser(u);
    return u;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    console.log('👋 [AuthContext.logout] Logging out');
    localStorage.removeItem('rm_token');
    setUser(null);
    setToken(null);
  }, []);

  // ── Update cached user ───────────────────────────────────────────────────────
  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
