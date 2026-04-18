/**
 * SellPage v2 — cleaned up, no demo data, real-time listing refresh
 */
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { KARNATAKA_DISTRICTS, CROP_EMOJI, timeAgo } from '../utils/constants';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const CROP_NAMES = ['Tomato','Onion','Potato','Brinjal','Cabbage','Cauliflower','Okra','Carrot',
  'Spinach','Beans','Rice','Wheat','Maize','Ragi','Jowar','Groundnut','Mango','Banana','Pomegranate','Grapes'];
const CAT_MAP = {Tomato:'Vegetables',Onion:'Vegetables',Potato:'Vegetables',Brinjal:'Vegetables',
  Cabbage:'Vegetables',Cauliflower:'Vegetables',Okra:'Vegetables',Carrot:'Vegetables',Rice:'Grains',
  Wheat:'Grains',Maize:'Grains',Ragi:'Grains',Jowar:'Grains',Groundnut:'Pulses',
  Mango:'Fruits',Banana:'Fruits',Pomegranate:'Fruits',Grapes:'Fruits'};

const STATUS_COLOR = {
  active: 'bg-green-100 text-green-700',
  sold:   'bg-gray-100 text-gray-500',
  expired:'bg-yellow-100 text-yellow-700',
};

export default function SellPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [form, setForm] = useState({
    cropName: 'Tomato', category: 'Vegetables', variety: '',
    price: '', quantity: '', minimumOrder: '10',
    district: user?.district || 'Tumkur', taluk: '',
    description: '', negotiable: true, quantityUnit: 'kg',
  });
  const [images, setImages]     = useState([]);
  const [previews, setPreviews] = useState([]);
  const [posting, setPosting]   = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [loadingML, setLoadingML]   = useState(true);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (form.cropName && CAT_MAP[form.cropName]) {
      setForm(p => ({ ...p, category: CAT_MAP[form.cropName] }));
    }
  }, [form.cropName]);

  useEffect(() => {
    api.get('/listings/my')
      .then(r => { setMyListings(r.data.listings); setLoadingML(false); })
      .catch(() => setLoadingML(false));
  }, []);

  // Real-time: refresh my listings when inventory changes
  useEffect(() => {
    if (!socket) return;
    const handler = data => {
      setMyListings(prev => prev.map(l =>
        l._id === data.listingId
          ? { ...l, quantity: data.newQuantity, status: data.status }
          : l
      ));
    };
    socket.on('inventory-update', handler);
    return () => socket.off('inventory-update', handler);
  }, [socket]);

  const handleImages = e => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.price || !form.quantity) { toast.error('Price and quantity are required'); return; }
    if (parseFloat(form.price) <= 0)   { toast.error('Price must be greater than 0'); return; }
    if (parseFloat(form.quantity) <= 0){ toast.error('Quantity must be greater than 0'); return; }

    setPosting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));

      const res = await api.post('/listings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`${form.cropName} listed successfully! 🎉`);
      setMyListings(prev => [res.data.listing, ...prev]);
      setForm(p => ({ ...p, price: '', quantity: '', description: '', variety: '', taluk: '' }));
      setImages([]); setPreviews([]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post listing');
    } finally { setPosting(false); }
  };

  const deleteListing = async id => {
    if (!window.confirm('Remove this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      setMyListings(prev => prev.filter(l => l._id !== id));
      toast.success('Listing removed');
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div className="space-y-5 fade-in">
      <h1 className="text-xl font-bold text-gray-800">🌱 List Your Crop</h1>

      {/* Form */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">

        {/* Image upload */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2">📸 Crop Photos <span className="text-gray-400 font-normal">(optional)</span></label>
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handleImages} />
            {previews.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {previews.map((src, i) => (
                  <img key={i} src={src} alt="" className="w-20 h-20 object-cover rounded-xl border-2 border-green-300 flex-shrink-0" />
                ))}
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0 text-3xl">+</div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-green-400 transition">
                <div className="text-4xl mb-2">📷</div>
                <div className="text-sm text-gray-500 font-medium">Tap to add photos</div>
                <div className="text-xs text-gray-400 mt-1">Camera · Gallery · Up to 5 images</div>
              </div>
            )}
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Crop Name *</label>
              <select value={form.cropName} onChange={set('cropName')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                {CROP_NAMES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Variety</label>
              <input value={form.variety} onChange={set('variety')} placeholder="e.g. Nasik Onion"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price (₹/kg) *</label>
              <input type="number" min="1" value={form.price} onChange={set('price')} placeholder="25"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity (kg) *</label>
              <input type="number" min="1" value={form.quantity} onChange={set('quantity')} placeholder="100"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Min. Order (kg)</label>
              <input type="number" min="1" value={form.minimumOrder} onChange={set('minimumOrder')} placeholder="10"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">District *</label>
              <select value={form.district} onChange={set('district')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                {KARNATAKA_DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Taluk / Village</label>
            <input value={form.taluk} onChange={set('taluk')} placeholder="e.g. Kolar, Malur"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={set('description')}
              placeholder="Fresh, organic, available from tomorrow..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className={`relative w-12 h-6 rounded-full transition-colors ${form.negotiable ? 'bg-green-600' : 'bg-gray-300'}`}
              onClick={() => setForm(p => ({ ...p, negotiable: !p.negotiable }))}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.negotiable ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-gray-700 font-medium">Price is negotiable</span>
          </label>

          <button type="submit" disabled={posting}
            className="w-full py-3.5 bg-green-700 text-white rounded-xl font-bold text-base hover:bg-green-800 transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
            {posting
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting...</>
              : '🌱 Post Listing'}
          </button>
        </form>
      </div>

      {/* My listings */}
      <section>
        <h2 className="font-bold text-gray-800 text-base mb-3">My Listings</h2>
        {loadingML ? (
          Array(2).fill(0).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl mb-2" />)
        ) : myListings.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">🌱</div>
            <div className="text-gray-500 font-medium">No listings yet</div>
            <div className="text-gray-400 text-sm mt-1">Post your first crop above!</div>
          </div>
        ) : (
          <div className="space-y-2">
            {myListings.map(l => (
              <div key={l._id} className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
                <div className="text-3xl flex-shrink-0">{CROP_EMOJI[l.cropName] || '🌿'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{l.cropName}{l.variety ? ` · ${l.variety}` : ''}</div>
                  <div className="text-green-700 font-bold">₹{l.price}/kg</div>
                  <div className="text-xs text-gray-400">{l.quantity} kg · {l.district} · {timeAgo(l.createdAt)}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[l.status] || 'bg-gray-100 text-gray-600'}`}>
                    {l.status === 'active' ? '✅ Live' : l.status}
                  </span>
                  <button onClick={() => deleteListing(l._id)}
                    className="text-xs text-red-400 hover:text-red-600 transition">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
