/**
 * Raitha Mitra WhatsApp Chatbot
 * Twilio WhatsApp Sandbox
 * Supports: English, Kannada (kn), Hindi (hi)
 * Auto-detects language from message
 */

const express  = require('express');
const router   = express.Router();
const Price    = require('../models/Price');
const Listing  = require('../models/Listing');

// ─── Language detection ───────────────────────────────────────────────────────
function detectLanguage(text) {
  // Kannada unicode range: \u0C80-\u0CFF
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  // Devanagari (Hindi) unicode range: \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
}

// ─── Multilingual responses ───────────────────────────────────────────────────
const STRINGS = {
  en: {
    welcome: (name) => `🌾 *Welcome to Raitha Mitra${name ? ', ' + name : ''}!*\nSmart Agricultural Trading Platform\n\n`,
    help: `📋 *Available Commands:*\n\n` +
      `1️⃣  *PRICE <crop>*\n    Get today's market prices\n    _Example: PRICE Tomato_\n\n` +
      `2️⃣  *PRICE <crop> <district>*\n    Prices in your district\n    _Example: PRICE Onion Mysuru_\n\n` +
      `3️⃣  *BUY <crop>*\n    Find sellers near you\n    _Example: BUY Mango_\n\n` +
      `4️⃣  *SELL <crop> <price> <qty> <district>*\n    List your crop for sale\n    _Example: SELL Tomato 25 100 Tumkur_\n\n` +
      `5️⃣  *STOCK <district>*\n    All available crops in a district\n    _Example: STOCK Haveri_\n\n` +
      `6️⃣  *TRENDING*\n    Top rising crops today\n\n` +
      `7️⃣  *MARKETS*\n    List all active markets\n\n` +
      `8️⃣  *HELP*\n    Show this menu\n\n` +
      `_Reply in English, ಕನ್ನಡ or हिंदी_`,
    noPrice: (crop) => `❌ No prices found for *${crop}*.\nTry: PRICE Tomato`,
    noBuy: (crop) => `❌ No listings found for *${crop}* right now.\nCheck back later or try another crop.`,
    noStock: (dist) => `❌ No active listings in *${dist}* right now.`,
    noTrending: `📈 No trending data available right now.`,
    unknown: `❓ I didn't understand that.\n\nSend *HELP* to see all commands.\nYou can also reply in ಕನ್ನಡ or हिंदी`,
    footer: `\n_Raitha Mitra · localhost:3000_`,
  },
  kn: {
    welcome: (name) => `🌾 *ರೈತ ಮಿತ್ರಕ್ಕೆ ಸ್ವಾಗತ${name ? ', ' + name : ''}!*\nಸ್ಮಾರ್ಟ್ ಕೃಷಿ ವ್ಯಾಪಾರ ವೇದಿಕೆ\n\n`,
    help: `📋 *ಲಭ್ಯವಿರುವ ಆದೇಶಗಳು:*\n\n` +
      `1️⃣  *PRICE <ಬೆಳೆ>* - ಇಂದಿನ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ\n` +
      `2️⃣  *BUY <ಬೆಳೆ>* - ಮಾರಾಟಗಾರರನ್ನು ಹುಡುಕಿ\n` +
      `3️⃣  *STOCK <ಜಿಲ್ಲೆ>* - ಜಿಲ್ಲೆಯಲ್ಲಿ ಲಭ್ಯವಿರುವ ಬೆಳೆಗಳು\n` +
      `4️⃣  *TRENDING* - ಇಂದು ಏರಿಕೆಯಲ್ಲಿರುವ ಬೆಳೆಗಳು\n` +
      `5️⃣  *HELP* - ಈ ಮೆನು ತೋರಿಸಿ\n\n` +
      `_ಉದಾಹರಣೆ: PRICE ಟೊಮ್ಯಾಟೊ_`,
    noPrice: (crop) => `❌ *${crop}* ಗೆ ಬೆಲೆ ಮಾಹಿತಿ ಸಿಗಲಿಲ್ಲ.\nಪ್ರಯತ್ನಿಸಿ: PRICE Tomato`,
    noBuy: (crop) => `❌ *${crop}* ಗೆ ಯಾವುದೇ ಪಟ್ಟಿ ಇಲ್ಲ.\nನಂತರ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ.`,
    noStock: (dist) => `❌ *${dist}* ನಲ್ಲಿ ಯಾವುದೇ ಬೆಳೆ ಲಭ್ಯವಿಲ್ಲ.`,
    noTrending: `📈 ಇಂದು ಯಾವುದೇ ಟ್ರೆಂಡಿಂಗ್ ಡೇಟಾ ಇಲ್ಲ.`,
    unknown: `❓ ಅರ್ಥವಾಗಲಿಲ್ಲ.\n*HELP* ಕಳುಹಿಸಿ ಎಲ್ಲಾ ಆದೇಶಗಳನ್ನು ನೋಡಲು.`,
    footer: `\n_ರೈತ ಮಿತ್ರ · localhost:3000_`,
  },
  hi: {
    welcome: (name) => `🌾 *राइता मित्र में आपका स्वागत है${name ? ', ' + name : ''}!*\nस्मार्ट कृषि व्यापार मंच\n\n`,
    help: `📋 *उपलब्ध कमांड:*\n\n` +
      `1️⃣  *PRICE <फसल>* - आज के बाज़ार भाव\n` +
      `2️⃣  *BUY <फसल>* - विक्रेता खोजें\n` +
      `3️⃣  *STOCK <जिला>* - जिले में उपलब्ध फसलें\n` +
      `4️⃣  *TRENDING* - आज बढ़ती फसलें\n` +
      `5️⃣  *HELP* - यह मेनू दिखाएं\n\n` +
      `_उदाहरण: PRICE Tomato_`,
    noPrice: (crop) => `❌ *${crop}* के लिए कोई भाव नहीं मिला.\nकोशिश करें: PRICE Tomato`,
    noBuy: (crop) => `❌ *${crop}* के लिए अभी कोई लिस्टिंग नहीं है.`,
    noStock: (dist) => `❌ *${dist}* में अभी कोई फसल उपलब्ध नहीं है.`,
    noTrending: `📈 अभी कोई ट्रेंडिंग डेटा उपलब्ध नहीं है.`,
    unknown: `❓ समझ नहीं आया.\n*HELP* भेजें सभी कमांड देखने के लिए.`,
    footer: `\n_राइता मित्र · localhost:3000_`,
  },
};

