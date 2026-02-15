# NGO Dashboard - Complete Guide

## Overview

The NGO Dashboard provides two main functionalities:
1. **Create Post/Task** - NGOs can create fundraising tasks
2. **Send Payment** - NGOs can send payments to vendors/beneficiaries from task funds

---

## 1. Create Post/Task

### Purpose
NGOs create fundraising tasks/campaigns to receive donations from users.

### Component
**File:** `/frontend/components/create-task-modal.tsx`

### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Title | Text | Yes | Task title |
| Description | Textarea | Yes | Detailed description |
| Location | Text | Yes | Task location |
| Goal Amount | Number | Yes | Target amount in ₹ |
| Category | Select | Yes | Education/Health/Relief/Environment |
| Featured Image | File | No | Task image (uploaded to IPFS) |

### Backend API

**Endpoint:** `POST /api/posts`

**Request Body:**
```typescript
{
  Title: string;
  Type: string;          // Category
  Description: string;
  Location: string;
  ImgCid: string;        // IPFS CID or placeholder
  NeedAmount: string;    // Goal amount
  WalletAddr: string;    // NGO's wallet address
  // NgoRef is set by backend from JWT token
}
```

**Authentication:** Required (NGO must be logged in)

### Flow

```
1. NGO clicks "Create New Task"
   ↓
2. Fill in task details
   ↓
3. (Optional) Upload featured image
   → Image uploaded to IPFS
   → Get IPFS CID
   ↓
4. Submit form
   → POST /api/posts
   → Backend validates NGO authentication
   → Backend sets NgoRef from JWT token
   → Backend saves post to database
   ↓
5. Success! Task is now live
   → Users can see and donate to this task
```

### Wallet Address

The `WalletAddr` field is automatically set from the NGO's profile:

```typescript
const ngoWalletAddr = ngoProfile?.publicKey || 
                      ngoProfile?.walletAddress || 
                      "DEFAULT_ADDRESS"
```

This wallet address will receive all donations for this task.

---

## 2. Send Payment

### Purpose
NGOs send payments from task funds to vendors, beneficiaries, or other parties.

### Component
**File:** `/frontend/components/ngo-send-payment-modal.tsx`

### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Receiver Wallet | Text | Yes | Stellar wallet address (G...) |
| Amount | Number | Yes | Amount in XLM |
| Description | Textarea | Yes | Purpose of payment |
| Receipt/Proof | File | Yes | Receipt or proof document |

### Backend API

**Endpoint:** `POST /api/payment/wallet-pay`

**Request Body:**
```typescript
{
  PublicKey: string;  // Receiver's wallet address
  PostId: string;     // Task/Post ID
  Amount: number;     // Amount in XLM
  Cid: string;        // IPFS CID of receipt
}
```

**Authentication:** Required (NGO must be logged in)

### Backend Process

1. **Get NGO's Private Key**
   ```typescript
   const PrivateKey = await getPrivateKey(PostId)
   ```
   - Backend retrieves the NGO's private key associated with the post
   - This is the key that will sign the transaction

2. **Get Previous Transaction**
   ```typescript
   const prevTxn = await getPrevTxn(PostId)
   ```
   - Gets the previous transaction hash for this post
   - Used for transaction chaining

3. **Send Payment on Stellar**
   ```typescript
   const Pay = await sendPaymentToWallet({
     senderKey: PrivateKey,
     receiverKey: PublicKey,
     amount: Amount,
     meta: {
       cid: Cid,
       prevTxn: prevTxn,
     },
   })
   ```
   - Backend signs and submits transaction to Stellar network
   - Uses NGO's private key (stored securely in backend)

4. **Save to Smart Contract**
   ```typescript
   const UploadData = await saveContractWithWallet({
     privateKey: PrivateKey,
     reciverKey: PublicKey,
     amount: Amount,
     cid: Cid,
     prevTxn: prevTxn,
     metadata: "optional metadata here",
   })
   ```

5. **Create Expense Record**
   ```typescript
   const data = await createTransaction(UploadData, PostId)
   ```
   - Saves expense to database
   - Links to the post/task

### Flow

```
1. NGO selects a task
   ↓
2. Click "Send Payment"
   ↓
3. Fill in payment details:
   - Receiver's Stellar wallet address
   - Amount in XLM
   - Description of payment
   - Upload receipt/proof
   ↓
4. Upload receipt to IPFS
   → Get IPFS CID
   ↓
5. Submit payment request
   POST /api/payment/wallet-pay
   {
     PublicKey: "GABC...",
     PostId: "68fda9e98ceedc5ae1f2988d",
     Amount: 50,
     Cid: "QmXyz123..."
   }
   ↓
6. Backend processes:
   - Gets NGO's private key for this post
   - Gets previous transaction hash
   - Signs transaction with NGO's key
   - Submits to Stellar network
   - Saves to smart contract
   - Creates expense record
   ↓
7. Success! Payment sent
   → Funds transferred on Stellar
   → Expense recorded in database
   → Receipt stored on IPFS
```

---

## Key Differences: Create Post vs Send Payment

