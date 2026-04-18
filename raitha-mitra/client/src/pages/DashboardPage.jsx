/**
 * DashboardPage v2 — no demo credentials, cleaner UI
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ListingCard, PriceCard } from '../components/UI';
import { CROP_EMOJI } from '../utils/constants';

const ACTIONS = [
  { icon:'🛒', label:'Buy Crops',     sub:'Fresh listings',    path:'/buy',       bg:'from-blue-50 to-blue-100' },
  { icon:'🌱', label:'Sell Crops',    sub:'List your harvest', path:'/sell',      bg:'from-green-50 to-green-100' },
  { icon:'📊', label:'Market Prices', sub:'Live AGMARKNET',    path:'/prices',    bg:'from-yellow-50 to-yellow-100' },
  { icon:'📈', label:'Analytics',     sub:'Trends & insights', path:'/analytics', bg:'from-purple-50 to-purple-100' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning ☀️';
  if (h < 17) return 'Good afternoon 🌤️';
  return 'Good evening 🌙';
}

export default function DashboardPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [prices, setPrices]     = useState([]);
  const [listings, setListings] = useState([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingL, setLoadingL] = useState(true);
  const [wishlist, setWishlist] = useState(
    () => JSON.parse(localStorage.getItem('rm_wishlist') || '[]')
  );

  useEffect(() => {
    api.get('/prices?limit=5')
      .then(r => { setPrices(r.data.prices); setLoadingP(false); })
      .catch(() => setLoadingP(false));
    api.get('/listings?limit=6')
      .then(r => { setListings(r.data.listings); setLoadingL(false); })
      .catch(() => setLoadingL(false));
  }, []);

  const toggleWish = id => {
    const u = wishlist.includes(id) ? wishlist.filter(w => w !== id) : [...wishlist, id];
    setWishlist(u);
    localStorage.setItem('rm_wishlist', JSON.stringify(u));
  };

  return (
    <div className="space-y-5 fade-in">

      {/* Hero */}
      <div className="rounded-3xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg,#1a6b3a,#2d8a50)' }}>
        <div className="text-sm opacity-75">{greeting()}</div>
        <div className="text-xl font-bold mt-0.5">{user?.name}</div>
        <div className="text-sm opacity-60 mb-3">📍 {user?.district}, Karnataka</div>
        <div className="flex gap-2 flex-wrap">
          <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-medium">🟢 Market Open</span>
          <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-medium">
            📅 {new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
          </span>
        </div>
      </div>

      {/* Action grid */}
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(a => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className={`bg-gradient-to-br ${a.bg} rounded-2xl p-4 text-left border border-white/50 hover:shadow-md transition active:scale-95`}>
            <div className="text-3xl mb-2">{a.icon}</div>
            <div className="font-bold text-gray-800 text-sm">{a.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{a.sub}</div>
          </button>
        ))}
      </div>

      {/* Today's prices */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">📊 Today's Prices</h2>
          <button onClick={() => navigate('/prices')} className="text-xs text-green-700 font-semibold">See all →</button>
        </div>
        <div className="space-y-2">
          {loadingP
            ? Array(4).fill(0).map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)
            : prices.map((p, i) => <PriceCard key={i} price={{ ...p, emoji: CROP_EMOJI[p.cropName] || '🌿' }} />)
          }
        </div>
      </section>

      {/* New listings */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">🛒 New Listings</h2>
          <button onClick={() => navigate('/buy')} className="text-xs text-green-700 font-semibold">See all →</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {loadingL
            ? Array(4).fill(0).map((_, i) => <div key={i} className="h-44 skeleton rounded-2xl" />)
            : listings.map(l => (
                <ListingCard key={l._id}
                  listing={{ ...l, emoji: CROP_EMOJI[l.cropName] || '🌿' }}
                  isWishlisted={wishlist.includes(l._id)}
                  onWishlist={toggleWish}
                  onClick={() => navigate(`/buy/${l._id}`)} />
              ))
          }
        </div>
      </section>

      {/* WhatsApp Bot CTA */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl">💬</div>
          <div>
            <div className="font-bold text-green-800 text-sm">Raitha Mitra WhatsApp Bot</div>
            <div className="text-xs text-green-600">Get prices & listings instantly on WhatsApp</div>
          </div>
          <a
            href="https://wa.me/14155238886?text=join%20proper-canal"
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex-shrink-0 bg-green-600 text-white text-xs px-3 py-2 rounded-full font-semibold hover:bg-green-700 transition"
          >
            Join Bot
          </a>
        </div>
        <div className="bg-white rounded-xl p-3 space-y-1.5 text-xs">
          <div className="font-semibold text-gray-700 mb-2">How to use:</div>
          <div className="flex items-start gap-2 text-gray-600">
            <span className="font-bold text-green-700 w-5">1.</span>
            <span>Click <b>Join Bot</b> → Send <b>join proper-canal</b> on WhatsApp</span>
          </div>
          <div className="flex items-start gap-2 text-gray-600">
            <span className="font-bold text-green-700 w-5">2.</span>
            <span>Then type any command below 👇</span>
          </div>
          <div className="mt-2 bg-gray-50 rounded-lg p-2 space-y-1 font-mono text-gray-700">
            <div>PRICE Tomato</div>
            <div>BUY Onion</div>
            <div>STOCK Haveri</div>
            <div>TRENDING</div>
            <div>HELP</div>
          </div>
          <div className="text-gray-400 pt-1">Supports English · ಕನ್ನಡ · हिंदी</div>
        </div>
      </div>
    </div>
  );
}
