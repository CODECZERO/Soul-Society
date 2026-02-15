# Network Error Troubleshooting Guide

## Error
```
NetworkError when attempting to fetch resource.
Next.js version: 16.0.0 (Turbopack)
```

## Diagnosis

### ✅ Servers Running
- Backend: Port 8000 ✅
- Frontend: Port 3000 ✅

### ✅ Backend Accessible
```bash
curl http://localhost:8000/api/posts
# Returns data successfully
```

### ✅ CORS Configured
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
```

### ✅ Environment Variable Set
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Solutions

### Solution 1: Restart Frontend Server (Most Common)

Next.js needs to be restarted to pick up `.env.local` changes.

```bash
# Stop the frontend server (Ctrl+C)
cd frontend

# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

### Solution 2: Clear Browser Cache

The browser might be caching failed requests.

**Chrome/Firefox:**
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Refresh page (Ctrl+Shift+R)

**Or clear all cache:**
- Chrome: Settings → Privacy → Clear browsing data
- Firefox: Settings → Privacy → Clear Data

### Solution 3: Verify API URL in Browser

Open browser console and check:

```javascript
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should show: http://localhost:8000/api
```

If it shows `undefined`, the frontend server wasn't restarted after creating `.env.local`.

### Solution 4: Test API Connection

Visit the test page:
```
http://localhost:3000/api-test
```

This page will show:
- Environment variable value
- API connection status
- Specific errors

### Solution 5: Check for IPv4/IPv6 Issues

The backend is listening on IPv6 (`:::8000`). Try using `127.0.0.1` instead of `localhost`:

**Update `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Then restart frontend.

### Solution 6: Check Firewall

Ensure no firewall is blocking localhost connections:

```bash
# Check if port 8000 is accessible
curl -v http://localhost:8000/health

# Should return:
# {"success":true,"message":"Server is running","timestamp":"..."}
```

### Solution 7: Verify Backend is Actually Running

```bash
# Check backend process
ps aux | grep "tsx src/index.ts"

# Check port
netstat -tlnp | grep 8000
# or
ss -tlnp | grep 8000
```

### Solution 8: Check Backend Logs

Look at the backend terminal for errors. You should see requests coming in:

```
2025-10-28T06:11:24.872Z - GET /api/posts
Content-Type: application/json
```

If you don't see any requests, the frontend isn't reaching the backend.

---

## Step-by-Step Fix

### 1. Stop Both Servers

```bash
# In frontend terminal: Ctrl+C
# In backend terminal: Ctrl+C
```

### 2. Verify .env.local

```bash
cd frontend
cat .env.local
# Should show: NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

If file doesn't exist, create it:
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
```

### 3. Clear Frontend Cache

```bash
cd frontend
rm -rf .next
```

### 4. Start Backend

```bash
cd server
npm run dev
```

Wait for:
```
🚀 Server is running on port 8000
✅ MongoDB connected successfully
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
```

Wait for:
```
✓ Ready in 2.3s
○ Local:        http://localhost:3000
```

### 6. Test Connection

Open browser:
```
http://localhost:3000/api-test
```

Should show successful API responses.

### 7. Clear Browser Cache

- Open DevTools (F12)
- Network tab → Check "Disable cache"
- Hard refresh (Ctrl+Shift+R)

---

## Common Causes

| Cause | Solution |
|-------|----------|
| Frontend not restarted after .env.local created | Restart frontend server |
| Browser cache | Clear cache or disable in DevTools |
| Wrong API URL | Check .env.local and restart |
| Backend not running | Start backend with `npm run dev` |
| Port conflict | Check if another process is using port 8000 |
| CORS issue | Backend CORS is configured, should work |
| IPv6 vs IPv4 | Try `127.0.0.1` instead of `localhost` |

---

## Verification Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] `.env.local` exists with correct URL
- [ ] Frontend restarted after .env.local created
- [ ] Browser cache cleared
- [ ] `/api-test` page shows successful responses
- [ ] DevTools Network tab shows requests to `localhost:8000`
- [ ] Backend logs show incoming requests

---

## Quick Test Commands

### Test Backend Directly
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test posts endpoint
curl http://localhost:8000/api/posts

# Test donations endpoint
curl http://localhost:8000/api/donations
```

All should return JSON responses.

### Check Environment Variable in Frontend

Add this to any page:
```tsx
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
```

Should log: `API URL: http://localhost:8000/api`

---

## Still Not Working?

### Check Network Tab in DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for failed requests (red)
5. Click on failed request
6. Check:
   - Request URL (should be `http://localhost:8000/api/...`)
   - Status (should not be "failed" or "CORS error")
   - Response (any error message)

### Check Console for Errors

Look for:
- `Failed to fetch`
- `NetworkError`
- `CORS policy`
- `ERR_CONNECTION_REFUSED`

### Try Different Browser

Sometimes browser extensions or settings cause issues. Try:
- Chrome Incognito mode
- Firefox Private window
- Different browser entirely

---

## Advanced Debugging

### Enable Verbose Logging

**Backend** (`server/src/app.ts`):
Already has request logging enabled.

**Frontend** (`lib/api-service.ts`):
Add console.log before fetch:
```typescript
console.log('Fetching:', `${API_BASE_URL}/posts`)
```

### Use Network Proxy

If you suspect network issues, use a proxy like Charles or Fiddler to inspect traffic.

### Check System Hosts File

Ensure localhost is mapped correctly:
```bash
cat /etc/hosts | grep localhost
# Should show:
# 127.0.0.1       localhost
```

---

## Summary

**Most likely cause:** Frontend server needs to be restarted after creating `.env.local`.

**Quick fix:**
```bash
# Stop frontend (Ctrl+C)
cd frontend
rm -rf .next
npm run dev
# Clear browser cache
# Hard refresh (Ctrl+Shift+R)
```

**Test:** Visit `http://localhost:3000/api-test` to verify connection.

If still not working, check backend logs and browser DevTools Network tab for specific error messages.