| Aspect | Create Post | Send Payment |
|--------|-------------|--------------|
| **Purpose** | Receive donations | Send funds out |
| **Wallet** | NGO's receiving wallet | Receiver's wallet |
| **Signing** | No transaction | Backend signs with NGO key |
| **IPFS** | Optional (task image) | Required (receipt) |
| **Database** | Posts table | Expenses table |
| **Blockchain** | No transaction | Stellar transaction |

---

## NGO Dashboard UI

### Location
**File:** `/frontend/app/ngo-dashboard/page.tsx`

### Features

1. **Statistics Cards**
   - Total Donations
   - Funds Used
   - Remaining Balance
   - Verified Projects

2. **Create Task Button**
   - Opens CreateTaskModal
   - Allows NGO to create new fundraising tasks

3. **Active Tasks List**
   - Shows all tasks created by this NGO
   - Each task has two buttons:
     - **Send Payment** - Opens NGOSendPaymentModal
     - **Upload Proof** - Opens UploadProofModal

### Task Actions

```typescript
<Button onClick={() => {
  setSelectedTask(task)
  setIsSendPaymentOpen(true)
}}>
  Send Payment
</Button>

<Button onClick={() => {
  setSelectedTask(task)
  setIsUploadProofOpen(true)
}}>
  Upload Proof
</Button>
```

---

## Security

### NGO Authentication

All NGO operations require authentication:

```typescript
// Backend checks JWT token
if (!req.NgoId) {
  throw new ApiError(401, "NGO authentication required");
}
```

### Private Key Storage

- NGO's private key is stored securely in the backend database
- Never exposed to frontend
- Backend signs transactions on behalf of NGO
- Retrieved only when needed for transactions

### Payment Authorization

- Only the NGO that created a post can send payments from it
- Backend validates NGO ownership before processing payments

---

## Data Flow Diagram

### Create Post Flow

```
Frontend                Backend                 Database
   |                       |                       |
   |-- POST /api/posts --->|                       |
   |   {Title, Type, ...}  |                       |
   |                       |-- Verify JWT -------->|
   |                       |<-- NGO ID ------------|
   |                       |                       |
   |                       |-- Save Post --------->|
   |                       |   {NgoRef: NGO ID}    |
   |                       |<-- Post Created ------|
   |<-- 200 OK ------------|                       |
   |   {post data}         |                       |
```

### Send Payment Flow

```
Frontend          Backend          Stellar Network    IPFS        Database
   |                 |                    |             |             |
   |-- Upload ------>|                    |             |             |
   |   Receipt       |                    |             |             |
   |                 |-- Upload --------->|             |             |
   |                 |<-- CID ------------|             |             |
   |                 |                    |             |             |
   |-- POST -------->|                    |             |             |
   |   /wallet-pay   |                    |             |             |
   |                 |-- Get Private ---->|             |             |
   |                 |    Key             |             |             |
   |                 |<-- Private Key ----|             |             |
   |                 |                    |             |             |
   |                 |-- Sign & Submit -->|             |             |
   |                 |    Transaction     |             |             |
   |                 |<-- TX Hash --------|             |             |
   |                 |                    |             |             |
   |                 |-- Save Contract -->|             |             |
   |                 |<-- Success --------|             |             |
   |                 |                    |             |             |
   |                 |-- Save Expense ------------------->|             |
   |                 |<-- Saved --------------------------|             |
   |<-- 200 OK ------|                    |             |             |
   |   {tx data}     |                    |             |             |
```

---

## Testing

### Test Create Post

1. Login as NGO
2. Go to NGO Dashboard
3. Click "Create New Task"
4. Fill in all fields
5. (Optional) Upload image
6. Click "Create Task"
7. ✅ Task should appear in Active Tasks list
8. ✅ Task should be visible to users on explore page

### Test Send Payment

1. Login as NGO
2. Go to NGO Dashboard
3. Select a task with funds
4. Click "Send Payment"
5. Enter receiver wallet address (Stellar address starting with 'G')
6. Enter amount in XLM
7. Enter description
8. Upload receipt/proof
9. Click "Send Payment"
10. ✅ Receipt uploads to IPFS
11. ✅ Payment processes on Stellar
12. ✅ Expense recorded in database
13. ✅ Success message shown

---

## Files Created/Modified

### New Files

1. `/frontend/components/ngo-send-payment-modal.tsx`
   - Complete payment sending interface
   - IPFS upload integration
   - Backend API integration

### Modified Files

1. `/frontend/components/create-task-modal.tsx`
   - Updated to use NGO's wallet address from profile
   - Line 84: Dynamic wallet address

2. `/frontend/app/ngo-dashboard/page.tsx`
   - Added NGOSendPaymentModal import
   - Added Send Payment button to tasks
   - Added modal state management

---

## Summary

✅ **Create Post** - NGOs can create fundraising tasks
✅ **Send Payment** - NGOs can send payments from task funds
✅ **IPFS Integration** - Receipts stored on IPFS
✅ **Stellar Integration** - Payments on Stellar network
✅ **Backend Signing** - Secure private key management
✅ **Task-based Payments** - NGOs can only pay from their own tasks
✅ **Complete UI** - User-friendly dashboard interface

The NGO dashboard is now fully functional for creating posts and sending payments! 🎉
