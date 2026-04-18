import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import NotificationsPanel from './NotificationsPanel';

export default function Layout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex flex-col items-center gap-0.5 py-2 px-3 text-xs font-medium transition-colors
    ${isActive ? 'text-green-700' : 'text-gray-500'}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-farm-green text-white shadow-md"
        style={{ background: 'linear-gradient(135deg, #1a6b3a, #2d8a50)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-2xl">🌾</span>
            <div>
              <div className="font-semibold text-base leading-none">Raitha Mitra</div>
              <div className="text-xs opacity-70">ರೈತ ಮಿತ್ರ</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Role badge */}
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full font-medium">
              {user?.role === 'seller' ? '🌱 Farmer' : '🛒 Buyer'}
            </span>

            {/* Notification bell */}
            <button
              onClick={() => setShowNotifs(true)}
              className="relative p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-semibold text-sm hover:bg-white/30 transition-colors"
            >
              {user?.name?.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pb-24 pt-4 fade-in">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 bottom-safe">
        <div className="max-w-2xl mx-auto flex">
          <NavLink to="/" end className={navLinkClass}>
            <span className="text-xl">🏠</span>
            <span>Home</span>
          </NavLink>
          <NavLink to="/prices" className={navLinkClass}>
            <span className="text-xl">📊</span>
            <span>Prices</span>
          </NavLink>
          <NavLink to="/buy" className={navLinkClass}>
            <span className="text-xl">🛒</span>
            <span>Buy</span>
          </NavLink>
          <NavLink to="/sell" className={navLinkClass}>
            <span className="text-xl">🌱</span>
            <span>Sell</span>
          </NavLink>
          <NavLink to="/analytics" className={navLinkClass}>
            <span className="text-xl">📈</span>
            <span>Analytics</span>
          </NavLink>
        </div>
      </nav>

      {/* Notifications slide-over */}
      {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
    </div>
  );
}
