# Network Error Fix

## Error
```
NetworkError when attempting to fetch resource
```

## Root Cause

The frontend is trying to connect to the backend API, but there's a configuration issue.

## Solution

### 1. Created `.env.local` for Frontend

**File:** `/frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

This tells the frontend where to find the backend API.

### 2. Backend CORS Configuration

**File:** `/server/src/app.ts`

The backend already has CORS configured:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
```

### 3. Verify Ports

**Backend:** Running on port `8000` ✅ (from your logs)
**Frontend:** Should run on port `3000` (default Next.js port)

## Steps to Fix

### 1. Restart Frontend

After creating `.env.local`, you need to restart the frontend:

```bash
cd /home/mrrip/Downloads/steller_hackathon-main/frontend
# Stop the current dev server (Ctrl+C)
npm run dev
```

### 2. Verify Backend is Running

```bash
cd /home/mrrip/Downloads/steller_hackathon-main/server
npm run dev
```

Should show:
```
Server running on port 8000
Connected to MongoDB
```

### 3. Check Frontend Port

When you start the frontend, it should show:
```
- Local:        http://localhost:3000
```

If it's running on a different port (like 3001), you need to update the backend CORS:

**Option A:** Create `/server/.env` file:
```env
FRONTEND_URL=http://localhost:3001
```

**Option B:** Or update the port in the CORS config directly.

## Common Issues

### Issue 1: Frontend on Different Port

**Symptom:** Frontend runs on `http://localhost:3001` instead of `3000`

**Solution:** 
```bash
# In server directory
echo "FRONTEND_URL=http://localhost:3001" > .env
# Restart server
```

### Issue 2: Backend Not Running

**Symptom:** "Failed to fetch" or "Connection refused"

**Solution:**
```bash
cd server
npm run dev
```

### Issue 3: Wrong API URL

**Symptom:** 404 errors or "Cannot GET /api/..."

**Solution:** Check `.env.local` has correct URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Note the `/api` at the end!

## Verification

### Test Backend is Accessible

Open browser and go to:
```
http://localhost:8000/api/posts
```

Should return JSON data (posts array).

### Test Frontend Can Connect

1. Open frontend: `http://localhost:3000`
2. Open browser console (F12)
3. Check Network tab
4. Should see successful API calls to `http://localhost:8000/api/...`

## Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Backend (`.env`)
```env
FRONTEND_URL=http://localhost:3000
PORT=8000
MONGODB_URI=your_mongodb_connection_string
```

## CORS Explained

CORS (Cross-Origin Resource Sharing) allows the frontend (port 3000) to make requests to the backend (port 8000).

**Without CORS:**
```
Frontend (3000) → Backend (8000) ❌ BLOCKED
```

**With CORS:**
```
Frontend (3000) → Backend (8000) ✅ ALLOWED
```

The backend configuration:
```typescript
cors({
  origin: "http://localhost:3000",  // Allow frontend
  credentials: true                  // Allow cookies
})
```

## Quick Fix Checklist

- [ ] Created `/frontend/.env.local` with API URL
- [ ] Restarted frontend dev server
- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 3000
- [ ] Can access `http://localhost:8000/api/posts` in browser
- [ ] No CORS errors in browser console
- [ ] API calls show in Network tab

## If Still Not Working

### Check Browser Console

Press F12 and look for errors:

**CORS Error:**
```
Access to fetch at 'http://localhost:8000/api/posts' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution:** Update backend CORS origin

**Connection Refused:**
```
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

**Solution:** Backend is not running, start it

**404 Error:**
```
GET http://localhost:8000/api/posts 404 (Not Found)
```

**Solution:** Check API URL in `.env.local`

## Production Deployment

For production, update environment variables:

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

**Backend:**
```env
FRONTEND_URL=https://your-frontend-domain.com
```

## Summary

✅ Created `.env.local` for frontend
✅ Backend has CORS configured
✅ Need to restart frontend after creating `.env.local`
✅ Verify both servers are running on correct ports
✅ Test API endpoint in browser

The network error should be resolved after restarting the frontend!
