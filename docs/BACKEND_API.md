# Backend API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Stellar Integration](#stellar-integration)
6. [IPFS Integration](#ipfs-integration)
7. [Error Handling](#error-handling)

---

## Overview

### Tech Stack
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Blockchain:** Stellar Network (Testnet)
- **Storage:** IPFS (Pinata)
- **Authentication:** JWT

### Base URL
```
Development: http://localhost:8000/api
```

### Server Configuration
**File:** `/server/src/app.ts`

```typescript
// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());
```

---

## Authentication

### JWT Token System

#### NGO Authentication
**Endpoint:** `POST /api/ngo/login`

**Request:**
```json
{
  "email": "ngo@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "ngo": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Help Foundation",
      "email": "ngo@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful",
  "success": true
}
```

#### Token Verification Middleware
**File:** `/server/src/middleware/verifyToken.middleware.ts`

```typescript
// Verifies JWT token and sets req.NgoId
export const verifyToken = (req, res, next) => {
  const token = req.cookies?.accessToken || 
                req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }
  
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  req.NgoId = decoded._id;
  next();
};
```

---

## API Endpoints

### 1. Posts/Tasks

#### Get All Posts
```http
GET /api/posts
```

**Authentication:** Not required

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "68fda9e98ceedc5ae1f2988d",
      "Title": "Help Children Education",
      "Type": "Education",
      "Description": "Provide education to underprivileged children",
      "Location": "Mumbai, India",
      "ImgCid": "QmXyz123...",
      "NeedAmount": "50000",
      "WalletAddr": "GBNINZFAUAYNGGNX734RNXUI57MYHNPOL7GNEPPYPC27QKBUYHK6Z2RZ",
      "NgoRef": "507f1f77bcf86cd799439011",
      "createdAt": "2025-10-26T04:56:09.379Z",
      "updatedAt": "2025-10-26T04:56:09.379Z"
    }
  ],
  "message": "found data",
  "success": true
}
```

#### Create Post
```http
POST /api/posts
```

**Authentication:** Required (NGO)

**Request:**
```json
{
  "Title": "Help Children Education",
  "Type": "Education",
  "Description": "Provide education to underprivileged children",
  "Location": "Mumbai, India",
  "ImgCid": "QmXyz123...",
  "NeedAmount": "50000",
  "WalletAddr": "GBNINZFAUAYNGGNX734RNXUI57MYHNPOL7GNEPPYPC27QKBUYHK6Z2RZ"
}
```

**Note:** `NgoRef` is automatically set from JWT token

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "68fda9e98ceedc5ae1f2988d",
    "Title": "Help Children Education",
    "Type": "Education",
    "Description": "Provide education to underprivileged children",
    "Location": "Mumbai, India",
    "ImgCid": "QmXyz123...",
    "NeedAmount": "50000",
    "WalletAddr": "GBNINZFAUAYNGGNX734RNXUI57MYHNPOL7GNEPPYPC27QKBUYHK6Z2RZ",
    "NgoRef": "507f1f77bcf86cd799439011",
    "createdAt": "2025-10-26T04:56:09.379Z",
    "updatedAt": "2025-10-26T04:56:09.379Z"
  },
  "message": "post created",
  "success": true
}
```

**Controller:** `/server/src/controler/post.controler.ts`

---

### 2. Donations

#### Verify and Save Donation
```http
POST /api/payment/verify-donation
```

**Authentication:** Required (User)

**Request:**
```json
{
  "TransactionId": "abc123def456789...",
  "postID": "68fda9e98ceedc5ae1f2988d",
  "Amount": 100
}
```

**Process:**
1. Check if donation already exists (prevent duplicates)
2. Verify transaction on Stellar network
3. Save to database

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "currentTxn": "abc123def456789...",
    "postIDs": "68fda9e98ceedc5ae1f2988d",
    "Amount": 100,
    "RemainingAmount": 100,
    "createdAt": "2025-10-28T06:30:00.000Z",
    "updatedAt": "2025-10-28T06:30:00.000Z"
  },
  "message": "saved trasncation",
  "success": true
}
```

**Controller:** `/server/src/controler/payment.controler.ts`

```typescript
const verfiyDonationAndSave = AsyncHandler(
  async (req: Request, res: Response) => {
    const donationData: DonationData = req.body;
    
    // Check if donation already exists (prevent duplicates)
    const existingDonation = await getDonation(donationData.TransactionId);
    if (existingDonation) {
      return res.status(200).json(
        new ApiResponse(200, existingDonation, "Donation already recorded")
      );
    }
    
    // Verify transaction on Stellar network
    const verfiyDonation = await verfiyTransaction(donationData.TransactionId);
    if (!verfiyDonation) throw new ApiError(401, "Invalid Transaction");
    
    // Save donation to database
    const saveData = await createDonation(donationData);
    
    return res.status(200).json(
      new ApiResponse(200, saveData, "saved trasncation")
    );
  }
);
```

#### Get All Donations
```http
GET /api/donations
```

**Authentication:** Not required

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "currentTxn": "abc123...",
      "postIDs": "68fda9e98ceedc5ae1f2988d",
      "Amount": 100,
      "RemainingAmount": 100,
      "createdAt": "2025-10-28T06:30:00.000Z"
    }
  ],
  "message": "found data",
  "success": true
}
```

