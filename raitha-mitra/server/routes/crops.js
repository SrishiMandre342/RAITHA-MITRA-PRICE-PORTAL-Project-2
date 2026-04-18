/**
 * Crops Routes — Static crop catalog
 */
const express = require('express');
const router = express.Router();

const CROP_CATALOG = [
  { name: 'Tomato', category: 'Vegetables', emoji: '🍅', seasons: ['Kharif', 'Rabi'] },
  { name: 'Onion', category: 'Vegetables', emoji: '🧅', seasons: ['Rabi'] },
  { name: 'Potato', category: 'Vegetables', emoji: '🥔', seasons: ['Rabi'] },
  { name: 'Brinjal', category: 'Vegetables', emoji: '🍆', seasons: ['Kharif', 'Rabi'] },
  { name: 'Cabbage', category: 'Vegetables', emoji: '🥬', seasons: ['Rabi'] },
  { name: 'Cauliflower', category: 'Vegetables', emoji: '🥦', seasons: ['Rabi'] },
  { name: 'Okra', category: 'Vegetables', emoji: '🌿', seasons: ['Kharif'] },
  { name: 'Carrot', category: 'Vegetables', emoji: '🥕', seasons: ['Rabi'] },
  { name: 'Mango', category: 'Fruits', emoji: '🥭', seasons: ['Summer'] },
  { name: 'Banana', category: 'Fruits', emoji: '🍌', seasons: ['Year-round'] },
  { name: 'Pomegranate', category: 'Fruits', emoji: '🍎', seasons: ['Kharif'] },
  { name: 'Grapes', category: 'Fruits', emoji: '🍇', seasons: ['Rabi'] },
  { name: 'Rice', category: 'Grains', emoji: '🍚', seasons: ['Kharif'] },
  { name: 'Wheat', category: 'Grains', emoji: '🌾', seasons: ['Rabi'] },
  { name: 'Maize', category: 'Grains', emoji: '🌽', seasons: ['Kharif'] },
  { name: 'Ragi', category: 'Grains', emoji: '🌾', seasons: ['Kharif'] },
  { name: 'Jowar', category: 'Grains', emoji: '🌾', seasons: ['Kharif'] },
  { name: 'Groundnut', category: 'Pulses', emoji: '🥜', seasons: ['Kharif'] },
];

router.get('/', (req, res) => {
  const { category } = req.query;
  const crops = category
    ? CROP_CATALOG.filter(c => c.category.toLowerCase() === category.toLowerCase())
    : CROP_CATALOG;
  res.json({ success: true, crops });
});

module.exports = router;
