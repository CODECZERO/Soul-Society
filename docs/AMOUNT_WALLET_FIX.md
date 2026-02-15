# Amount Format & Wallet Address Fix

## Issues Fixed

### Issue 1: Amount Format Error
**Error Message:**
```
amount argument must be of type String, represent a positive number 
and have at most 7 digits after the decimal
```

**Root Cause:** Stellar SDK requires amount as a string with maximum 7 decimal places.

**Solution:** Added validation and formatting in `submitDonationTransaction()`

### Issue 2: Wallet Address Not Used
**Problem:** Donation was not using the NGO's wallet address from post data.

**Solution:** Extract `WalletAddr` from post data and pass to transaction.

---

## Changes Made

### File 1: `/frontend/lib/stellar-utils.ts`

#### Added Amount Validation & Formatting

```typescript
// Validate and format amount - Stellar requires string with max 7 decimals
const amountNumber = parseFloat(amount)
if (isNaN(amountNumber) || amountNumber <= 0) {
  throw new Error("Invalid amount. Please enter a positive number.")
}

// Format to max 7 decimal places as required by Stellar
const formattedAmount = amountNumber.toFixed(7)
console.log("Formatted amount:", formattedAmount)
```

**Examples:**
- Input: `"100"` → Output: `"100.0000000"` ✅
- Input: `"0.123456789"` → Output: `"0.1234568"` ✅ (rounded to 7 decimals)
- Input: `"50.5"` → Output: `"50.5000000"` ✅

#### Added Wallet Address Validation

```typescript
// Validate receiver address
if (!receiverPublicKey || receiverPublicKey.length !== 56 || !receiverPublicKey.startsWith('G')) {
  throw new Error("Invalid receiver wallet address from post data")
}
```

**Stellar Address Format:**
- Must be 56 characters long
- Must start with 'G'
- Example: `GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJUCHUZI7VCZE7FDCVXWH6HUP`

---

### File 2: `/frontend/lib/redux/slices/donation-slice.ts`

#### Added receiverPublicKey Parameter

```typescript
export const processDonation = createAsyncThunk(
  "donation/processDonation",
  async ({
    amount,
    currency,
    taskId,
    publicKey,
    receiverPublicKey,  // NEW: NGO's wallet address
    signTransaction,
  }: {
    amount: number
    currency: 'XLM' | 'INR'
    taskId: string
    publicKey: string
    receiverPublicKey: string  // NEW
    signTransaction: (tx: string) => Promise<string>
  })
)
```

#### Pass to submitDonationTransaction

```typescript
const result = await submitDonationTransaction(
  publicKey,
  xlmAmount.toString(),
  taskId,
  receiverPublicKey,  // Pass NGO's wallet address
  signTransaction
)
```

---

### File 3: `/frontend/components/donate-modal.tsx`

#### Extract Wallet Address from Task Data

```typescript
// Get receiver wallet address from task data
const receiverWalletAddress = task.WalletAddr || task.walletAddr || task.walletAddress

if (!receiverWalletAddress) {
  console.error("Task data:", task)
  alert("Error: NGO wallet address not found in task data")
  return
}

console.log("Sending donation to NGO wallet:", receiverWalletAddress)
```

#### Pass to processDonation

```typescript
dispatch(processDonation({
  amount: Number.parseFloat(amount),
  currency,
  taskId: typeof task.id === 'string' ? task.id : String(task.id),
  publicKey,
  receiverPublicKey: receiverWalletAddress, // Pass NGO's wallet address
  signTransaction: signTransactionFunction,
}))
```

---

## Data Flow

### Complete Donation Flow

```
1. User browses tasks
   ↓
2. Backend returns posts with WalletAddr field
   {
     _id: "123",
     Title: "Help Children",
     WalletAddr: "GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJUCHUZI7VCZE7FDCVXWH6HUP",
     ...
   }
   ↓
3. User clicks "Donate" on a task
   ↓
4. DonateModal opens with task data
   ↓
5. User enters amount: "100" INR
   ↓
6. Convert to XLM: 100 / 28.60 = 3.4965035 XLM
   ↓
7. Extract wallet address from task.WalletAddr
   ↓
8. Format amount: "3.4965035" → "3.4965035" (7 decimals) ✅
   ↓
9. Create Stellar transaction:
   - From: User's wallet
   - To: task.WalletAddr (NGO's wallet)
   - Amount: "3.4965035" XLM
   ↓
10. User approves in Freighter
   ↓
11. Submit to Stellar network
   ↓
12. Get transaction hash
   ↓
13. Send to backend for verification
   ↓
14. Success! ✅
```

