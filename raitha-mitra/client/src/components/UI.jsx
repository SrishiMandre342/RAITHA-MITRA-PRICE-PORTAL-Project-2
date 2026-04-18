import React from 'react';

// ─── Skeleton loader ──────────────────────────────────────────────────────────
export function Skeleton({ className = '', ...props }) {
  return <div className={`skeleton ${className}`} {...props} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <Skeleton className="h-28 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function PriceSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="space-y-1 text-right">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// ─── Price card ───────────────────────────────────────────────────────────────
export function PriceCard({ price }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 card-hover">
      <div className="text-3xl w-10 text-center">{price.emoji || '🌿'}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900 truncate">{price.cropName}</div>
        <div className="text-xs text-gray-500 truncate">{price.market}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-bold text-green-700 text-base">₹{price.modalPriceKg}/kg</div>
        <div className="text-xs text-gray-400">₹{price.minPriceKg}–₹{price.maxPriceKg}</div>
        <div className={`text-xs font-medium ${price.trend === 'up' ? 'text-green-600' : price.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
          {price.trend === 'up' ? '▲' : price.trend === 'down' ? '▼' : '─'} {Math.abs(price.priceChangePct || 0).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

// ─── Listing card ─────────────────────────────────────────────────────────────
export function ListingCard({ listing, onWishlist, isWishlisted, onClick }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover cursor-pointer" onClick={onClick}>
      <div className="h-28 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative">
        {listing.images?.[0]?.url ? (
          <img
            src={`${process.env.REACT_APP_API_URL?.replace('/api', '')}${listing.images[0].url}`}
            alt={listing.cropName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl">{listing.emoji || '🌿'}</span>
        )}
        <button
          className="absolute top-2 right-2 text-lg"
          onClick={(e) => { e.stopPropagation(); onWishlist?.(listing._id); }}
        >
          {isWishlisted ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="p-3">
        <div className="font-semibold text-sm text-gray-900 truncate">{listing.cropName}</div>
        <div className="text-green-700 font-bold text-base">₹{listing.price}/kg</div>
        <div className="text-xs text-gray-500 mt-0.5">📍 {listing.district}</div>
        <div className="text-xs text-gray-400">📦 {listing.quantity} kg available</div>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'green' }) {
  const colors = {
    green:  'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    blue:   'bg-blue-100  text-blue-800',
    red:    'bg-red-100   text-red-800',
    gray:   'bg-gray-100  text-gray-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.green}`}>
      {children}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', className = '', loading, ...props }) {
  const base = 'flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50';
  const variants = {
    primary:   'bg-green-700 text-white hover:bg-green-800 py-3 px-4',
    secondary: 'bg-white border-2 border-green-700 text-green-700 hover:bg-green-50 py-3 px-4',
    danger:    'bg-red-600 text-white hover:bg-red-700 py-3 px-4',
    ghost:     'text-green-700 hover:bg-green-50 py-2 px-3',
    buy:       'bg-orange-500 text-white hover:bg-orange-600 py-3.5 px-4',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <input
        className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-white text-gray-900
          focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all
          ${error ? 'border-red-400' : 'border-gray-200'}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <select
        className={`w-full px-3 py-2.5 border rounded-xl text-sm bg-white text-gray-900
          focus:ring-2 focus:ring-green-500 focus:border-transparent
          ${error ? 'border-red-400' : 'border-gray-200'}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = '🌾', title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <div className="font-semibold text-gray-700 text-base mb-1">{title}</div>
      {subtitle && <div className="text-sm text-gray-400 mb-4">{subtitle}</div>}
      {action}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-semibold text-gray-800 text-base">{title}</h2>
      {action}
    </div>
  );
}

// ─── Filter chip ─────────────────────────────────────────────────────────────
export function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border
        ${active ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}
    >
      {label}
    </button>
  );
}
