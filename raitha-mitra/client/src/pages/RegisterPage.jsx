/**
 * RegisterPage v2 — clean, no demo credentials
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KARNATAKA_DISTRICTS } from '../utils/constants';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name:'', username:'', phone:'', password:'',
    role:'seller', district: KARNATAKA_DISTRICTS[0], language:'en',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.username || !form.phone || !form.password) {
      setError('Please fill in all required fields.'); return;
    }
    if (form.password.length < 4) {
      setError('Password must be at least 4 characters.'); return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to Raitha Mitra 🌾');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed.';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#1a6b3a 0%,#2d8a50 50%,#1a6b3a 100%)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🌱</div>
          <h1 className="text-2xl font-bold text-green-800">Create Account</h1>
          <p className="text-sm text-gray-400 mt-1">Join Karnataka's farm trading network</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {[
            { label:'Full Name *',    key:'name',     type:'text',  ph:'Ramesh Kumar' },
            { label:'Username *',     key:'username', type:'text',  ph:'ramesh123' },
            { label:'Phone Number *', key:'phone',    type:'tel',   ph:'9876543210' },
            { label:'Password *',     key:'password', type:'password', ph:'Min 4 characters' },
          ].map(({ label, key, type, ph }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
              <input type={type} placeholder={ph} value={form[key]} onChange={set(key)} autoCapitalize="none"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">I am a *</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ val:'seller', label:'🌱 Farmer / Seller' }, { val:'buyer', label:'🛒 Buyer' }].map(r => (
                <button key={r.val} type="button" onClick={() => setForm(p => ({ ...p, role: r.val }))}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${form.role === r.val ? 'border-green-700 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">District *</label>
            <select value={form.district} onChange={set('district')}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
              {KARNATAKA_DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Language</label>
            <select value={form.language} onChange={set('language')}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-green-700 text-white rounded-xl font-bold text-base hover:bg-green-800 transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account...</>
              : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-green-700 font-bold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
