# Stellar Memo Length Fix

## Error
```
Expects string, array or buffer, max 28 bytes
```

## Root Cause

Stellar transactions have a **28 byte limit** for memo text. The memo was too long:

```javascript
.addMemo(StellarSdk.Memo.text(`Donation to task ${taskId}`))
// Example: "Donation to task 68fda9e98ceedc5ae1f2988d"
// Length: 46 characters = 46 bytes ❌ EXCEEDS 28 byte limit
```

## The Fix

**File:** `/frontend/lib/stellar-utils.ts` (Line 162)

**Before:**
```javascript
.addMemo(StellarSdk.Memo.text(`Donation to task ${taskId}`))
// Too long! ❌
```

**After:**
```javascript
.addMemo(StellarSdk.Memo.text(`Donation`))
// Short and simple ✅ (8 bytes)
```

## Stellar Memo Limits

### Text Memo
- **Maximum:** 28 bytes
- **Type:** UTF-8 string
- **Use case:** Short descriptions

### Valid Examples
```javascript
// ✅ Valid (under 28 bytes)
.addMemo(StellarSdk.Memo.text(`Donation`))           // 8 bytes
.addMemo(StellarSdk.Memo.text(`Gift`))               // 4 bytes
.addMemo(StellarSdk.Memo.text(`Soul-Society Donation`)) // 18 bytes
.addMemo(StellarSdk.Memo.text(`Help`))               // 4 bytes
```

### Invalid Examples
```javascript
// ❌ Invalid (exceeds 28 bytes)
.addMemo(StellarSdk.Memo.text(`Donation to task 68fda9e98ceedc5ae1f2988d`))  // 46 bytes
.addMemo(StellarSdk.Memo.text(`This is a very long donation message`))       // 38 bytes
```

## Alternative: Hash Memo

If you need to include the task ID, use a hash memo instead:

```javascript
// Option 1: Hash Memo (32 bytes)
const taskIdHash = Buffer.from(taskId.slice(0, 32).padEnd(32, '0'))
.addMemo(StellarSdk.Memo.hash(taskIdHash))

// Option 2: ID Memo (8 bytes unsigned integer)
const taskIdNumber = parseInt(taskId.slice(-8), 16)
.addMemo(StellarSdk.Memo.id(taskIdNumber.toString()))
```

## Why We Use Simple "Donation" Memo

1. **Simplicity:** Easy to understand
2. **Reliability:** Never exceeds limit
3. **Purpose:** The transaction itself shows it's a donation (payment to NGO wallet)
4. **Tracking:** Backend tracks via transaction hash, not memo

## Transaction Tracking

The task ID is tracked in the backend database, not in the Stellar memo:

```javascript
// Frontend sends to backend
await apiService.verifyDonation({
  TransactionId: transactionHash,  // Stellar transaction hash
  postID: taskId,                  // Task ID stored in DB
  Amount: amount                   // Amount stored in DB
})

// Backend saves to database
{
  currentTxn: transactionHash,
  postIDs: taskId,        // ← Task ID stored here
  Amount: amount
}
```

## Complete Transaction Structure

```javascript
const transaction = new StellarSdk.TransactionBuilder(account, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: StellarSdk.Networks.TESTNET,
})
  .addOperation(
    StellarSdk.Operation.payment({
      destination: ngoWalletAddress,
      asset: StellarSdk.Asset.native(),
      amount: "10.0000000"
    })
  )
  .addMemo(StellarSdk.Memo.text(`Donation`)) // ✅ Simple and short
  .setTimeout(180)
  .build()
```

## Stellar Memo Types

| Type | Max Size | Use Case |
|------|----------|----------|
| `MEMO_TEXT` | 28 bytes | Short text messages |
| `MEMO_ID` | 64-bit unsigned int | Numeric IDs |
| `MEMO_HASH` | 32 bytes | Hash values |
| `MEMO_RETURN` | 32 bytes | Return hash |

## Testing

### Before Fix
```javascript
// Error thrown:
"Expects string, array or buffer, max 28 bytes"
```

### After Fix
```javascript
// Transaction created successfully ✅
// Memo: "Donation"
// Length: 8 bytes (well under 28 byte limit)
```

## Summary

✅ **Fixed:** Shortened memo from `"Donation to task ${taskId}"` to `"Donation"`
✅ **Reason:** Stellar memo text has 28 byte maximum
✅ **Location:** `/frontend/lib/stellar-utils.ts` line 162
✅ **Result:** Transactions now create successfully

The task ID is still tracked properly in the backend database, so no functionality is lost!
