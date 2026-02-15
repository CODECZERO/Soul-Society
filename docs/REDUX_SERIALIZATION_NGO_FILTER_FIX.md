# Redux Serialization & NGO Dashboard Filter Fix

## Problems Fixed

1. **Redux Serialization Error** - `createdAt` was a Date object (non-serializable)
2. **NGO Dashboard Stats** - Using XLM amounts instead of INR

---

## Fix 1: Redux Serialization Error

### The Error

```
A non-serializable value was detected in the state, 
in the path: `ngoAuth.ngoProfile.createdAt`. 
Value: {} (Date object)
```

### Root Cause

Redux requires all state to be serializable (JSON-compatible). Date objects are not serializable.

**Before:**
```typescript
interface NGOProfile {
  ...
  createdAt: Date  // ❌ Not serializable
}

const ngoProfile: NGOProfile = {
  ...
  createdAt: new Date(userData.createdAt || Date.now()),  // ❌ Date object
}
```

### The Fix

**File:** `/frontend/lib/redux/slices/ngo-auth-slice.ts`

**Changed:**
```typescript
interface NGOProfile {
  ...
  createdAt: string  // ✅ ISO string (serializable)
}

const ngoProfile: NGOProfile = {
  ...
  createdAt: userData.createdAt || new Date().toISOString(),  // ✅ String
}
```

**Changes Made:**
1. Line 10: Changed type from `Date` to `string`
2. Line 54: Changed `new Date(...)` to `.toISOString()` (login)
3. Line 108: Changed `new Date(...)` to `.toISOString()` (signup)

---

## Fix 2: NGO Dashboard Stats

### The Problem

Dashboard was calculating stats from donations (in XLM) without converting to INR.

**Before:**
```typescript
const totalRaised = ngoDonations.reduce((sum, d) => sum + (d.Amount || 0), 0)
// Amount is in XLM, not INR! ❌
```

### The Fix

**File:** `/frontend/app/ngo-dashboard/page.tsx`

Use `CollectedAmount` from posts (already converted to INR by backend):

```typescript
const totalRaised = ngoPosts.reduce((sum, post) => sum + (post.CollectedAmount || 0), 0)
// CollectedAmount is in INR ✅
```

---

## How NGO Dashboard Filtering Works

### Data Flow

```
1. NGO logs in
   → ngoProfile.id = "507f1f77bcf86cd799439011"
   ↓
2. Load all posts from backend
   GET /api/posts
   ↓
3. Filter posts for this NGO
   const ngoPosts = posts.filter(post => post.NgoRef === ngoProfile.id)
   ↓
4. Calculate stats from filtered posts
   totalRaised = sum of CollectedAmount (INR)
   ↓
5. Display only this NGO's posts and stats
```

### Post Model Reference

**Backend Post Model:**
```typescript
{
  _id: "68fda9e98ceedc5ae1f2988d",
  Title: "Help Children",
  NgoRef: "507f1f77bcf86cd799439011",  // ← References NGO
  CollectedAmount: 1500,  // ← Already in INR
  ...
}
```

**Frontend Filtering:**
```typescript
// Only show posts where NgoRef matches logged-in NGO's ID
const ngoPosts = allPosts.filter(post => post.NgoRef === ngoProfile?.id)
```

---

## Stats Calculation (Fixed)

### Before (Wrong)

```typescript
// Using donations (in XLM)
const totalRaised = ngoDonations.reduce((sum, d) => sum + (d.Amount || 0), 0)
// Result: 52.4965035 (XLM) ❌
```

### After (Correct)

```typescript
// Using CollectedAmount from posts (in INR)
const totalRaised = ngoPosts.reduce((sum, post) => sum + (post.CollectedAmount || 0), 0)
// Result: 1500 (INR) ✅
```

---

## Complete NGO Dashboard Flow

### 1. Authentication Check

```typescript
useEffect(() => {
  if (!isAuthenticated) {
    router.push("/ngo/login")
  }
}, [isAuthenticated, router])
```

### 2. Load NGO's Posts

```typescript
const postsResponse = await apiService.getPosts()
const ngoPosts = postsResponse.data.filter(
  (post: Post) => post.NgoRef === ngoProfile?.id
)
```

### 3. Calculate Stats

