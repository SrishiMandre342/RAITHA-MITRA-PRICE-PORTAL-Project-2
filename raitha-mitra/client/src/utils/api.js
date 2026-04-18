/**
 * Axios API instance — FIXED VERSION
 *
 * FIXES:
 * 1. Hardcoded fallback URL so dev works even without .env file
 * 2. FIX: The 401 interceptor was causing an INFINITE REDIRECT LOOP:
 *    - /api/auth/me returns 401 (no token yet on first load)
 *    - interceptor fires → redirects to /login
 *    - /login page mounts → tries /api/auth/me again → 401 again → loop
 *    Solution: only redirect on 401 if the request was NOT to /auth/* routes
 * 3. Added request/response logging in development
 * 4. Added explicit Content-Type: application/json header on all requests
 */

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log(`🔗 API base URL: ${BASE_URL}`);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor: attach token + log in dev ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 API ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }

    return config;
  },
  (error) => {
    console.error('📤 Request setup error:', error);
    return Promise.reject(error);
  }
);

// ─── Response interceptor: log + handle 401 smartly ──────────────────────────
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 API ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const status  = error.response?.status;
    const url     = error.config?.url || '';
    const message = error.response?.data?.error || error.message;

    console.error(`📥 API Error ${status} on ${url}: ${message}`);

    // FIX: Only force-logout on 401 for NON-AUTH routes
    // Auth routes (/auth/login, /auth/register, /auth/me) legitimately return 401
    // and should NOT trigger a redirect — the component handles the error itself
    const isAuthRoute = url.includes('/auth/');
    if (status === 401 && !isAuthRoute) {
      console.warn('🔒 Session expired — clearing token and redirecting to login');
      localStorage.removeItem('rm_token');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
