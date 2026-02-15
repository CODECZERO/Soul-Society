# XLM to INR Conversion Implementation

## Overview

Donations are stored in **XLM** (Stellar Lumens) in the database, but displayed in **INR** (Indian Rupees) on the frontend using live exchange rates.

---

## Data Storage

### Database (MongoDB)

**Donation Model:**
```typescript
{
  currentTxn: "abc123...",
  postIDs: ObjectId("68fda9e98ceedc5ae1f2988d"),
  Amount: 3.4965035,  // ← Stored in XLM
  createdAt: "2025-10-28T07:00:00.000Z"
}
```

**Why XLM?**
- Matches actual blockchain transaction
- No conversion errors
- Accurate to 7 decimal places
- Direct from Stellar network

---

## Conversion System

### Exchange Rate Utility

**File:** `/server/src/util/exchangeRate.util.ts`

```typescript
export async function getXLMtoINRRate(): Promise<number> {
  // Fetch from CoinGecko API
  const response = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=inr"
  );
  
  return response.data.stellar.inr; // e.g., 28.60
}
```

**Features:**
- ✅ **Live rates** from CoinGecko API
- ✅ **Caching** (1 minute) to reduce API calls
- ✅ **Fallback** to 28.60 if API fails
- ✅ **Error handling** with cached rate

---

## Backend Implementation

### 1. Posts with Collected Amount

**File:** `/server/src/controler/post.controler.ts`

```typescript
const getAllPost = AsyncHandler(async (req: Request, res: Response) => {
  const postData = await getPosts();
  
  // Get live XLM to INR exchange rate
  const XLM_TO_INR_RATE = await getXLMtoINRRate();
  
  // Calculate collected amount for each post
  const postsWithCollected = await Promise.all(
    postData.map(async (post) => {
      const donations = await getDonationRelatedToPost(post._id);
      
      // Sum XLM amounts
      const collectedXLM = donations.reduce((sum, donation) => {
        return sum + (donation.Amount || 0);
      }, 0);
      
      // Convert to INR
      const collectedINR = collectedXLM * XLM_TO_INR_RATE;
      
      return {
        ...post.toObject(),
        CollectedAmount: Math.round(collectedINR) // INR (rounded)
      };
    })
  );
  
  return res.status(200).json(new ApiResponse(200, postsWithCollected, "found data"));
});
```

**Process:**
1. Get all posts from database
2. Fetch live XLM/INR rate
3. For each post:
   - Get donations (amounts in XLM)
   - Sum XLM amounts
   - Convert to INR
   - Round to nearest rupee
4. Return posts with `CollectedAmount` in INR

---

### 2. Stats Calculation

**File:** `/server/src/controler/stats.controler.ts`

```typescript
const getStats = AsyncHandler(async (req: Request, res: Response) => {
  const donations = await getAllDonation();
  
  // Get live XLM to INR exchange rate
  const XLM_TO_INR_RATE = await getXLMtoINRRate();
  
  // Calculate total raised (donations are in XLM, convert to INR)
  const totalRaisedXLM = donations.reduce((sum, donation) => {
    return sum + (donation.Amount || 0);
  }, 0);
  const totalRaisedINR = Math.round(totalRaisedXLM * XLM_TO_INR_RATE);
  
  const stats = {
    totalRaised: totalRaisedINR, // INR (converted from XLM)
    activeDonors: uniqueDonors,
    verifiedNGOs: verifiedNgos,
  };
  
  return res.status(200).json(new ApiResponse(200, stats, "stats retrieved successfully"));
});
```

---

## Data Flow Example

### User Donates 100 INR

```
1. Frontend converts INR to XLM
   100 INR ÷ 28.60 = 3.4965035 XLM
   ↓
2. Transaction on Stellar
   - From: User wallet
   - To: NGO wallet
   - Amount: 3.4965035 XLM
   ↓
3. Backend saves donation
   {
     Amount: 3.4965035,  // XLM (from blockchain)
     postIDs: "68fda9e98ceedc5ae1f2988d"
   }
   ↓
4. Backend calculates CollectedAmount
   - Get all donations for post
   - Sum: 3.4965035 + 1.7482517 + 2.0979021 = 7.3426573 XLM
   - Convert: 7.3426573 × 28.60 = 210 INR
   ↓
5. Frontend displays
   - Goal: ₹10,000
   - Collected: ₹210
   - Progress: 2.1%
```

---

## API Response Format

### Posts Endpoint

**Request:**
```http
GET /api/posts
```

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "68fda9e98ceedc5ae1f2988d",
      "Title": "Help Children Education",
      "NeedAmount": "10000",
      "CollectedAmount": 210,  // ← Converted to INR
      ...
    }
  ],
  "message": "found data",
  "success": true
}
```

### Stats Endpoint

**Request:**
```http
GET /api/stats
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "totalRaised": 15000,  // ← Converted to INR
    "activeDonors": 25,
    "verifiedNGOs": 8
  },
  "message": "stats retrieved successfully",
  "success": true
}
```

---

## Exchange Rate Caching

### How It Works

```typescript
let cachedRate: number | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

