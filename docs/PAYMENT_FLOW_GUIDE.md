# Payment Flow Guide

## Overview

There are TWO different payment flows in the Soul-Society platform:

1. **User Donation Flow** - When users donate to NGO tasks
2. **NGO Disbursement Flow** - When NGOs send payments to vendors/beneficiaries

---

## 1. User Donation Flow (Users → NGOs)

### Purpose
Users donate XLM to NGO tasks/campaigns.

### Backend API
**Endpoint**: `POST /api/payment/verify-donation`

**Request Body**:
```typescript
{
  TransactionId: string;  // Stellar transaction hash
  postID: string;         // Task/Post ID
  Amount: number;         // Amount in XLM
}
```

**Backend Process**:
1. Receives donation data
2. Verifies transaction on Stellar network using `verfiyTransaction()`
3. Saves donation to database using `createDonation()`
4. Returns saved donation data

### Frontend Implementation

**File**: `/frontend/lib/stellar-utils.ts`

**Function**: `submitDonationTransaction()`

```typescript
export async function submitDonationTransaction(
  publicKey: string,
  amount: string,
  taskId: string,
  signTransaction: (tx: string) => Promise<string>,
)
```

**Flow**:
```
1. User clicks "Donate" on a task
2. Frontend creates Stellar transaction
3. User signs transaction with Freighter wallet
4. Get transaction hash from signed transaction
5. Call verifyDonation API with:
   - TransactionId: signed transaction hash
   - postID: task ID
   - Amount: donation amount
6. Backend verifies and saves donation
7. Show success message to user
```

**Usage Example**:
```typescript
import { submitDonationTransaction } from '@/lib/stellar-utils'
import { useWallet } from '@/hooks/use-wallet'

const { publicKey, signTx } = useWallet()

// When user clicks donate
const result = await submitDonationTransaction(
  publicKey,
  "100",      // amount in XLM
  taskId,     // post/task ID
  signTx      // sign function from wallet
)

console.log("Donation successful:", result.hash)
```

---

## 2. NGO Disbursement Flow (NGOs → Vendors/Beneficiaries)

### Purpose
NGOs send payments from their wallet to vendors, beneficiaries, or other parties.

### Backend API
**Endpoint**: `POST /api/payment/wallet-pay`

**Request Body**:
```typescript
{
  PublicKey: string;  // Receiver's public key
  PostId: string;     // Associated post/task ID
  Amount: number;     // Amount to send
  Cid: string;        // IPFS CID for proof/receipt
}
```

**Backend Process**:
1. Receives payment request
2. Gets NGO's private key from database using `PostId`
3. Gets previous transaction hash using `getPrevTxn()`
4. Sends payment on Stellar network using `sendPaymentToWallet()`
5. Saves to smart contract using `saveContractWithWallet()`
6. Creates expense transaction record using `createTransaction()`
7. Returns transaction data

### Frontend Implementation

**File**: `/frontend/lib/stellar-utils.ts`

**Function**: `ngoWalletPayment()`

```typescript
export async function ngoWalletPayment(
  receiverPublicKey: string,
  postId: string,
  amount: number,
  cid: string
)
```

**Flow**:
```
1. NGO uploads proof/receipt to IPFS → gets CID
2. NGO enters receiver's wallet address
3. NGO enters amount to send
4. Call walletPay API with:
   - PublicKey: receiver's address
   - PostId: associated task ID
   - Amount: payment amount
   - Cid: IPFS CID of proof
5. Backend handles transaction signing and submission
6. Backend saves expense record
7. Show success message to NGO
```

**Usage Example**:
```typescript
import { ngoWalletPayment } from '@/lib/stellar-utils'

// When NGO clicks "Send Payment"
const result = await ngoWalletPayment(
  "GBUQWP3BOUZX34ULNQG23RQ6F4BVXEYMJUCHUZI7VCZE7FDCVXWH6HUP", // receiver
  taskId,           // post ID
  50,               // amount in XLM
  "QmXyz123..."     // IPFS CID
)

console.log("Payment successful:", result)
```

---

## Key Differences

| Aspect | User Donation | NGO Disbursement |
|--------|--------------|------------------|
| **Who initiates** | User (donor) | NGO (authenticated) |
| **Wallet signing** | User signs with Freighter | Backend signs with stored private key |
| **API endpoint** | `/payment/verify-donation` | `/payment/wallet-pay` |
| **Authentication** | No auth required | Requires NGO authentication |
| **Purpose** | Receive donations | Send payments out |
| **IPFS CID** | Not required | Required (proof of expense) |
| **Database record** | Donation table | Expense table |