#### Get Donations by Post ID
```http
GET /api/donations/post/:postId
```

**Authentication:** Not required

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "currentTxn": "abc123...",
      "postIDs": "68fda9e98ceedc5ae1f2988d",
      "Amount": 100,
      "createdAt": "2025-10-28T06:30:00.000Z"
    }
  ],
  "message": "found data",
  "success": true
}
```

---

### 3. NGO Wallet Payment

#### Send Payment from NGO Wallet
```http
POST /api/payment/wallet-pay
```

**Authentication:** Required (NGO)

**Request:**
```json
{
  "PublicKey": "GABC123...",
  "PostId": "68fda9e98ceedc5ae1f2988d",
  "Amount": 50,
  "Cid": "QmXyz789..."
}
```

**Process:**
1. Get NGO's private key for the post
2. Get previous transaction hash
3. Send payment on Stellar network
4. Save to smart contract
5. Create expense record

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "transactionHash": "def456...",
    "expense": {
      "_id": "507f1f77bcf86cd799439013",
      "postID": "68fda9e98ceedc5ae1f2988d",
      "amount": 50,
      "cid": "QmXyz789...",
      "createdAt": "2025-10-28T06:35:00.000Z"
    }
  },
  "message": "Payment successful",
  "success": true
}
```

**Controller:** `/server/src/controler/payment.controler.ts`

```typescript
const walletPay = AsyncHandler(async (req: Request, res: Response) => {
  const senderWallet: PayWallet = req.body;
  
  // Get NGO's private key for this post
  const PrivateKey = await getPrivateKey(senderWallet.PostId);
  
  // Get previous transaction hash
  const prevTxn = await getPrevTxn(senderWallet.PostId);
  
  // Send payment on Stellar
  const Pay = await sendPaymentToWallet({
    senderKey: PrivateKey,
    receiverKey: senderWallet.PublicKey,
    amount: senderWallet.Amount,
    meta: {
      cid: senderWallet.Cid || "Pending",
      prevTxn: prevTxn,
    },
  });
  
  if (!Pay) throw new ApiError(500, "Payment faild");
  
  // Save to smart contract
  const UploadData = await saveContractWithWallet({
    privateKey: PrivateKey,
    reciverKey: senderWallet.PublicKey,
    amount: senderWallet.Amount,
    cid: senderWallet.Cid,
    prevTxn: prevTxn,
    metadata: "optional metadata here",
  });
  
  // Create expense record
  const data = await createTransaction(UploadData, senderWallet.PostId);
  
  return res.status(200).json(
    new ApiResponse(200, data, "Payment successful")
  );
});
```

---

### 4. Expenses

#### Get Expenses by Post ID
```http
GET /api/expenses/prev-txn/:postId
```

**Authentication:** Not required

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "prevTxn": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "postID": "68fda9e98ceedc5ae1f2988d",
        "amount": 50,
        "cid": "QmXyz789...",
        "transactionHash": "def456...",
        "createdAt": "2025-10-28T06:35:00.000Z"
      }
    ]
  },
  "message": "found data",
  "success": true
}
```

---

### 5. Stellar Balance

#### Get Wallet Balance
```http
GET /api/stellar/balance/:publicKey
```

**Authentication:** Not required

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "publicKey": "GAZ4YF4K7NIMMVX7BTIDTIIFZYB6FFHYTU3DIBNQSSQW3PMVYXDBSX4W",
    "balance": "10000.0000000",
    "asset": "XLM"
  },
  "message": "Balance retrieved",
  "success": true
}
```

---

### 6. IPFS Upload

#### Upload File to IPFS
```http
POST /api/ipfs/upload
```

**Authentication:** Not required

