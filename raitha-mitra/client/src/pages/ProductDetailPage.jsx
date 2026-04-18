/**
 * ProductDetailPage v2
 * - Real-time stock counter (Socket.IO inventory-update event)
 * - COD creates real order, updates inventory, shows confirmation
 * - WhatsApp URL uses actual seller phone number correctly
 * - Input validation: qty cannot exceed available stock
 * - Shows "Out of Stock" when stock = 0
 * - Order confirmation screen after successful purchase
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import { CROP_EMOJI, timeAgo } from '../utils/constants';
import toast from 'react-hot-toast';

const SERVER = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

function formatPhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
}

export default function ProductDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { socket } = useSocket();

  const [listing, setListing]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showPayment, setShowPayment]  = useState(false);
  const [payMethod, setPayMethod]     = useState('cash');
  const [qty, setQty]                 = useState(0);
  const [paying, setPaying]           = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [wishlist, setWishlist]       = useState(
    () => JSON.parse(localStorage.getItem('rm_wishlist') || '[]')
  );

  const fetchListing = useCallback(() => {
    api.get(`/listings/${id}`)
      .then(r => {
        setListing(r.data.listing);
        setQty(r.data.listing.minimumOrder || 10);
        setLoading(false);
      })
      .catch(() => { toast.error('Listing not found'); navigate('/buy'); });
  }, [id, navigate]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

  // Real-time inventory update via Socket.IO
  useEffect(() => {
    if (!socket || !listing) return;
    const handler = (data) => {
      if (data.listingId === listing._id) {
        setListing(prev => prev ? {
          ...prev,
          quantity: data.newQuantity,
          status:   data.status,
        } : prev);
        if (data.newQuantity <= 0) toast('⚠️ This item just sold out!');
        else toast(`📦 Stock updated: ${data.newQuantity} kg remaining`);
      }
    };
    socket.on('inventory-update', handler);
    return () => socket.off('inventory-update', handler);
  }, [socket, listing?._id]);

  const toggleWish = () => {
    const updated = wishlist.includes(id)
      ? wishlist.filter(w => w !== id)
      : [...wishlist, id];
    setWishlist(updated);
    localStorage.setItem('rm_wishlist', JSON.stringify(updated));
    toast(updated.includes(id) ? 'Saved ❤️' : 'Removed from saved');
  };

  const confirmPayment = async () => {
    if (qty < 1) { toast.error('Enter a valid quantity'); return; }
    if (listing.quantity < qty) {
      toast.error(`Only ${listing.quantity} kg available`); return;
    }
    setPaying(true);
    try {
      const res = await api.post('/payment/initiate', {
        listingId: id,
        quantity: qty,
        paymentMethod: payMethod,
      });

      if (payMethod !== 'cash' && res.data.paymentUrl) {
        toast.success('Redirecting to payment gateway...');
        window.open(res.data.paymentUrl, '_blank');
        setShowPayment(false);
      } else {
        // COD or confirmed
        setConfirmedOrder(res.data);
        setShowPayment(false);
        // Update local stock
        setListing(prev => prev ? {
          ...prev,
          quantity: res.data.remainingStock ?? prev.quantity - qty,
        } : prev);
        toast.success('Order confirmed! 🎉');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order failed. Try again.');
    } finally { setPaying(false); }
  };

  if (loading) return (
    <div className="space-y-4 fade-in">
      <div className="h-52 rounded-3xl skeleton" />
      <div className="h-8 w-3/4 skeleton rounded-xl" />
      <div className="h-5 w-1/2 skeleton rounded-xl" />
      <div className="h-28 skeleton rounded-2xl" />
    </div>
  );
  if (!listing) return null;

  const emoji    = CROP_EMOJI[listing.cropName] || '🌿';
  const isWished = wishlist.includes(id);
  const total    = listing.price * qty;
  const outOfStock = listing.status !== 'active' || listing.quantity <= 0;
  const sellerPhone = listing.seller?.phone || listing.sellerPhone;
  const waPhone = formatPhone(sellerPhone);
  const waMsg   = encodeURIComponent(
    `Hi ${listing.seller?.name || 'Farmer'}, I am interested in your ${listing.cropName} listing (₹${listing.price}/kg) on Raitha Mitra. Is it still available?`
  );

  // Order confirmation screen
  if (confirmedOrder) {
    return (
      <div className="fade-in flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-500 mb-6">Your order for {listing.cropName} has been placed successfully.</p>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 w-full max-w-sm mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Crop</span><span className="font-medium">{listing.cropName}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Quantity</span><span className="font-medium">{qty} kg</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span><span className="font-bold text-green-700">₹{total.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Payment</span><span className="font-medium capitalize">{payMethod === 'cash' ? 'Cash on Delivery' : payMethod}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className="text-blue-600 font-medium">Confirmed</span></div>
        </div>
        {waPhone && (
          <a href={`https://wa.me/${waPhone}?text=${waMsg}`} target="_blank" rel="noreferrer"
            className="w-full max-w-sm mb-3 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-semibold">
            💬 Contact Seller on WhatsApp
          </a>
        )}
        <button onClick={() => navigate('/buy')}
          className="w-full max-w-sm py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in pb-6">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-green-700 text-sm mb-3 font-medium hover:underline">
        ← Back
      </button>

      {/* Hero image */}
      <div className="h-56 rounded-3xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center overflow-hidden mb-4 relative">
        {listing.images?.[0]?.url
          ? <img src={`${SERVER}${listing.images[0].url}`} alt={listing.cropName} className="w-full h-full object-cover" />
          : <span className="text-9xl">{emoji}</span>
        }
        <button onClick={toggleWish}
          className="absolute top-3 right-3 w-10 h-10 bg-white/95 rounded-full flex items-center justify-center text-xl shadow-md hover:scale-110 transition">
          {isWished ? '❤️' : '🤍'}
        </button>
        {outOfStock && (
          <div className="absolute bottom-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* Title + price */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{listing.cropName}</h1>
          {listing.variety && <div className="text-sm text-gray-500 mt-0.5">{listing.variety}</div>}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-700">
            ₹{listing.price}<span className="text-base font-normal text-gray-400">/kg</span>
          </div>
          {listing.negotiable && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Negotiable
            </span>
          )}
        </div>
      </div>

      {/* Stock indicator */}
      <div className={`rounded-2xl p-3 mb-4 flex items-center gap-3 ${outOfStock ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
        <span className="text-2xl">{outOfStock ? '❌' : '✅'}</span>
        <div>
          <div className={`font-semibold text-sm ${outOfStock ? 'text-red-700' : 'text-green-700'}`}>
            {outOfStock ? 'Out of Stock' : `${listing.quantity} kg Available`}
          </div>
          <div className="text-xs text-gray-500">Min. order: {listing.minimumOrder || 10} kg</div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2.5 mb-4 shadow-sm">
        {[
          ['📍', 'Location', `${listing.district}${listing.taluk ? ', ' + listing.taluk : ''}, Karnataka`],
          ['📅', 'Listed',   timeAgo(listing.createdAt)],
          ['👁️', 'Views',    listing.views],
        ].map(([icon, label, val]) => (
          <div key={label} className="flex items-center gap-3 text-sm">
            <span className="text-base">{icon}</span>
            <span className="text-gray-500 w-20">{label}</span>
            <span className="text-gray-800 font-medium">{val}</span>
          </div>
        ))}
        {listing.description && (
          <div className="pt-2.5 border-t border-gray-100 text-sm text-gray-600 leading-relaxed">
            {listing.description}
          </div>
        )}
      </div>

      {/* Seller card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {(listing.seller?.name || listing.sellerName || 'F').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{listing.seller?.name || listing.sellerName}</div>
            <div className="text-xs text-gray-400">✅ Verified Farmer · {listing.seller?.district || listing.district}</div>
          </div>
          {listing.seller?.rating && (
            <div className="text-sm font-semibold text-yellow-600">⭐ {listing.seller.rating.toFixed(1)}</div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a href={`tel:${sellerPhone}`}
            className="flex items-center justify-center gap-1.5 py-2.5 border-2 border-green-700 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-50 transition">
            📞 Call
          </a>
          {waPhone
            ? (
              <a href={`https://wa.me/${waPhone}?text=${waMsg}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition">
                💬 WhatsApp
              </a>
            )
            : (
              <div className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-sm font-semibold cursor-not-allowed">
                💬 WhatsApp
              </div>
            )
          }
        </div>
      </div>

      {/* Buy button */}
      <button
        disabled={outOfStock}
        onClick={() => setShowPayment(true)}
        className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg hover:bg-orange-600 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      >
        {outOfStock ? '😔 Out of Stock' : `🛒 Buy Now — ₹${listing.price}/kg`}
      </button>

      {/* Payment bottom sheet */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => !paying && setShowPayment(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl w-full max-w-lg p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideUp 0.3s ease' }}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-bold text-gray-900 mb-1">Place Order</h2>
            <p className="text-sm text-gray-400 mb-5">{listing.cropName} · ₹{listing.price}/kg · {listing.quantity} kg left</p>

            {/* Quantity selector */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Quantity (kg)</span>
                <span className="text-xs text-gray-400">Max: {listing.quantity} kg</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQty(q => Math.max(listing.minimumOrder || 1, q - 5))}
                  className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 font-bold text-xl flex items-center justify-center hover:border-green-400 transition">
                  −
                </button>
                <input
                  type="number"
                  value={qty}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 0;
                    setQty(Math.min(listing.quantity, Math.max(1, v)));
                  }}
                  className="flex-1 text-center text-xl font-bold border-2 border-gray-200 rounded-xl py-2 focus:outline-none focus:border-green-400"
                />
                <button
                  onClick={() => setQty(q => Math.min(listing.quantity, q + 5))}
                  className="w-10 h-10 rounded-full bg-green-600 text-white font-bold text-xl flex items-center justify-center hover:bg-green-700 transition">
                  +
                </button>
              </div>
              {qty > listing.quantity && (
                <p className="text-red-500 text-xs mt-2 text-center">⚠️ Only {listing.quantity} kg available</p>
              )}
            </div>

            {/* Total */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Amount</span>
              <span className="text-2xl font-bold text-green-700">₹{total.toLocaleString('en-IN')}</span>
            </div>

            {/* Payment methods */}
            <div className="space-y-2 mb-5">
              {[
                { id: 'cash',    icon: '💵', name: 'Cash on Delivery', sub: 'Pay when you receive' },
                { id: 'phonepe', icon: '💜', name: 'PhonePe',          sub: 'UPI · Instant payment' },
                { id: 'upi',     icon: '📱', name: 'Any UPI App',      sub: 'GPay, Paytm, BHIM' },
              ].map(m => (
                <div key={m.id} onClick={() => setPayMethod(m.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all
                    ${payMethod === m.id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="text-2xl flex-shrink-0">{m.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.sub}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${payMethod === m.id ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>
                    {payMethod === m.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              ))}
            </div>

            <button
              disabled={paying || qty < 1 || qty > listing.quantity}
              onClick={confirmPayment}
              className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md">
              {paying
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                : `Confirm Order · ₹${total.toLocaleString('en-IN')}`}
            </button>
            <button onClick={() => setShowPayment(false)} disabled={paying}
              className="w-full mt-2 py-3 text-gray-500 text-sm hover:text-gray-700 transition">
              Cancel
            </button>
          </div>
          <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        </div>
      )}
    </div>
  );
}
