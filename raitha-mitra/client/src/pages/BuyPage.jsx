import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ListingCard, CardSkeleton, FilterChip, EmptyState } from '../components/UI';
import { CATEGORIES, KARNATAKA_DISTRICTS, CROP_EMOJI } from '../utils/constants';

export default function BuyPage() {
  const navigate  = useNavigate();
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');
  const [district, setDistrict]   = useState('');
  const [minPrice, setMinPrice]   = useState('');
  const [maxPrice, setMaxPrice]   = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [wishlist, setWishlist]   = useState(() => JSON.parse(localStorage.getItem('rm_wishlist') || '[]'));

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 40 };
      if (search)              params.search   = search;
      if (category !== 'All') params.category = category;
      if (district)           params.district = district;
      if (minPrice)           params.minPrice = minPrice;
      if (maxPrice)           params.maxPrice = maxPrice;
      const res = await api.get('/listings', { params });
      setListings(res.data.listings.map(l => ({ ...l, emoji: CROP_EMOJI[l.cropName] || '🌿' })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, district, minPrice, maxPrice]);

  useEffect(() => {
    const t = setTimeout(fetchListings, 300);
    return () => clearTimeout(t);
  }, [fetchListings]);

  const toggleWish = (id) => {
    const updated = wishlist.includes(id) ? wishlist.filter(w => w !== id) : [...wishlist, id];
    setWishlist(updated);
    localStorage.setItem('rm_wishlist', JSON.stringify(updated));
  };

  // Auto-detect location
  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // In production, reverse-geocode to get district
        // For now, just show a message
        alert('Location detected! In production, this auto-selects your district.');
      },
      () => alert('Location permission denied.')
    );
  };

  const savedCount = wishlist.length;

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">🛒 Buy Crops</h1>
        <button onClick={() => navigate('/buy/saved')}
          className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2.5 py-1.5 rounded-full font-medium border border-red-100">
          ❤️ {savedCount} saved
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <span>🔍</span>
          <input
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
            placeholder="Search tomato, onion, mango..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')} className="text-gray-400 text-xs">✕</button>}
        </div>
        <button onClick={() => setShowFilter(!showFilter)}
          className={`px-3 border rounded-xl text-lg transition-colors ${showFilter ? 'bg-green-50 border-green-400' : 'bg-white border-gray-200'}`}>
          ⚙️
        </button>
        <button onClick={detectLocation}
          className="px-3 bg-white border border-gray-200 rounded-xl text-lg">
          📍
        </button>
      </div>

      {/* Advanced filters */}
      {showFilter && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Min Price (₹/kg)</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Max Price (₹/kg)</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="500" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">District</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={district} onChange={e => setDistrict(e.target.value)}>
              <option value="">All Districts</option>
              {KARNATAKA_DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <button onClick={() => { setMinPrice(''); setMaxPrice(''); setDistrict(''); }}
            className="text-xs text-green-700 font-medium">Clear filters</button>
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
        ))}
      </div>

      {/* Count */}
      {!loading && (
        <div className="text-xs text-gray-500">{listings.length} listings found</div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {loading
          ? Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
          : listings.length === 0
            ? <div className="col-span-2">
                <EmptyState icon="🌾" title="No listings found"
                  subtitle="Try changing filters or check back later" />
              </div>
            : listings.map(l => (
                <ListingCard
                  key={l._id}
                  listing={l}
                  isWishlisted={wishlist.includes(l._id)}
                  onWishlist={toggleWish}
                  onClick={() => navigate(`/buy/${l._id}`)}
                />
              ))
        }
      </div>
    </div>
  );
}