**Request:** `multipart/form-data`
```
file: [binary file data]
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "cid": "QmXyz123...",
    "hash": "QmXyz123...",
    "url": "https://gateway.pinata.cloud/ipfs/QmXyz123..."
  },
  "message": "File uploaded to IPFS",
  "success": true
}
```

---

## Data Models

### Post Model
**File:** `/server/src/model/post.model.ts`

```typescript
{
  Title: String,           // Required
  Type: String,            // Category
  Description: String,     // Required
  Location: String,        // Required
  ImgCid: String,          // IPFS CID
  NeedAmount: String,      // Required
  WalletAddr: String,      // Stellar wallet address
  NgoRef: ObjectId,        // Reference to NGO
  timestamps: true         // createdAt, updatedAt
}
```

### Donation Model
**File:** `/server/src/model/donation.model.ts`

```typescript
{
  currentTxn: {
    type: String,
    unique: true          // Prevents duplicate donations
  },
  postIDs: {
    type: ObjectId,
    ref: "post"
  },
  Amount: {
    type: Number,
    required: true
  },
  RemainingAmount: Number,
  timestamps: true
}
```

### Expense Model
**File:** `/server/src/model/expense.model.ts`

```typescript
{
  postID: {
    type: ObjectId,
    ref: "post"
  },
  amount: Number,
  cid: String,              // IPFS CID of receipt
  transactionHash: String,  // Stellar transaction hash
  prevTxn: String,          // Previous transaction hash
  timestamps: true
}
```

### NGO Model
**File:** `/server/src/model/ngo.model.ts`

```typescript
{
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,         // Hashed
  publicKey: String,        // Stellar public key
  privateKey: String,       // Stellar private key (encrypted)
  refreshToken: String,
  timestamps: true
}
```

---

## Stellar Integration

### Transaction Verification
**File:** `/server/src/services/stellar/transcation.stellar.js`

```typescript
export const verfiyTransaction = async (transactionHash: string) => {
  try {
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    const transaction = await server.transactions()
      .transaction(transactionHash)
      .call();
    
    return transaction ? true : false;
  } catch (error) {
    console.error("Transaction verification failed:", error);
    return false;
  }
};
```

### Send Payment
```typescript
export const sendPaymentToWallet = async ({
  senderKey,
  receiverKey,
  amount,
  meta
}) => {
  const server = new Horizon.Server('https://horizon-testnet.stellar.org');
  const sourceKeypair = Keypair.fromSecret(senderKey);
  const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
  
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: receiverKey,
        asset: Asset.native(),
        amount: amount.toString(),
      })
    )
    .addMemo(Memo.text(meta.cid || "Payment"))
    .setTimeout(180)
    .build();
  
  transaction.sign(sourceKeypair);
  
  const result = await server.submitTransaction(transaction);
  return result.hash;
};
```

### Get Balance
```typescript
export const getBalance = async (publicKey: string) => {
  const server = new Horizon.Server('https://horizon-testnet.stellar.org');
  const account = await server.loadAccount(publicKey);
  
  const xlmBalance = account.balances.find(
    balance => balance.asset_type === 'native'
  );
  
  return xlmBalance?.balance || "0";
};
```

---

## IPFS Integration

### Upload to Pinata
**File:** `/server/src/services/ipfs(pinata)/ipfs.services.js`

```typescript
export const uploadOnIpfs = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
      },
    }
  );
  
  return {
    cid: response.data.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
  };
};
```

---

## Error Handling

### ApiError Class
**File:** `/server/src/util/apiError.util.ts`

```typescript
class ApiError extends Error {
  statusCode: number;
  message: string;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}
```

### ApiResponse Class
**File:** `/server/src/util/apiResponse.util.ts`

```typescript
class ApiResponse {
  statusCode: number;
  data: any;
  message: string;
  success: boolean;
  
  constructor(statusCode: number, data: any, message: string) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
```

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Invalid data",
  "success": false
}
```

---

## Environment Variables

```env
# Server
PORT=8000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/soul-society

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d

# Stellar
STELLAR_NETWORK=TESTNET
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# IPFS (Pinata)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

---

## Summary

✅ **RESTful API** with Express.js
✅ **MongoDB** for data persistence
✅ **JWT Authentication** for NGOs
✅ **Stellar Integration** for blockchain transactions
✅ **IPFS Integration** for decentralized storage
✅ **Error Handling** with custom classes
✅ **CORS** configured for frontend
✅ **TypeScript** for type safety

**Server runs on:** `http://localhost:8000`
**API Base:** `http://localhost:8000/api`