---

## API Service Methods

**File**: `/frontend/lib/api-service.ts`

### For User Donations
```typescript
async verifyDonation(donationData: DonationData): Promise<ApiResponse<any>> {
  return this.request('/payment/verify-donation', {
    method: 'POST',
    body: JSON.stringify(donationData),
  });
}
```

### For NGO Disbursements
```typescript
async walletPay(payData: PayWallet): Promise<ApiResponse<any>> {
  return this.request('/payment/wallet-pay', {
    method: 'POST',
    body: JSON.stringify(payData),
  });
}
```

---

## Complete User Donation Example

```typescript
// In a donate modal component
import { submitDonationTransaction } from '@/lib/stellar-utils'
import { useWallet } from '@/hooks/use-wallet'
import { useState } from 'react'

function DonateModal({ taskId, onSuccess }) {
  const { publicKey, signTx, isConnected } = useWallet()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDonate = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }

    try {
      setLoading(true)
      
      const result = await submitDonationTransaction(
        publicKey!,
        amount,
        taskId,
        signTx
      )
      
      alert(`Donation successful! Transaction: ${result.hash}`)
      onSuccess(result)
      
    } catch (error) {
      console.error("Donation failed:", error)
      alert("Donation failed: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in XLM"
      />
      <button onClick={handleDonate} disabled={loading}>
        {loading ? "Processing..." : "Donate"}
      </button>
    </div>
  )
}
```

---

## Complete NGO Disbursement Example

```typescript
// In NGO dashboard
import { ngoWalletPayment } from '@/lib/stellar-utils'
import { useState } from 'react'

function NGOPaymentForm({ postId, onSuccess }) {
  const [receiverAddress, setReceiverAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [receiptCid, setReceiptCid] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true)
      
      const result = await ngoWalletPayment(
        receiverAddress,
        postId,
        parseFloat(amount),
        receiptCid
      )
      
      alert("Payment sent successfully!")
      onSuccess(result)
      
    } catch (error) {
      console.error("Payment failed:", error)
      alert("Payment failed: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input 
        type="text" 
        value={receiverAddress} 
        onChange={(e) => setReceiverAddress(e.target.value)}
        placeholder="Receiver's Stellar Address"
      />
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in XLM"
      />
      <input 
        type="text" 
        value={receiptCid} 
        onChange={(e) => setReceiptCid(e.target.value)}
        placeholder="IPFS CID of receipt"
      />
      <button onClick={handlePayment} disabled={loading}>
        {loading ? "Sending..." : "Send Payment"}
      </button>
    </div>
  )
}
```

---

## Error Handling

### Common Errors

**User Donation Errors**:
- "Invalid data" (400) - Missing required fields
- "Invalid Transaction" (401) - Transaction verification failed
- "Something went wrong while saving data" (500) - Database error

**NGO Disbursement Errors**:
- "Provide wallet address" (400) - Missing receiver address
- "Payment failed" (500) - Stellar network error
- Authentication errors - NGO not logged in

### Frontend Error Handling

```typescript
try {
  const result = await submitDonationTransaction(...)
} catch (error) {
  if (error.message.includes("Invalid Transaction")) {
    // Transaction not found on Stellar network
    alert("Transaction verification failed. Please try again.")
  } else if (error.message.includes("Session expired")) {
    // Redirect to login
    router.push('/ngo/login')
  } else {
    // Generic error
    alert("An error occurred: " + error.message)
  }
}
```

---

## Testing Checklist

### User Donation Flow
- [ ] User can connect wallet
- [ ] User can enter donation amount
- [ ] Transaction is created and signed
- [ ] API receives correct data format
- [ ] Backend verifies transaction
- [ ] Donation is saved to database
- [ ] Success message is shown
- [ ] Balance updates after donation

### NGO Disbursement Flow
- [ ] NGO is authenticated
- [ ] NGO can upload receipt to IPFS
- [ ] NGO can enter receiver address
- [ ] NGO can enter amount
- [ ] API receives correct data format
- [ ] Backend retrieves NGO's private key
- [ ] Payment is sent on Stellar network
- [ ] Expense is saved to database
- [ ] Success message is shown

---

## Next Steps

1. **Implement real Stellar transactions** - Replace mock transaction hash with actual Stellar SDK transaction creation
2. **Add transaction signing** - Use Freighter to sign transactions before submitting
3. **Add IPFS upload** - Implement receipt/proof upload to IPFS for NGO disbursements
4. **Add loading states** - Show progress during transaction processing
5. **Add transaction history** - Display past donations and expenses
6. **Add error recovery** - Handle network failures gracefully
