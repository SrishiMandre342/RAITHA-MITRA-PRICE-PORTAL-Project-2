# 🪟 Windows Setup Guide — Raitha Mitra

## Option A: Double-click (Easiest)
Double-click `START.bat` — it installs everything and starts both servers automatically.

## Option B: PowerShell
Right-click `START.ps1` → "Run with PowerShell"
(If blocked, first run: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`)

## Option C: Manual (Step by Step)

Open **3 separate PowerShell/Command Prompt windows** in the project folder:

### Window 1 — Install & start backend
```
cd server
npm install
npm run dev
```
Wait until you see: `🌾 Raitha Mitra v2 — http://localhost:5000/api`

### Window 2 — Install & start frontend
```
cd client
npm install
npm start
```
Browser opens automatically at http://localhost:3000

### Window 3 (optional) — Root only if using concurrently
```
npm install
npm run dev
```

---

## ✅ Prerequisites
- Node.js v18+ → https://nodejs.org (LTS version)
- MongoDB → Either:
  - **Local**: Install MongoDB Community https://www.mongodb.com/try/download/community
  - **Cloud (easier)**: Free MongoDB Atlas at https://cloud.mongodb.com
    - Create cluster → Connect → Get connection string
    - Paste into `server/.env` as `MONGO_URI=mongodb+srv://...`

## 🔧 Environment Files
The `.env` files are already pre-configured for local MongoDB.
If using MongoDB Atlas, edit `server\.env`:
```
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster0.xxxxx.mongodb.net/raitha_mitra
```

## 🌐 URLs
- Frontend:  http://localhost:3000
- Backend:   http://localhost:5000
- API Health: http://localhost:5000/api/health

## ❓ Common Errors

| Error | Fix |
|-------|-----|
| `'nodemon' is not recognized` | Run `npm install -g nodemon` |
| `MongoDB connection failed` | Start MongoDB service or use Atlas |
| `Port 3000 already in use` | Close other React apps or change port in client/.env |
| `Port 5000 already in use` | Change PORT in server/.env to 5001 |
| PowerShell script blocked | Run: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
