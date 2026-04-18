# 🌾 RAITHA MITRA — ರೈತ ಮಿತ್ರ
## Smart Agricultural Market Price & Trading Platform

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas free tier)

### 1. Install dependencies
```bash
npm run install-all
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit both files with your values
```

### 3. Run development
```bash
npm run dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000/api
```

### Demo Logins
| Username | Password | Role   |
|----------|----------|--------|
| farmer1  | 1234     | Seller |
| buyer1   | 1234     | Buyer  |

---

## 📂 Project Structure
```
raitha-mitra/
├── client/         React + Tailwind frontend
│   └── src/
│       ├── pages/  LoginPage, DashboardPage, BuyPage, SellPage, PricesPage, ...
│       ├── components/ Layout, UI components
│       ├── context/    AuthContext, SocketContext
│       └── utils/      api.js, constants.js
├── server/         Node.js + Express backend
│   ├── models/     User, Listing, Price, Order
│   ├── routes/     auth, listings, prices, payment, whatsapp, analytics
│   ├── middleware/ auth.js (JWT), upload.js (Multer)
│   └── config/     seedData.js
└── README.md
```

---

## 🔐 Auth API
```
POST /api/auth/register   { name, username, phone, password, role, district }
POST /api/auth/login      { username, password }  → { token, user }
GET  /api/auth/me         Bearer token required
```

## 📦 Listings API
```
GET    /api/listings       ?crop=&category=&district=&minPrice=&maxPrice=&page=
POST   /api/listings       multipart/form-data (Seller only)
GET    /api/listings/:id
PUT    /api/listings/:id   (owner only)
DELETE /api/listings/:id   (owner only)
GET    /api/listings/my
```

## 📊 Prices API
```
GET /api/prices                  ?crop=&market=&district=&category=
GET /api/prices/crop/:name       All markets for one crop
GET /api/prices/trending         Top crops by price increase
```

## 💬 WhatsApp Bot Commands
```
PRICE Tomato          → Prices across Karnataka APMCs
PRICE Onion Mysuru    → District-filtered prices
BUY Mango             → Active seller listings
TRENDING              → Today's top crops
HELP                  → All commands
```

### Twilio Setup
1. Sign up at twilio.com → WhatsApp Sandbox
2. Set webhook: `https://your-server.com/api/whatsapp/webhook`
3. Add TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN to `.env`

---

## 🚀 Deployment

### Frontend → Vercel
```bash
cd client && npm run build
npx vercel --prod
# Set REACT_APP_API_URL=https://your-backend.onrender.com/api
```

### Backend → Render.com
- Connect GitHub repo, set root to `/server`
- Build: `npm install` | Start: `node index.js`
- Add all .env variables in Render dashboard

### Database → MongoDB Atlas
- Create free M0 cluster
- Get connection string → set as MONGO_URI
- Whitelist 0.0.0.0/0 for cloud deployment

---

## 💜 PhonePe Integration
Current: Mock implementation (demo-ready)
Production: Register at phonepe.com/business → get Merchant ID + Salt Key → update .env

---

*Built for Karnataka's 5 million+ farmers. ರೈತ ಮಿತ್ರ — Fair prices. Direct trade. Digital inclusion.*
