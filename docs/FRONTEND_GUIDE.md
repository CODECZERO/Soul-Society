# Frontend Documentation

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [User Flows](#user-flows)
5. [Components](#components)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Stellar Integration](#stellar-integration)
9. [Deployment](#deployment)

---

## Overview

Soul-Society is a decentralized donation platform built on Stellar blockchain. Users can donate to NGO tasks using Stellar (XLM), and NGOs can create tasks and manage funds transparently.

### Key Features
- 🔐 **Wallet Integration** - Freighter wallet for Stellar
- 💰 **Donations** - Send XLM to NGO tasks
- 📊 **Real-time Exchange Rates** - INR ↔ XLM conversion
- 🏢 **NGO Dashboard** - Create tasks, send payments
- 🔍 **Transparency** - All transactions on Stellar blockchain
- 📁 **IPFS Storage** - Decentralized file storage

---

## Tech Stack

### Core
- **Framework:** Next.js 16.0.0 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui

### State Management
- **Redux Toolkit** - Global state
- **React Hooks** - Local state

### Blockchain
- **Stellar SDK** - `@stellar/stellar-sdk`
- **Freighter API** - `@stellar/freighter-api`

### APIs
- **Axios** - HTTP client
- **CoinGecko API** - Exchange rates

---

## Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── explore/                 # Explore tasks
│   ├── task/[id]/              # Task details
│   ├── ngo-dashboard/          # NGO dashboard
│   └── ngo/                    # NGO auth pages
│       ├── login/
│       └── signup/
├── components/                  # React components
│   ├── ui/                     # shadcn/ui components
│   ├── header.tsx              # Navigation header
│   ├── donate-modal.tsx        # User donation modal
│   ├── create-task-modal.tsx   # NGO create task
│   ├── ngo-send-payment-modal.tsx  # NGO send payment
│   └── stellar-price-display.tsx   # XLM price widget
├── lib/                        # Utilities & services
│   ├── redux/                  # Redux store
│   │   ├── store.ts
│   │   └── slices/
│   │       ├── wallet-slice.ts
│   │       ├── donation-slice.ts
│   │       └── ngo-auth-slice.ts
│   ├── api-service.ts          # Backend API client
│   ├── stellar-utils.ts        # Stellar helpers
│   └── exchange-rates.ts       # Currency conversion
└── public/                     # Static assets
```

---

## User Flows

### 1. User Donation Flow

```
1. User browses tasks (/explore)
   ↓
2. Click on a task → Task details page
   ↓
3. Click "Donate" button
   ↓
4. Connect Freighter wallet (if not connected)
   ↓
5. Enter donation amount (INR or XLM)
   → Real-time conversion displayed
   ↓
6. Click "Continue" → Confirm donation
   ↓
7. Click "Sign with Wallet"
   → Freighter popup appears
   ↓
8. User approves transaction in Freighter
   ↓
9. Frontend:
   - Creates Stellar transaction
   - User signs with Freighter
   - Submits to Stellar network
   - Gets transaction hash
   ↓
10. Send to backend:
    POST /api/payment/verify-donation
    {
      TransactionId: "abc123...",
      postID: "68fda9e98ceedc5ae1f2988d",
      Amount: 100
    }
   ↓
11. Backend verifies on Stellar & saves
   ↓
12. Success! Show transaction hash
```

### 2. NGO Create Task Flow

```
1. NGO logs in (/ngo/login)
   ↓
2. Go to NGO Dashboard (/ngo-dashboard)
   ↓
3. Click "Create New Task"
   ↓
4. Fill in task details:
   - Title
   - Description
   - Location
   - Goal Amount (₹)
   - Category
   - Featured Image (optional)
   ↓
5. (Optional) Upload image to IPFS
   ↓
6. Click "Create Task"
   → POST /api/posts
   ↓
7. Backend saves post with NGO's wallet address
   ↓
8. Success! Task is now live
```

### 3. NGO Send Payment Flow

```
1. NGO selects a task from dashboard
   ↓
2. Click "Send Payment"
   ↓
3. Fill in payment details:
   - Receiver wallet address (Stellar)
   - Amount (XLM)
   - Description
   - Upload receipt
   ↓
4. Upload receipt to IPFS
   → Get IPFS CID
   ↓
5. Click "Send Payment"
   → POST /api/payment/wallet-pay
   {
     PublicKey: "GABC...",
     PostId: "68fda9e98ceedc5ae1f2988d",
     Amount: 50,
     Cid: "QmXyz..."
   }
   ↓
6. Backend:
   - Gets NGO's private key
   - Signs transaction
   - Submits to Stellar
   - Saves expense record
   ↓
7. Success! Payment sent
```

---

## Components

### 1. Header Component
**File:** `/components/header.tsx`

**Features:**
- Navigation menu
- Wallet connection status
- NGO login/logout
- Responsive design

**Usage:**
```tsx
import { Header } from "@/components/header"

<Header />
```

### 2. Donate Modal
**File:** `/components/donate-modal.tsx`

**Props:**
```typescript
interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;  // Task object with WalletAddr
}
```

**Features:**
- Amount input (INR or XLM)
- Real-time currency conversion
- Preset amounts
- Freighter wallet integration
- Transaction signing
- Backend verification

**Usage:**
```tsx
<DonateModal 
  isOpen={isDonateOpen} 
  onClose={() => setIsDonateOpen(false)} 
  task={task} 
/>
```

**Key Code:**
```tsx
// Extract NGO wallet address from task
const receiverWalletAddress = task.WalletAddr

// Process donation
dispatch(processDonation({
  amount: parseFloat(amount),
  currency: currency,
  taskId: task.id,
  publicKey: userWallet,
  receiverPublicKey: receiverWalletAddress,
  signTransaction: signTransactionFunction,
}))
```

### 3. Create Task Modal
**File:** `/components/create-task-modal.tsx`

**Props:**
```typescript
interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**
- Task form with validation
- Image upload to IPFS
- NGO wallet address from profile
- Backend API integration

**Usage:**
```tsx
<CreateTaskModal 
  isOpen={isCreateTaskOpen} 
  onClose={() => setIsCreateTaskOpen(false)} 
/>
```

### 4. NGO Send Payment Modal
**File:** `/components/ngo-send-payment-modal.tsx`

**Props:**
```typescript
interface NGOSendPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;  // Selected task
}
```

**Features:**
- Receiver wallet input
- Amount input (XLM)
- Description textarea
- Receipt upload to IPFS
- Backend payment processing

**Usage:**
```tsx
<NGOSendPaymentModal 
  isOpen={isSendPaymentOpen} 
  onClose={() => setIsSendPaymentOpen(false)} 
  task={selectedTask} 
/>
```

### 5. Stellar Price Display
**File:** `/components/stellar-price-display.tsx`

**Features:**
- Real-time XLM price in INR
- Auto-refresh every 60 seconds
- Loading state
- Error handling

**Usage:**
```tsx
<StellarPriceDisplay />
```

---

## State Management

### Redux Store
**File:** `/lib/redux/store.ts`

```typescript
export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    donation: donationReducer,
    ngoAuth: ngoAuthReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### 1. Wallet Slice
**File:** `/lib/redux/slices/wallet-slice.ts`

**State:**
```typescript
interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  walletType: 'freighter' | null;
  balance: string;
  isLoading: boolean;
  error: string | null;
}
```

**Actions:**
- `connectFreighter()` - Connect Freighter wallet
- `disconnectWallet()` - Disconnect wallet
- `fetchBalance()` - Get XLM balance
- `signTransaction()` - Sign transaction with Freighter
- `restoreWalletState()` - Restore from localStorage

**Usage:**
```tsx
const { isConnected, publicKey, balance } = useSelector(
  (state: RootState) => state.wallet
)

dispatch(connectFreighter())
```

### 2. Donation Slice
**File:** `/lib/redux/slices/donation-slice.ts`

**State:**
```typescript
interface DonationState {
  isDonating: boolean;
  donationHistory: any[];
  currentDonation: {
    amount: number;
    currency: 'XLM' | 'INR';
    taskId: string | null;
    transactionHash: string | null;
  } | null;
  error: string | null;
  exchangeRate: number;
}
```

**Actions:**
- `processDonation()` - Process donation transaction
- `fetchExchangeRate()` - Get XLM/INR rate
- `fetchDonationHistory()` - Get user's donations
- `clearDonationError()` - Clear error state

**Usage:**
```tsx
const { isDonating, exchangeRate, currentDonation } = useSelector(
  (state: RootState) => state.donation
)

dispatch(processDonation({
  amount: 100,
  currency: 'INR',
  taskId: '123',
  publicKey: 'GABC...',
  receiverPublicKey: 'GDEF...',
  signTransaction: signFn,
}))
```

### 3. NGO Auth Slice
**File:** `/lib/redux/slices/ngo-auth-slice.ts`

**State:**
```typescript
interface NGOAuthState {
  isAuthenticated: boolean;
  ngoProfile: {
    id: string;
    name: string;
    email: string;
    publicKey?: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}
```

**Actions:**
- `ngoLogin()` - NGO login
- `ngoSignup()` - NGO registration
- `ngoLogout()` - NGO logout
- `checkNGOAuth()` - Check auth status

---

## API Integration

### API Service
**File:** `/lib/api-service.ts`

**Configuration:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
```

**Methods:**

#### Posts
```typescript
// Get all posts
apiService.getPosts()

// Create post (NGO only)
apiService.createPost({
  Title: "Help Children",
  Type: "Education",
  Description: "...",
  Location: "Mumbai",
  ImgCid: "QmXyz...",
  NeedAmount: "50000",
  WalletAddr: "GABC...",
})
```

#### Donations
```typescript
// Verify donation
apiService.verifyDonation({
  TransactionId: "abc123...",
  postID: "68fda9e98ceedc5ae1f2988d",
  Amount: 100,
})

// Get all donations
apiService.getDonations()

// Get donations by post ID
apiService.getDonationsByPostId(postId)
```

#### Payments
```typescript
// NGO wallet payment
apiService.walletPay({
  PublicKey: "GABC...",
  PostId: "68fda9e98ceedc5ae1f2988d",
  Amount: 50,
  Cid: "QmXyz...",
})
```

#### IPFS
```typescript
// Upload file to IPFS
apiService.uploadToIPFS(file)
```

#### Stellar
```typescript
// Get wallet balance
apiService.getStellarBalance(publicKey)
```

---

## Stellar Integration

### Stellar Utils
**File:** `/lib/stellar-utils.ts`

### 1. Connect Freighter Wallet

```typescript
export async function connectFreighterWallet() {
  const { isConnected } = await import('@stellar/freighter-api')
  
  if (!(await isConnected())) {
    throw new Error("Freighter wallet is not installed")
  }
  
  const { getPublicKey } = await import('@stellar/freighter-api')
  const publicKey = await getPublicKey()
  
  return publicKey
}
```

### 2. Submit Donation Transaction

```typescript
export async function submitDonationTransaction(
  publicKey: string,
  amount: string,
  taskId: string,
  receiverPublicKey: string,
  signTransaction: (tx: string) => Promise<string>,
) {
  // 1. Validate and format amount (max 7 decimals)
  const amountNumber = parseFloat(amount)
  const formattedAmount = amountNumber.toFixed(7)
  
  // 2. Validate receiver address
  if (!receiverPublicKey.startsWith('G') || receiverPublicKey.length !== 56) {
    throw new Error("Invalid receiver wallet address")
  }
  
  // 3. Load account from Stellar
  const StellarSdk = await import('@stellar/stellar-sdk')
  const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')
  const account = await server.loadAccount(publicKey)
  
  // 4. Create payment transaction
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: receiverPublicKey,
        asset: StellarSdk.Asset.native(),
        amount: formattedAmount,
      })
    )
    .addMemo(StellarSdk.Memo.text(`Donation`))
    .setTimeout(180)
    .build()
  
  // 5. Sign with Freighter
  const transactionXDR = transaction.toXDR()
  const signedXDR = await signTransaction(transactionXDR)
  
  // 6. Submit to Stellar network
  const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
    signedXDR,
    StellarSdk.Networks.TESTNET
  )
  const result = await server.submitTransaction(signedTransaction)
  const transactionHash = signedTransaction.hash().toString('hex')
  
  // 7. Verify with backend
  const donationData = {
    TransactionId: transactionHash,
    postID: taskId,
    Amount: parseFloat(amount),
  }
  
  const response = await apiService.verifyDonation(donationData)
  
  return {
    success: true,
    hash: transactionHash,
    ledger: result.ledger,
    data: response.data
  }
}
```

### 3. Get Balance

```typescript
export async function getStellarBalance(publicKey: string) {
  const StellarSdk = await import('@stellar/stellar-sdk')
  const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')
  const account = await server.loadAccount(publicKey)
  
  const xlmBalance = account.balances.find(
    balance => balance.asset_type === 'native'
  )
  
  return xlmBalance?.balance || "0"
}
```

---

## Exchange Rates

### File: `/lib/exchange-rates.ts`

### Get XLM/INR Exchange Rate

```typescript
export async function getExchangeRate(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=inr'
    )
    const data = await response.json()
    return data.stellar.inr || 15  // Default fallback
  } catch (error) {
    console.error("Failed to fetch exchange rate:", error)
    return 15  // Default fallback
  }
}
```

### Convert INR to XLM

```typescript
export function convertRsToXlm(inr: number, rate: number): number {
  return inr / rate
}
```

### Convert XLM to INR

```typescript
export function convertXlmToRs(xlm: number, rate: number): number {
  return xlm * rate
}
```

**Usage:**
```tsx
const exchangeRate = await getExchangeRate()  // 28.60
const xlmAmount = convertRsToXlm(100, exchangeRate)  // 3.4965035
const inrAmount = convertXlmToRs(3.5, exchangeRate)  // 100.1
```

---

## Pages

### 1. Home Page
**File:** `/app/page.tsx`

**Features:**
- Hero section
- Featured tasks
- Statistics
- Call to action

### 2. Explore Page
**File:** `/app/explore/page.tsx`

**Features:**
- Task grid
- Search & filters
- Category filters
- Pagination

### 3. Task Details Page
**File:** `/app/task/[id]/page.tsx`

**Features:**
- Task information
- Donation progress
- Donate button
- Donation history
- Expense tracking

**Key Code:**
```tsx
// Fetch task data
const postsResponse = await apiService.getPosts()
const foundTask = postsResponse.data.find(p => p._id === id)

// Include WalletAddr in task object
setTask({
  id: foundTask._id,
  title: foundTask.Title,
  location: foundTask.Location,
  goal: parseInt(foundTask.NeedAmount),
  description: foundTask.Description,
  category: foundTask.Type,
  WalletAddr: foundTask.WalletAddr,  // ← Important!
})
```

### 4. NGO Dashboard
**File:** `/app/ngo-dashboard/page.tsx`

**Features:**
- Statistics overview
- Active tasks list
- Create task button
- Send payment button
- Upload proof button

**Protected Route:**
```tsx
useEffect(() => {
  if (!isAuthenticated) {
    router.push("/ngo/login")
  }
}, [isAuthenticated, router])
```

---

## Environment Variables

**File:** `/frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Key Fixes Applied

### 1. Amount Format Fix
**Issue:** Stellar requires amount as string with max 7 decimals

**Solution:**
```typescript
const formattedAmount = amountNumber.toFixed(7)
```

### 2. Wallet Address Missing
**Issue:** Task object didn't include `WalletAddr`

**Solution:**
```typescript
setTask({
  ...otherFields,
  WalletAddr: foundTask.WalletAddr,  // ← Added
})
```

### 3. Memo Length Error
**Issue:** Memo exceeded 28 byte limit

**Solution:**
```typescript
.addMemo(StellarSdk.Memo.text(`Donation`))  // Short & simple
```

### 4. Network Error
**Issue:** Frontend couldn't connect to backend

**Solution:**
- Created `.env.local` with API URL
- Configured CORS on backend

### 5. Duplication Error
**Issue:** Same transaction submitted multiple times

**Solution:**
- Backend checks for existing donation
- Returns existing if found (idempotent)

---

## Running the Frontend

### Development

```bash
cd frontend
npm install
npm run dev
```

**Access:** `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

---

## Testing Checklist

### User Donation
- [ ] Connect Freighter wallet
- [ ] Browse tasks
- [ ] Click donate
- [ ] Enter amount (INR/XLM)
- [ ] See real-time conversion
- [ ] Confirm donation
- [ ] Sign with Freighter
- [ ] Transaction succeeds
- [ ] Backend verifies
- [ ] Success message shown

### NGO Create Task
- [ ] NGO logs in
- [ ] Go to dashboard
- [ ] Click create task
- [ ] Fill in details
- [ ] Upload image (optional)
- [ ] Submit
- [ ] Task appears in list
- [ ] Task visible to users

### NGO Send Payment
- [ ] Select task
- [ ] Click send payment
- [ ] Enter receiver wallet
- [ ] Enter amount
- [ ] Upload receipt
- [ ] Submit
- [ ] Receipt uploads to IPFS
- [ ] Payment processes
- [ ] Expense recorded
- [ ] Success message shown

---

## Summary

✅ **Next.js 16** with App Router
✅ **TypeScript** for type safety
✅ **Redux Toolkit** for state management
✅ **Stellar SDK** for blockchain
✅ **Freighter** wallet integration
✅ **Real-time** exchange rates
✅ **IPFS** file storage
✅ **Responsive** design with TailwindCSS
✅ **Complete** user & NGO flows

**Frontend runs on:** `http://localhost:3000`
