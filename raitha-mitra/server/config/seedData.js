/**
 * Seed Data — Simulates AGMARKNET price data for Karnataka markets
 */

const CROPS = [
  { name: 'Tomato', category: 'Vegetables', base: 2000 },
  { name: 'Onion', category: 'Vegetables', base: 2500 },
  { name: 'Potato', category: 'Vegetables', base: 1800 },
  { name: 'Brinjal', category: 'Vegetables', base: 2200 },
  { name: 'Cabbage', category: 'Vegetables', base: 1200 },
  { name: 'Cauliflower', category: 'Vegetables', base: 3000 },
  { name: 'Okra', category: 'Vegetables', base: 3500 },
  { name: 'Carrot', category: 'Vegetables', base: 2800 },
  { name: 'Mango', category: 'Fruits', base: 6000 },
  { name: 'Banana', category: 'Fruits', base: 2500 },
  { name: 'Pomegranate', category: 'Fruits', base: 12000 },
  { name: 'Grapes', category: 'Fruits', base: 5000 },
  { name: 'Rice', category: 'Grains', base: 4500 },
  { name: 'Wheat', category: 'Grains', base: 3200 },
  { name: 'Maize', category: 'Grains', base: 2000 },
  { name: 'Groundnut', category: 'Pulses', base: 8000 },
];

const MARKETS = [
  { name: 'Bangalore APMC', district: 'Bangalore Rural' },
  { name: 'Mysuru Market', district: 'Mysuru' },
  { name: 'Hubli APMC', district: 'Dharwad' },
  { name: 'Tumkur Market', district: 'Tumkur' },
  { name: 'Hassan Market', district: 'Hassan' },
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const seedPrices = [];

CROPS.forEach((crop) => {
  MARKETS.forEach((market) => {
    const variance = Math.floor(crop.base * 0.15);
    const minPrice = crop.base - variance;
    const maxPrice = crop.base + variance;
    const modalPrice = Math.floor((minPrice + maxPrice) / 2) + randomBetween(-100, 100);
    const previousPrice = modalPrice + randomBetween(-300, 300);
    const priceChange = modalPrice - previousPrice;
    const priceChangePct = parseFloat(((priceChange / previousPrice) * 100).toFixed(2));
    const trend = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'stable';

    seedPrices.push({
      cropName: crop.name,
      category: crop.category,
      market: market.name,
      district: market.district,
      state: 'Karnataka',
      minPrice,
      maxPrice,
      modalPrice,
      minPriceKg: parseFloat((minPrice / 100).toFixed(2)),
      maxPriceKg: parseFloat((maxPrice / 100).toFixed(2)),
      modalPriceKg: parseFloat((modalPrice / 100).toFixed(2)),
      arrivals: randomBetween(10, 500),
      previousPrice,
      priceChange,
      priceChangePct,
      trend,
      source: 'Simulated',
      priceDate: new Date(),
    });
  });
});

module.exports = { seedPrices };
