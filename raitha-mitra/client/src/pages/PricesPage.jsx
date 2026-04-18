import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { PriceCard, PriceSkeleton, FilterChip } from '../components/UI';
import { CATEGORIES, MARKETS, CROP_EMOJI } from '../utils/constants';

export default function PricesPage() {
  const [prices, setPrices]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('All');
  const [market, setMarket]     = useState('All Markets');

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)              params.crop     = search;
      if (category !== 'All') params.category = category;
      if (market !== 'All Markets') params.market = market;
      const res = await api.get('/prices', { params: { ...params, limit: 100 } });
      setPrices(res.data.prices.map(p => ({ ...p, emoji: CROP_EMOJI[p.cropName] || '🌿' })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, market]);

  useEffect(() => {
    const timer = setTimeout(fetchPrices, 300);
    return () => clearTimeout(timer);
  }, [fetchPrices]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">📊 Market Prices</h1>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
          🟢 Live · AGMARKNET
        </span>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <span>🔍</span>
          <input
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
            placeholder="Search tomato, onion, rice..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 text-xs">✕</button>
          )}
        </div>
      </div>

      {/* Market filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['All Markets', ...MARKETS].map(m => (
          <FilterChip key={m} label={m} active={market === m} onClick={() => setMarket(m)} />
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(c => (
          <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
        ))}
      </div>

      {/* Results */}
      <div className="text-xs text-gray-500">
        {!loading && `${prices.length} prices found`}
      </div>

      <div className="space-y-2">
        {loading
          ? Array(8).fill(0).map((_, i) => <PriceSkeleton key={i} />)
          : prices.length === 0
            ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🔍</div>
                <div className="text-gray-500">No prices found</div>
                <button onClick={() => { setSearch(''); setCategory('All'); setMarket('All Markets'); }}
                  className="text-green-700 text-sm mt-2">Clear filters</button>
              </div>
            )
            : prices.map((p, i) => <PriceCard key={i} price={p} />)
        }
      </div>

      {/* Price data note */}
      <div className="text-xs text-center text-gray-400 py-2">
        📋 Data sourced from AGMARKNET Karnataka · Updated daily
      </div>
    </div>
  );
}
