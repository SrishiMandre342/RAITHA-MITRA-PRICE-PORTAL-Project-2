import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { CROP_EMOJI } from '../utils/constants';

function StatBox({ value, label, color = 'text-green-700' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function BarRow({ label, emoji, value, max, sub }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="text-base w-6 text-center">{emoji}</div>
      <div className="w-20 text-xs text-gray-600 truncate">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full flex items-center pl-2"
          style={{ width: `${pct}%`, transition: 'width 1s ease' }}>
          {pct > 30 && <span className="text-white text-xs font-medium truncate">{sub}</span>}
        </div>
      </div>
      <div className="text-xs font-semibold text-gray-700 w-16 text-right">{sub}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4 fade-in">
      <div className="h-7 w-48 skeleton rounded-lg" />
      <div className="grid grid-cols-2 gap-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      <div className="h-48 skeleton rounded-2xl" /><div className="h-48 skeleton rounded-2xl" />
    </div>
  );

  const stats = data?.stats || {};
  const topCrops = data?.topCrops || [];
  const topDistricts = data?.topDistricts || [];

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">📈 Market Analytics</h1>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Live data</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatBox value={stats.activeListings || 0} label="Active Listings" />
        <StatBox value={stats.totalOrders || 0} label="Orders Confirmed" color="text-blue-600" />
        <StatBox value={stats.totalListings || 0} label="Total Listings Ever" color="text-orange-600" />
        <StatBox value={topCrops.length} label="Crops on Platform" color="text-purple-600" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 text-sm mb-4">🌾 Top Trading Crops</h2>
        <div className="space-y-3">
          {topCrops.slice(0, 8).map(c => (
            <BarRow key={c._id} label={c._id} emoji={CROP_EMOJI[c._id] || '🌿'}
              value={c.count} max={topCrops[0]?.count || 1} sub={`${c.count} · ₹${Math.round(c.avgPrice || 0)}`} />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-800 text-sm mb-4">📍 Activity by District</h2>
        <div className="space-y-3">
          {topDistricts.map(d => (
            <BarRow key={d._id} label={d._id} emoji="📍"
              value={d.count} max={topDistricts[0]?.count || 1} sub={`${d.count} listings`} />
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
        <div className="font-semibold text-green-800 text-sm mb-2">🤖 AI Market Intelligence</div>
        <p className="text-xs text-green-700 leading-relaxed">
          Prices updated daily from AGMARKNET and eNAM. AI engine analyzes Karnataka market trends
          to help you decide when and where to sell for maximum profit.
        </p>
      </div>
    </div>
  );
}
