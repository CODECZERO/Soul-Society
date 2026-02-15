# Soul-Society Server - Comprehensive Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Environment Setup](#environment-setup)
4. [Database Models](#database-models)
5. [API Endpoints](#api-endpoints)
6. [Authentication & Cookies](#authentication--cookies)
7. [Data Flow](#data-flow)
8. [Frontend Integration](#frontend-integration)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

## Overview

Soul-Society is a blockchain-based donation platform that enables NGOs to create fundraising campaigns and receive donations through the Stellar blockchain. The server is built with Node.js, Express.js, TypeScript, and MongoDB.

### Key Features

- NGO registration and authentication
- Campaign creation and management
- Stellar blockchain integration
- IPFS file storage
- Smart contract integration
- Donation tracking and verification

## Architecture

### Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Blockchain**: Stellar Network
- **File Storage**: IPFS (Pinata)
- **Authentication**: JWT with refresh tokens
- **File Upload**: Multer

### Project Structure

```
server/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── index.ts              # Server entry point
│   ├── controler/            # Request handlers
│   ├── dbQueries/            # Database operations
│   ├── midelware/            # Custom middleware
│   ├── model/                # Mongoose schemas
│   ├── routes/               # API route definitions
│   ├── services/             # External service integrations
│   └── util/                 # Utility functions
├── dist/                     # Compiled JavaScript
├── public/                   # Static files
└── package.json
```

## Environment Setup

### Required Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/soul-society

# JWT Secrets
ATS=your-access-token-secret
RTS=your-refresh-token-secret
ATE=15m
RTE=7d

# Stellar Configuration
BLOCKCHAIN_NETWORK=https://horizon-testnet.stellar.org

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
PORT=8000

# IPFS/Pinata (if using)
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
```

### Installation

```bash
cd server
npm install
npm run build
npm start
```

## Database Models

### 1. NGO Model (`user(Ngo).model.ts`)

```typescript
interface INgo {
  NgoName: string; // Unique NGO name
  RegNumber: string; // Unique registration number
  Description: string; // NGO description
  Email: string; // Unique email
  PhoneNo: string; // Phone number
  Password: string; // Hashed password
  PublicKey: string; // Stellar public key
  PrivateKey: string; // Stellar private key
  RefreshToken?: string; // JWT refresh token
}
```

**Features:**

- Password hashing with bcrypt
- JWT token generation methods
- Automatic Stellar account creation
- Unique constraints on email, NgoName, and RegNumber

### 2. Post Model (`post.model.ts`)

```typescript
interface IPost {
  Title: string; // Campaign title
  Type: string; // Campaign type
  Description: string; // Campaign description
  Location: string; // Campaign location
  ImgCid: string; // IPFS image CID (unique)
  NgoRef: ObjectId; // Reference to NGO
  NeedAmount: number; // Required amount
  CollectedAmount: number; // Amount collected
  WalletAddr: string; // Stellar wallet address
}
```

### 3. Donation Model (`donation.model.ts`)

```typescript
interface IDonation {
  currentTxn: string; // Transaction ID (unique)
  postIDs: ObjectId; // Reference to post
  Amount: number; // Donation amount
  RemainingAmount: number; // Remaining amount
}
```

### 4. Expense Model (`expense.model.ts`)

```typescript
interface IExpense {
  currentTxn: string; // Transaction ID (unique)
  postIDs: ObjectId; // Reference to post
}
```

## API Endpoints

### Authentication Routes (`/api/user`)

#### POST `/api/user/signup`

Register a new NGO.

**Request Body:**

```json
{
  "ngoName": "string",
  "regNumber": "string",
  "description": "string",
  "email": "string",
  "phoneNo": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully with blockchain account",
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "jwt-token",
    "userData": {
      "Id": "object-id",
      "NgoName": "string",
      "Email": "string",
      "RegNumber": "string",
      "Description": "string",
      "createdAt": "date"
    },
    "blockchainAccount": {
      "publicKey": "stellar-public-key"
    }
  }
}
```

#### POST `/api/user/login`

Login existing NGO.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "user confirm",
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "jwt-token",
    "userData": {
      "Id": "object-id",
      "NgoName": "string",
      "Email": "string",
      "RegNumber": "string",
      "Description": "string",
      "createdAt": "date"
    }
  }
}
```

#### POST `/api/user/refresh`

Refresh access token.

**Request Body:**

```json
{
  "refreshToken": "string"
}
```

### Post Routes (`/api/posts`)

#### GET `/api/posts`

Get all posts (public).

**Response:**

```json
{
  "success": true,
  "message": "found data",
  "data": [
    {
      "_id": "object-id",
      "Title": "string",
      "Type": "string",
      "Description": "string",
      "Location": "string",
      "ImgCid": "string",
      "NgoRef": "object-id",
      "NeedAmount": "number",
      "CollectedAmount": "number",
      "WalletAddr": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ]
}
```

#### POST `/api/posts`

Create new post (requires authentication).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Request Body:**

```json
{
  "Title": "string",
  "Type": "string",
  "Description": "string",
  "Location": "string",
  "ImgCid": "string",
  "NeedAmount": "string",
  "WalletAddr": "string"
}
```

### Stellar Routes (`/api/stellar`)

#### GET `/api/stellar/balance/:publicKey`

Get wallet balance.

**Response:**

```json
{
  "success": true,
  "message": "Balance retrieved successfully",
  "data": {
    "balance": "string",
    "asset_type": "native"
  }
}
```

#### POST `/api/stellar/send-payment`

Send payment between wallets.

**Request Body:**

```json
{
  "senderKey": "string",
  "receiverKey": "string",
  "amount": "number",
  "meta": {
    "cid": "string",
    "prevTxn": "string"
  }
}
```

#### GET `/api/stellar/verify/:transactionId`

Verify transaction.

**Response:**

```json
{
  "success": true,
  "message": "Transaction verified",
  "data": {
    "id": "string",
    "successful": "boolean",
    "ledger": "number"
  }
}
```

### Payment Routes (`/api/payment`)

#### POST `/api/payment/verify-donation`

Verify donation and save to database.

**Request Body:**

```json
{
  "TransactionId": "string",
  "postID": "string",
  "Amount": "number"
}
```

#### POST `/api/payment/wallet-pay`

Process wallet payment.

**Request Body:**

```json
{
  "PublicKey": "string",
  "PostId": "string",
  "Amount": "number",
  "Cid": "string"
}
```

### IPFS Routes (`/api/ipfs`)

#### POST `/api/ipfs/upload`

Upload file to IPFS.

**Request:** Multipart form data with `file` field.

**Response:**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "IpfsHash": "string",
    "PinSize": "number",
    "Timestamp": "string"
  }
}
```

## Authentication & Cookies

### Cookie Configuration

The server uses HTTP-only cookies for secure token storage:

#### Access Token Cookie

- **Name**: `accessToken`
- **Type**: JWT
- **Expires**: 15 minutes
- **HttpOnly**: true
- **Secure**: true (production only)
- **SameSite**: Lax

#### Refresh Token Cookie

- **Name**: `refreshToken`
- **Type**: JWT
- **Expires**: 7 days
- **HttpOnly**: true
- **Secure**: true (production only)
- **SameSite**: Lax

### Frontend Cookie Requirements

The frontend must handle cookies as follows:

1. **Automatic Cookie Handling**: Ensure cookies are sent with requests
2. **CORS Configuration**: Include `credentials: true` in fetch requests
3. **Cookie Storage**: Don't manually store JWT tokens in localStorage/sessionStorage
4. **Token Refresh**: Implement automatic token refresh using the refresh endpoint

### Example Frontend Implementation

```javascript
// Fetch with credentials
fetch('/api/posts', {
  method: 'POST',
  credentials: 'include', // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(postData),
});

// Axios configuration
axios.defaults.withCredentials = true;
```

## Data Flow

### 1. NGO Registration Flow

```
Frontend → POST /api/user/signup → Create Stellar Account → Save to MongoDB → Return Tokens
```

### 2. Campaign Creation Flow

```
Frontend → Upload Image to IPFS → POST /api/posts (with auth) → Save to MongoDB → Return Post Data
```

### 3. Donation Flow

```
Frontend → Stellar Transaction → POST /api/payment/verify-donation → Save to MongoDB → Update Post
```

### 4. Authentication Flow

```
Frontend → POST /api/user/login → Verify Credentials → Generate Tokens → Set Cookies → Return User Data
```

## Frontend Integration

### Required Frontend Data

#### For NGO Registration

```typescript
interface SignupData {
  ngoName: string;
  regNumber: string;
  description: string;
  email: string;
  phoneNo: string;
  password: string;
}
```

#### For Campaign Creation

```typescript
interface PostData {
  Title: string;
  Type: string;
  Description: string;
  Location: string;
  ImgCid: string; // From IPFS upload
  NeedAmount: string;
  WalletAddr: string; // From user's Stellar account
}
```

#### For Donations

```typescript
interface DonationData {
  TransactionId: string; // From Stellar transaction
  postID: string;
  Amount: number;
}
```

### Frontend State Management

The frontend should maintain:

1. **User Authentication State**: Access token, user data
2. **Campaign Data**: List of posts, current post details
3. **Wallet State**: Stellar account information
4. **Donation History**: User's donation records

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Common HTTP Status Codes

- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/expired token)
- `404`: Not Found
- `500`: Internal Server Error

### Error Types

1. **Validation Errors**: Missing required fields
2. **Authentication Errors**: Invalid credentials, expired tokens
3. **Authorization Errors**: Insufficient permissions
4. **Database Errors**: Connection issues, constraint violations
5. **Blockchain Errors**: Stellar network issues, invalid transactions

## Testing

### Test Environment Setup

1. **Database**: Use separate test database
2. **Stellar**: Use testnet
3. **IPFS**: Use test environment or mock

### Test Categories

1. **Unit Tests**: Individual function testing
2. **Integration Tests**: API endpoint testing
3. **E2E Tests**: Complete user flow testing
4. **Security Tests**: Authentication and authorization testing

### Test Data Requirements

- Valid NGO registration data
- Valid post creation data
- Valid donation data
- Invalid data for error testing
- Mock Stellar transactions
- Mock IPFS responses

---

## Security Considerations

1. **Password Security**: Bcrypt hashing with salt rounds
2. **Token Security**: JWT with secure secrets
3. **CORS Configuration**: Restricted to frontend URL
4. **Input Validation**: Comprehensive data validation
5. **Error Handling**: No sensitive data in error responses
6. **Private Key Security**: Never expose private keys in responses

## Performance Considerations

1. **Database Indexing**: Unique fields are indexed
2. **Token Expiration**: Short-lived access tokens
3. **File Upload Limits**: 10MB limit for JSON, configurable for files
4. **Connection Pooling**: MongoDB connection pooling
5. **Error Logging**: Comprehensive logging for debugging

## Deployment

### Production Checklist

- [ ] Set secure JWT secrets
- [ ] Configure production MongoDB
- [ ] Set up Stellar mainnet
- [ ] Configure CORS for production domain
- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