// ─── Crop name map (Hindi/Kannada → English) ──────────────────────────────────
const CROP_ALIASES = {
  'ಟೊಮ್ಯಾಟೊ': 'Tomato',  'ಟೊಮೆಟೊ': 'Tomato',
  'ಈರುಳ್ಳಿ':  'Onion',   'ಆಲೂಗಡ್ಡೆ': 'Potato',
  'ಮಾವು':     'Mango',   'ಬಾಳೆ':    'Banana',
  'ಭತ್ತ':     'Rice',    'ಗೋಧಿ':    'Wheat',
  'ಜೋಳ':      'Maize',
  'टमाटर':    'Tomato',  'प्याज':   'Onion',
  'आलू':      'Potato',  'आम':      'Mango',
  'केला':     'Banana',  'चावल':    'Rice',
  'गेहूं':    'Wheat',   'मक्का':   'Maize',
};

function normalizeCrop(name) {
  return CROP_ALIASES[name] || name;
}

// ─── Format price reply ───────────────────────────────────────────────────────
function formatPriceReply(prices, cropName, lang) {
  const s = STRINGS[lang];
  let reply = `📊 *${cropName} - ಬೆಲೆ / Price / भाव*\n`;
  reply += `📅 ${new Date().toLocaleDateString('en-IN')}\n\n`;
  prices.forEach(p => {
    reply += `🏪 *${p.market}*\n`;
    reply += `   ₹${p.minPriceKg} - ₹${p.maxPriceKg}/kg\n`;
    reply += `   Modal: ₹${p.modalPriceKg}/kg `;
    reply += p.trend === 'up' ? '📈' : p.trend === 'down' ? '📉' : '➡️';
    reply += '\n\n';
  });
  reply += s.footer;
  return reply;
}

