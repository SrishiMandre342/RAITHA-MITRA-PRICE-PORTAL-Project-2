/**
 * ProfilePage v2
 * - Fetches REAL stats from /api/analytics/profile/:userId
 * - Shows totalListings, activeListings, totalSalesOrders, totalPurchases, revenue, spent
 * - Includes My Orders tab (buyer) and My Sales tab (seller)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KARNATAKA_DISTRICTS } from '../utils/constants';
import api from '../utils/api';
import toast from 'react-hot-toast';

function StatCard({ value, label, color = 'text-green-700', loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
      {loading
        ? <div className="h-7 w-12 skeleton rounded mx-auto mb-1" />
        : <div className={`text-xl font-bold ${color}`}>{value}</div>}
      <div className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

const STATUS_COLOR = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  in_transit: 'bg-purple-100 text-purple-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
};

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate  = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    district: user?.district || '', bio: user?.bio || '', language: user?.language || 'en',
  });
  const [saving, setSaving]     = useState(false);
  const [stats, setStats]       = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [orders, setOrders]     = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  // Load profile stats from DB
  useEffect(() => {
    if (!user?._id) return;
    api.get(`/analytics/profile/${user._id}`)
      .then(r => { setStats(r.data.stats); setStatsLoading(false); })
      .catch(() => setStatsLoading(false));
  }, [user?._id]);

  // Load orders when tab switches
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      setOrdersLoading(true);
      const endpoint = user.role === 'seller' ? '/orders/my-sales' : '/orders/my-purchases';
      api.get(endpoint)
        .then(r => { setOrders(r.data.orders); setOrdersLoading(false); })
        .catch(() => setOrdersLoading(false));
    }
  }, [activeTab, user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      updateUser(res.data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  };

  const TABS = [
    { id: 'info',   label: 'Profile' },
    { id: 'orders', label: user?.role === 'seller' ? 'My Sales' : 'My Orders' },
  ];

  return (
    <div className="space-y-4 fade-in pb-4">

      {/* Header card */}
      <div className="rounded-3xl p-6 text-white text-center"
        style={{ background: 'linear-gradient(135deg,#1a6b3a,#2d8a50)' }}>
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-3">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="text-xl font-bold">{user?.name}</div>
        <div className="text-sm opacity-75">@{user?.username}</div>
        <div className="mt-3 flex justify-center gap-2 flex-wrap">
          <span className="bg-white/20 text-xs px-3 py-1 rounded-full font-medium">
            {user?.role === 'seller' ? '🌱 Farmer / Seller' : '🛒 Buyer'}
          </span>
          <span className="bg-white/20 text-xs px-3 py-1 rounded-full font-medium">
            📍 {user?.district}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {user?.role === 'seller' ? <>
          <StatCard value={stats?.totalListings    ?? '—'} label="Total Listings"  loading={statsLoading} />
          <StatCard value={stats?.totalSalesOrders ?? '—'} label="Orders Sold"     loading={statsLoading} color="text-blue-600" />
          <StatCard value={stats?.totalRevenue ? `₹${(stats.totalRevenue/1000).toFixed(1)}k` : '₹0'} label="Revenue" loading={statsLoading} color="text-orange-600" />
        </> : <>
          <StatCard value={stats?.totalPurchases ?? '—'} label="Purchases"   loading={statsLoading} />
          <StatCard value={stats?.totalSpent ? `₹${(stats.totalSpent/1000).toFixed(1)}k` : '₹0'} label="Total Spent" loading={statsLoading} color="text-blue-600" />
          <StatCard value={(user?.rating || 5).toFixed(1)} label="⭐ Rating" loading={false} color="text-yellow-600" />
        </>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === t.id ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile info tab */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Account Details</h2>
            <button onClick={() => setEditing(!editing)}
              className="text-sm text-green-700 font-semibold px-3 py-1 rounded-lg hover:bg-green-50 transition">
              {editing ? 'Cancel' : '✏️ Edit'}
            </button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Full Name', key: 'name',  type: 'text' },
              { label: 'Phone',     key: 'phone', type: 'tel' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input type={type} value={form[key]} onChange={set(key)} disabled={!editing}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">District</label>
              <select value={form.district} onChange={set('district')} disabled={!editing}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400">
                {KARNATAKA_DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
              <select value={form.language} onChange={set('language')} disabled={!editing}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400">
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>
            {editing && (
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 transition disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Orders / Sales tab */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {ordersLoading
            ? Array(3).fill(0).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)
            : orders.length === 0
              ? (
                <div className="text-center py-14">
                  <div className="text-5xl mb-3">📦</div>
                  <div className="text-gray-500 font-medium">No {user?.role === 'seller' ? 'sales' : 'orders'} yet</div>
                  <div className="text-gray-400 text-sm mt-1">
                    {user?.role === 'seller' ? 'Post a listing to start selling' : 'Browse crops to place your first order'}
                  </div>
                </div>
              )
              : orders.map(o => (
                  <div key={o._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">{o.cropName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {o.quantity} kg · ₹{o.pricePerUnit}/kg
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-700">₹{o.totalAmount.toLocaleString('en-IN')}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-700'}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-2">
                      <span>
                        {user?.role === 'seller'
                          ? `👤 Buyer: ${o.buyer?.name || '—'}`
                          : `🌱 Seller: ${o.seller?.name || '—'}`}
                      </span>
                      <span>{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                ))
          }
        </div>
      )}

      {/* Logout */}
      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="w-full py-3 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition">
        Logout
      </button>
    </div>
  );
}