---

## Backend Post Structure

### Post Model (from backend)

```typescript
{
  _id: string;
  Title: string;
  Type: string;
  Description: string;
  Location: string;
  ImgCid: string;
  NeedAmount: string;
  WalletAddr: string;  // ← NGO's Stellar wallet address
  NgoRef: string;
  createdAt: string;
  updatedAt: string;
}
```

### Example Post Data

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "Title": "Provide Education to Underprivileged Children",
  "Type": "Education",
  "Description": "Help us provide quality education...",
  "Location": "Mumbai, India",
  "ImgCid": "QmXyz123...",
  "NeedAmount": "50000",
  "WalletAddr": "GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJUCHUZI7VCZE7FDCVXWH6HUP",
  "NgoRef": "507f191e810c19729de860ea",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Validation Rules

### Amount Validation

✅ **Valid:**
- `"100"` → `"100.0000000"`
- `"0.5"` → `"0.5000000"`
- `"1234.567"` → `"1234.5670000"`

❌ **Invalid:**
- `""` → Error: "Invalid amount"
- `"0"` → Error: "Invalid amount"
- `"-10"` → Error: "Invalid amount"
- `"abc"` → Error: "Invalid amount"

### Wallet Address Validation

✅ **Valid:**
- Length: 56 characters
- Starts with: 'G'
- Example: `GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJUCHUZI7VCZE7FDCVXWH6HUP`

❌ **Invalid:**
- Too short: `GABC123`
- Doesn't start with G: `SABC...`
- Empty: `""`
- Undefined: `undefined`

---

## Error Handling

### Amount Errors

```typescript
try {
  const amountNumber = parseFloat(amount)
  if (isNaN(amountNumber) || amountNumber <= 0) {
    throw new Error("Invalid amount. Please enter a positive number.")
  }
} catch (error) {
  // Show error to user
  alert("Invalid amount. Please enter a positive number.")
}
```

### Wallet Address Errors

```typescript
const receiverWalletAddress = task.WalletAddr || task.walletAddr || task.walletAddress

if (!receiverWalletAddress) {
  console.error("Task data:", task)
  alert("Error: NGO wallet address not found in task data")
  return
}

// Validate format
if (receiverWalletAddress.length !== 56 || !receiverWalletAddress.startsWith('G')) {
  throw new Error("Invalid receiver wallet address from post data")
}
```

---

## Testing Checklist

### Test Amount Formatting
- [ ] Donate 100 INR → Should format to 7 decimals ✅
- [ ] Donate 0.5 XLM → Should format to 7 decimals ✅
- [ ] Try to donate 0 → Should show error ❌
- [ ] Try to donate negative → Should show error ❌
- [ ] Try to donate "abc" → Should show error ❌

### Test Wallet Address
- [ ] Check post data has WalletAddr field ✅
- [ ] Verify wallet address is 56 characters ✅
- [ ] Verify wallet address starts with 'G' ✅
- [ ] Donation goes to correct NGO wallet ✅
- [ ] Check Stellar explorer shows correct receiver ✅

### Test Complete Flow
1. [ ] Get posts from backend
2. [ ] Verify each post has WalletAddr
3. [ ] Click donate on a task
4. [ ] Enter amount
5. [ ] Check console logs show correct wallet address
6. [ ] Approve in Freighter
7. [ ] Verify transaction on Stellar explorer
8. [ ] Check receiver is the NGO's wallet from post data ✅

---

## Console Logs for Debugging

When donation is triggered, you should see:

```
Starting donation transaction: {
  publicKey: "GABC...",
  amount: "3.4965035",
  taskId: "507f1f77bcf86cd799439011",
  receiverPublicKey: "GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJUCHUZI7VCZE7FDCVXWH6HUP"
}
Formatted amount: 3.4965035
Loading account from Stellar...
Creating payment transaction...
Transaction XDR created, requesting signature...
```

---

## Summary

✅ **Amount formatted correctly** - Max 7 decimals as required by Stellar
✅ **Wallet address from post data** - Uses NGO's WalletAddr field
✅ **Validation added** - Both amount and wallet address validated
✅ **Error handling** - Clear error messages for users
✅ **Console logging** - Easy to debug transaction flow

The donation flow now correctly:
1. Formats amount to 7 decimal places
2. Uses NGO's wallet address from post data
3. Validates all inputs before creating transaction
4. Provides clear error messages

No more "amount argument must be of type String" errors!