// ─── Format listing reply ─────────────────────────────────────────────────────
function formatListingReply(listings, cropName, lang) {
  const s = STRINGS[lang];
  let reply = `🛒 *${cropName} - ಲಭ್ಯ / Available / उपलब्ध*\n\n`;
  listings.forEach((l, i) => {
    reply += `${i + 1}. *${l.cropName}* — ₹${l.price}/kg\n`;
    reply += `   📦 ${l.quantity} kg available\n`;
    reply += `   📍 ${l.district}\n`;
    reply += `   👤 ${l.sellerName}\n`;
    reply += `   📞 ${l.sellerPhone}\n\n`;
  });
  reply += s.footer;
  return reply;
}

// ─── Main message processor ───────────────────────────────────────────────────
async function processMessage(body) {
  const lang    = detectLanguage(body);
  const s       = STRINGS[lang];
  const trimmed = body.trim();
  const upper   = trimmed.toUpperCase();
  const parts   = trimmed.split(/\s+/);
  const cmd     = parts[0].toUpperCase();

  console.log(`📱 [WhatsApp] lang=${lang} cmd=${cmd} msg="${trimmed}"`);

  // ── HELLO / HI / START ──────────────────────────────────────────────────────
  if (['HI', 'HELLO', 'START', 'NAMASTE', 'NAMASKARA',
       'ನಮಸ್ಕಾರ', 'ಹಾಯ್', 'नमस्ते', 'हेलो'].includes(upper)) {
    return s.welcome('') + s.help;
  }

  // ── HELP ────────────────────────────────────────────────────────────────────
  if (cmd === 'HELP' || upper === 'MENU') {
    return s.help;
  }

  // ── PRICE <crop> [district] ─────────────────────────────────────────────────
  if (cmd === 'PRICE' && parts.length >= 2) {
    const rawCrop  = parts[1];
    const cropName = normalizeCrop(rawCrop);
    const district = parts[2] ? normalizeCrop(parts[2]) : null;

    const query = { cropName: { $regex: cropName, $options: 'i' } };
    if (district) query.district = { $regex: district, $options: 'i' };

    const prices = await Price.find(query).sort({ priceDate: -1 }).limit(5);
    if (!prices.length) return s.noPrice(cropName);
    return formatPriceReply(prices, cropName, lang);
  }

  // ── BUY <crop> [district] ───────────────────────────────────────────────────
  if (cmd === 'BUY' && parts.length >= 2) {
    const rawCrop  = parts.slice(1).join(' ');
    const cropName = normalizeCrop(rawCrop);

    const listings = await Listing.find({
      cropName: { $regex: cropName, $options: 'i' },
      status:   'active',
    }).limit(5);

    if (!listings.length) return s.noBuy(cropName);
    return formatListingReply(listings, cropName, lang);
  }

  // ── STOCK <district> ────────────────────────────────────────────────────────
  if (cmd === 'STOCK' && parts.length >= 2) {
    const district = parts.slice(1).join(' ');

    const listings = await Listing.find({
      district: { $regex: district, $options: 'i' },
      status:   'active',
    }).limit(10);

    if (!listings.length) return s.noStock(district);

    let reply = `📍 *${district} - ಲಭ್ಯ ಬೆಳೆಗಳು / Available / उपलब्ध*\n\n`;
    listings.forEach((l, i) => {
      reply += `${i + 1}. *${l.cropName}* — ₹${l.price}/kg\n`;
      reply += `   📦 ${l.quantity}kg · 👤 ${l.sellerName} · 📞 ${l.sellerPhone}\n\n`;
    });
    reply += STRINGS[lang].footer;
    return reply;
  }

  // ── TRENDING ────────────────────────────────────────────────────────────────
  if (cmd === 'TRENDING') {
    const trending = await Price.find({ trend: 'up' })
      .sort({ priceChangePct: -1 })
      .limit(7);
    if (!trending.length) return s.noTrending;

    let reply = `📈 *ಟ್ರೆಂಡಿಂಗ್ / Trending / ट्रेंडिंग*\n\n`;
    trending.forEach((p, i) => {
      reply += `${i + 1}. *${p.cropName}* — ₹${p.modalPriceKg}/kg `;
      reply += `📈 +${(p.priceChangePct || 0).toFixed(1)}%\n`;
    });
    reply += STRINGS[lang].footer;
    return reply;
  }

  // ── MARKETS ─────────────────────────────────────────────────────────────────
  if (cmd === 'MARKETS') {
    const markets = await Price.distinct('market');
    let reply = `🏪 *ಮಾರುಕಟ್ಟೆಗಳು / Markets / बाज़ार*\n\n`;
    markets.forEach((m, i) => { reply += `${i + 1}. ${m}\n`; });
    reply += STRINGS[lang].footer;
    return reply;
  }

  // ── SELL <crop> <price> <qty> <district> ────────────────────────────────────
  if (cmd === 'SELL') {
    return `✅ To list your crop, please register on Raitha Mitra:\n\n` +
           `🌐 localhost:3000/register\n\n` +
           `Then use the *Sell* section to post your crop listing with photo and details.` +
           STRINGS[lang].footer;
  }

  // ── Unknown ─────────────────────────────────────────────────────────────────
  return s.unknown;
}