```typescript
const totalRaised = ngoPosts.reduce(
  (sum, post) => sum + (post.CollectedAmount || 0), 
  0
)

const stats = {
  totalDonations: totalRaised,        // INR
  fundsUsed: Math.floor(totalRaised * 0.68),  // INR
  remainingBalance: totalRaised - fundsUsed,  // INR
  verifiedProjects: ngoPosts.length,
}
```

### 4. Display

```tsx
<div>
  <p>Total Donations: ₹{stats.totalDonations.toLocaleString('en-IN')}</p>
  <p>Funds Used: ₹{stats.fundsUsed.toLocaleString('en-IN')}</p>
  <p>Remaining: ₹{stats.remainingBalance.toLocaleString('en-IN')}</p>
  <p>Projects: {stats.verifiedProjects}</p>
</div>
```

---

## Files Modified

### 1. `/frontend/lib/redux/slices/ngo-auth-slice.ts`

**Changes:**
- Line 10: `createdAt: string` (was `Date`)
- Line 54: `.toISOString()` (was `new Date(...)`)
- Line 108: `.toISOString()` (was `new Date(...)`)

**Why:** Fix Redux serialization error

### 2. `/frontend/app/ngo-dashboard/page.tsx`

**Changes:**
- Lines 81-91: Use `post.CollectedAmount` instead of `donation.Amount`
- Calculate stats from posts (INR) not donations (XLM)

**Why:** Show correct amounts in INR

---

## Testing

### Test 1: NGO Signup/Login (No Serialization Error)

1. Signup or login as NGO
2. Check browser console
3. ✅ Should NOT see serialization warning
4. ✅ `ngoProfile.createdAt` should be a string

### Test 2: NGO Dashboard Shows Only Own Posts

1. Login as NGO A (id: "507f...")
2. Go to NGO Dashboard
3. ✅ Should only see posts where `NgoRef === "507f..."`
4. ✅ Should NOT see posts from other NGOs

### Test 3: Stats in INR

1. Login as NGO
2. Check dashboard stats
3. ✅ Total Donations should be in thousands (INR)
4. ✅ Should NOT be in decimals (XLM)

**Example:**
```
Total Donations: ₹15,000  ✅ (not 524.48)
Funds Used: ₹10,200       ✅ (not 356.65)
Remaining: ₹4,800         ✅ (not 167.83)
```

---

## Redux Serialization Rules

### What's Serializable ✅

- Strings
- Numbers
- Booleans
- Arrays
- Plain objects
- null

### What's NOT Serializable ❌

- Date objects
- Functions
- Promises
- RegExp
- Map/Set
- Class instances

### How to Store Dates

```typescript
// ❌ Wrong
createdAt: new Date()

// ✅ Correct
createdAt: new Date().toISOString()  // "2025-10-28T07:30:00.000Z"

// To display
new Date(createdAt).toLocaleDateString()
```

---

## NGO Data Relationships

### Database Schema

```
NGO Collection:
{
  _id: "507f1f77bcf86cd799439011",
  NgoName: "Help Foundation",
  Email: "ngo@example.com",
  ...
}

Post Collection:
{
  _id: "68fda9e98ceedc5ae1f2988d",
  Title: "Help Children",
  NgoRef: "507f1f77bcf86cd799439011",  // ← References NGO._id
  CollectedAmount: 1500,
  ...
}

Donation Collection:
{
  _id: "507f1f77bcf86cd799439012",
  postIDs: "68fda9e98ceedc5ae1f2988d",  // ← References Post._id
  Amount: 52.4965035,  // XLM
  ...
}
```

### Filtering Logic

```typescript
// Get NGO's posts
const ngoPosts = allPosts.filter(post => post.NgoRef === ngoId)

// Get donations for NGO's posts
const ngoPostIds = ngoPosts.map(p => p._id)
const ngoDonations = allDonations.filter(d => ngoPostIds.includes(d.postIDs))
```

---

## Summary

### What Was Fixed

1. ✅ **Redux Serialization**
   - Changed `createdAt` from Date to string
   - No more serialization warnings

2. ✅ **NGO Dashboard Stats**
   - Use CollectedAmount (INR) from posts
   - Not donation.Amount (XLM)
   - Correct amounts displayed

3. ✅ **NGO Post Filtering**
   - Already working correctly
   - Shows only posts where NgoRef matches NGO ID

### Result

- ✅ No Redux warnings
- ✅ NGO sees only their posts
- ✅ Stats show correct INR amounts
- ✅ Dashboard works properly

**All issues fixed!** 🎉
