/**
 * Raitha Mitra — Server v2
 * Adds: per-user socket rooms, order routes, payment routes re-mapped
 */
const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const path      = require('path');
require('dotenv').config();

const authRoutes      = require('./routes/auth');
const cropRoutes      = require('./routes/crops');
const listingRoutes   = require('./routes/listings');
const priceRoutes     = require('./routes/prices');
const paymentRoutes   = require('./routes/payment');
const whatsappRoutes  = require('./routes/whatsapp');
const analyticsRoutes = require('./routes/analytics');

const app    = express();
const server = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-user', (userId) => {
    socket.join(`user:${userId}`);
  });
  socket.on('join-location', (district) => {
    socket.join(`district:${district}`);
  });
  socket.on('disconnect', () => {});
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || process.env.NODE_ENV !== 'production') return cb(null, true);
    const allowed = [process.env.CLIENT_URL || 'http://localhost:3000', 'http://localhost:3000'];
    cb(allowed.includes(origin) ? null : new Error('CORS'), allowed.includes(origin));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 500,
  skip: () => process.env.NODE_ENV === 'development',
});
app.use('/api/', limiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Database ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/raitha_mitra')
  .then(async () => {
    console.log(`✅ MongoDB connected — ${mongoose.connection.db.databaseName}`);
    await seedDatabase();
  })
  .catch(err => console.error('❌ MongoDB error:', err.message));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/crops',     cropRoutes);
app.use('/api/listings',  listingRoutes);
app.use('/api/prices',    priceRoutes);
app.use('/api/payment',   paymentRoutes);
app.use('/api/orders',    paymentRoutes);   // same router, aliases /api/orders/*
app.use('/api/whatsapp',  whatsappRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => res.json({
  status: 'OK', platform: 'Raitha Mitra v2',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  timestamp: new Date().toISOString(),
}));

app.use((err, req, res, next) => {
  console.error('💥', err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});
app.use((req, res) => res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` }));

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seedDatabase() {
  const Price = require('./models/Price');
  const count = await Price.countDocuments();
  if (count === 0) {
    const { seedPrices } = require('./config/seedData');
    await Price.insertMany(seedPrices);
    console.log(`✅ Seeded ${seedPrices.length} prices`);
  }
  const User = require('./models/User');
  await User.seedDemoUsers();
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🌾 Raitha Mitra v2 — http://localhost:${PORT}/api\n`);
});

module.exports = { app, io };