export async function getXLMtoINRRate(): Promise<number> {
  const now = Date.now();
  
  // Return cached rate if still valid
  if (cachedRate && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedRate;
  }
  
  // Fetch new rate from API
  const response = await axios.get(...);
  cachedRate = response.data.stellar.inr;
  lastFetchTime = now;
  
  return cachedRate;
}
```

**Benefits:**
- ✅ Reduces API calls (max 1 per minute)
- ✅ Faster response times
- ✅ Avoids rate limiting
- ✅ Fallback if API is down

---

## Error Handling

### Fallback Strategy

```typescript
try {
  // Try to fetch from CoinGecko
  const response = await axios.get(...);
  return response.data.stellar.inr;
} catch (error) {
  // If API fails, use cached rate
  if (cachedRate) {
    return cachedRate;
  }
  
  // If no cache, use fallback rate
  return 28.60; // Reasonable fallback
}
```

**Fallback Scenarios:**
1. **API timeout** → Use cached rate
2. **Network error** → Use cached rate
3. **Invalid response** → Use fallback rate (28.60)
4. **No cache available** → Use fallback rate (28.60)

---

## Conversion Accuracy

### XLM Precision

Stellar supports **7 decimal places**:
```
3.4965035 XLM (valid)
3.49650351 XLM (invalid - too many decimals)
```

### INR Display

Rounded to **nearest rupee**:
```typescript
const collectedINR = collectedXLM * XLM_TO_INR_RATE;
return Math.round(collectedINR); // 210.00 → 210
```

**Example:**
```
XLM: 7.3426573
Rate: 28.60
Calculation: 7.3426573 × 28.60 = 210.00
Display: ₹210
```

---

## Frontend Display

### Frontend Already Handles Display

The frontend receives INR amounts and displays them directly:

```typescript
// Task card
<p>₹{task.raised.toLocaleString('en-IN')}</p>
<p>₹{task.goal.toLocaleString('en-IN')}</p>

// Stats
<p>₹{stats.totalRaised.toLocaleString('en-IN')}</p>
```

**No conversion needed on frontend** - backend does it all!

---

## Testing

### Test Exchange Rate Utility

```bash
# In backend directory
node -e "
const { getXLMtoINRRate } = require('./dist/util/exchangeRate.util.js');
getXLMtoINRRate().then(rate => console.log('Rate:', rate));
"
```

**Expected Output:**
```
✅ XLM/INR rate updated: ₹28.60
Rate: 28.60
```

### Test Posts Endpoint

```bash
curl http://localhost:8000/api/posts
```

**Check:**
- `CollectedAmount` field present
- Value in INR (not XLM)
- Reasonable amount (not 0.001)

### Test Stats Endpoint

```bash
curl http://localhost:8000/api/stats
```

**Check:**
- `totalRaised` in INR
- Reasonable value (thousands, not decimals)

---

## Comparison: Before vs After

### Before (Storing INR)

**Problems:**
- ❌ Mismatch with blockchain (XLM)
- ❌ Conversion errors
- ❌ Rounding issues
- ❌ Inconsistent with Stellar

### After (Storing XLM, Display INR)

**Benefits:**
- ✅ Matches blockchain exactly
- ✅ No conversion on save
- ✅ Accurate to 7 decimals
- ✅ Live exchange rates
- ✅ Flexible display

---

## Files Modified

### New Files

1. **`/server/src/util/exchangeRate.util.ts`** (NEW)
   - Exchange rate fetching
   - Caching logic
   - Conversion functions

### Modified Files

1. **`/server/src/controler/post.controler.ts`**
   - Import exchange rate utility
   - Convert XLM to INR for CollectedAmount

2. **`/server/src/controler/stats.controler.ts`**
   - Import exchange rate utility
   - Convert XLM to INR for totalRaised

---

## Summary

### Data Storage
- **Database:** XLM (matches blockchain)
- **API Response:** INR (converted with live rates)
- **Frontend Display:** INR (no conversion needed)

### Conversion Flow
```
Blockchain (XLM) → Database (XLM) → Backend Conversion → API (INR) → Frontend (INR)
```

### Key Points
- ✅ **Donations stored in XLM** (blockchain native)
- ✅ **Backend converts to INR** (live rates)
- ✅ **Frontend displays INR** (user-friendly)
- ✅ **Caching reduces API calls** (performance)
- ✅ **Fallback for reliability** (error handling)

**All amounts now correctly converted from XLM to INR!** 🎉
