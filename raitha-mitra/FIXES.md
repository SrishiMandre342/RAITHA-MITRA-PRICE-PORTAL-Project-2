# 🔧 AUTH BUG FIXES — Raitha Mitra

This document explains every root cause found and exactly what was changed to fix it.

---

## Bug 1 — Double Password Hashing (CRITICAL — most likely cause of 401)

**File:** `server/models/User.js`

**What was happening:**
The `pre('save')` hook hashes the password whenever `this.isModified('password')` is true.
In the original `auth.js`, after creating a user, we called:
```js
user.lastLogin = new Date();
await user.save({ validateBeforeSave: false });  // ← THIS re-triggered the hook!
```
`user.save()` with `validateBeforeSave: false` still runs middleware hooks.
So the already-hashed password got hashed AGAIN.
Now when login runs `bcrypt.compare(plaintext, doubleHashedPassword)` → it always returns `false` → 401.

**Fix applied:**
Replaced `user.save()` with `User.updateOne()` which does NOT trigger the pre-save hook:
```js
// BEFORE (broken):
user.lastLogin = new Date();
await user.save({ validateBeforeSave: false });

// AFTER (fixed):
await User.updateOne({ _id: user._id }, { lastLogin: new Date() });
```

---

## Bug 2 — bcrypt salt rounds too high (caused timeouts)

**File:** `server/models/User.js`

**What was happening:**
Salt rounds were set to 12. On low-spec dev machines this takes 2–5 seconds per hash.
When combined with network timeout settings, requests appeared to hang or fail.

**Fix:** Reduced to 10 (still secure, 10x faster).

---

## Bug 3 — Infinite redirect loop on 401

**File:** `client/src/utils/api.js`

**What was happening:**
The response interceptor redirected to `/login` on ANY 401 response.
On app startup, `AuthContext` calls `/api/auth/me` to restore session.
If no token exists, `/me` returns 401 → interceptor fires → redirects to `/login` →
React mounts LoginPage → AuthContext re-runs → calls `/me` again → 401 → loop → blank screen.

**Fix:**
```js
// BEFORE (broken):
if (status === 401) {
  window.location.href = '/login';  // fires on /auth/me too!
}

// AFTER (fixed):
const isAuthRoute = url.includes('/auth/');
if (status === 401 && !isAuthRoute) {  // only redirect for protected API calls
  window.location.href = '/login';
}
```

---

## Bug 4 — LoginPage didn't show error messages

**File:** `client/src/pages/LoginPage.jsx`

**What was happening:**
On login failure the component caught the error but only called `toast.error()`.
If the toast library wasn't configured or the message was in a nested field,
the user saw nothing useful and didn't know what was wrong.

**Fix:** Added a visible error `<div>` inside the form that renders `err.response?.data?.error`.

---

## Bug 5 — Missing demo user seeding

**File:** `server/index.js` + `server/models/User.js`

**What was happening:**
The server seeded price data but never created the demo users (`farmer1`, `buyer1`).
So demo logins always returned "Invalid username or password" because the users didn't exist.

**Fix:** Added `User.seedDemoUsers()` static method that creates the 3 demo accounts on startup.

---

## Bug 6 — JWT_SECRET mismatch

**Files:** `server/models/User.js`, `server/middleware/auth.js`

**What was happening:**
`generateToken()` used fallback `'fallback_secret'`.
`protect` middleware used fallback `'fallback_secret'`.
These matched — BUT if `.env` was partially set (e.g. JWT_SECRET set in one place but not another),
the values could diverge. Also, different strings in dev vs prod meant tokens signed in dev
were rejected by the middleware.

**Fix:** Both files now use the same explicit fallback constant:
```js
const JWT_SECRET = process.env.JWT_SECRET || 'raitha_mitra_dev_secret_key_12345';
```

---

## Bug 7 — CORS blocking Postman / direct API calls

**File:** `server/index.js`

**What was happening:**
CORS was configured with `origin: process.env.CLIENT_URL` which only allowed `http://localhost:3000`.
Requests from Postman, curl, or mobile had no `Origin` header and were silently blocked.

**Fix:**
```js
origin: (origin, callback) => {
  if (!origin) return callback(null, true);  // allow no-origin requests (Postman, curl)
  // ... rest of logic
}
```

---

## How to verify everything is working

### 1. Run the debug script
```bash
cd server
node debug-auth.js
```
All 8 steps should show ✅.

### 2. Test with curl
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","username":"testcurl","phone":"9876543210","password":"test123","role":"seller","district":"Tumkur"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testcurl","password":"test123"}'

# Demo user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"farmer1","password":"1234"}'
```

### 3. Check DB users
```
GET http://localhost:5000/api/auth/debug-users
```

### 4. Check server logs
When login is called you should see:
```
📨 [AUTH] POST /api/auth/login
   Body keys:    username, password
🔍 [login] Looking up user: "farmer1"
✅ [login] User found: "farmer1" (id: ...)
🔑 [matchPassword] Comparing passwords for: farmer1
   bcrypt.compare result: ✅ MATCH
🎟️  [generateToken] Signing JWT for: farmer1
```
