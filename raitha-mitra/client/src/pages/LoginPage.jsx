/**
 * LoginPage v2 — demo credentials removed
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const u = form.username.trim();
    const p = form.password;
    if (!u || !p) { setError('Please enter both username and password.'); return; }
    setLoading(true);
    try {
      const user = await login(u, p);
      toast.success(`Welcome, ${user.name}! 🌾`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed.';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#1a6b3a 0%,#2d8a50 50%,#1a6b3a 100%)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7">
        <div className="text-center mb-7">
          <div className="text-6xl mb-3">🌾</div>
          <h1 className="text-2xl font-bold text-green-800">Raitha Mitra</h1>
          <p className="text-sm text-gray-400 mt-1">ರೈತ ಮಿತ್ರ · Smart Farm Trading</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
            <input
              type="text" autoComplete="username" autoCapitalize="none"
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
            <input
              type="password" autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 bg-green-700 text-white rounded-xl font-semibold text-base hover:bg-green-800 transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Logging in...</>
              : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          New here?{' '}
          <Link to="/register" className="text-green-700 font-semibold hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