// ─── POST /api/whatsapp/webhook (Twilio calls this) ───────────────────────────
router.post('/webhook', async (req, res) => {
  try {
    const incomingMsg = req.body.Body || '';
    const from        = req.body.From || '';

    console.log(`\n📱 WhatsApp IN from ${from}: "${incomingMsg}"`);

    const reply = await processMessage(incomingMsg);

    console.log(`📤 WhatsApp OUT: "${reply.substring(0, 80)}..."`);

    // Twilio expects TwiML XML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Message><Body>${reply}</Body></Message>\n</Response>`;

    res.set('Content-Type', 'text/xml');
    res.send(twiml);
  } catch (err) {
    console.error('❌ WhatsApp webhook error:', err);
    const errTwiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Message><Body>Sorry, something went wrong. Please try again.\nSend HELP for commands.</Body></Message>\n</Response>`;
    res.set('Content-Type', 'text/xml');
    res.status(200).send(errTwiml);
  }
});

// ─── GET /api/whatsapp/prices ─────────────────────────────────────────────────
router.get('/prices', async (req, res) => {
  try {
    const { crop, district } = req.query;
    if (!crop) return res.status(400).json({ error: 'crop param required' });
    const query = { cropName: { $regex: crop, $options: 'i' } };
    if (district) query.district = { $regex: district, $options: 'i' };
    const prices = await Price.find(query).sort({ priceDate: -1 }).limit(10);
    res.json({ success: true, prices });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prices.' });
  }
});

// ─── GET /api/whatsapp/listings ───────────────────────────────────────────────
router.get('/listings', async (req, res) => {
  try {
    const { crop, district } = req.query;
    const query = { status: 'active' };
    if (crop)     query.cropName = { $regex: crop,     $options: 'i' };
    if (district) query.district = { $regex: district, $options: 'i' };
    const listings = await Listing.find(query).limit(10)
      .select('cropName price quantity district sellerName sellerPhone');
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch listings.' });
  }
});

module.exports = router;
