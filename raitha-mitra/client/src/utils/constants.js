// Crop emoji map
export const CROP_EMOJI = {
  Tomato: '🍅', Onion: '🧅', Potato: '🥔', Brinjal: '🍆',
  Cabbage: '🥬', Cauliflower: '🥦', Okra: '🌿', Carrot: '🥕',
  Spinach: '🥬', Beans: '🫘', Rice: '🍚', Wheat: '🌾',
  Maize: '🌽', Ragi: '🌾', Jowar: '🌾', Groundnut: '🥜',
  Mango: '🥭', Banana: '🍌', Pomegranate: '🍎', Grapes: '🍇',
};

export const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Pulses'];

export const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari', 'Bangalore Rural', 'Bangalore Urban',
  'Belgaum', 'Bellary', 'Bidar', 'Bijapur', 'Chamrajnagar',
  'Chickballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada',
  'Davanagere', 'Dharwad', 'Gadag', 'Gulbarga', 'Hassan',
  'Haveri', 'Kodagu', 'Kolar', 'Koppal', 'Mandya',
  'Mysuru', 'Raichur', 'Ramanagara', 'Shimoga', 'Tumkur',
  'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir',
];

export const MARKETS = [
  'Bangalore APMC', 'Mysuru Market', 'Hubli APMC',
  'Tumkur Market', 'Hassan Market',
];

// Format price
export const formatPrice = (p) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

// Time ago
export const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// Kannada translations (i18n-ready)
export const KN = {
  home: 'ಮನೆ', buy: 'ಖರೀದಿ', sell: 'ಮಾರಾಟ',
  prices: 'ಬೆಲೆಗಳು', login: 'ಲಾಗಿನ್', register: 'ನೋಂದಣಿ',
  search: 'ಹುಡುಕಿ', location: 'ಸ್ಥಳ',
};
