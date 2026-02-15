# Soul-Society Server - Complete Documentation & Testing Guide

## 📋 Overview

This document provides a comprehensive guide to the Soul-Society server, including detailed documentation, API specifications, frontend integration requirements, and complete testing suite.

## 🏗️ Server Architecture

### Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Blockchain**: Stellar Network (Testnet)
- **File Storage**: IPFS (Pinata)
- **Authentication**: JWT with refresh tokens
- **File Upload**: Multer

### Project Structure

```
server/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── index.ts              # Server entry point
│   ├── controler/            # Request handlers (8 files)
│   ├── dbQueries/            # Database operations (4 files)
│   ├── midelware/            # Custom middleware (2 files)
│   ├── model/                # Mongoose schemas (4 files)
│   ├── routes/               # API route definitions (9 files)
│   ├── services/             # External service integrations
│   └── util/                 # Utility functions (7 files)
├── test/                     # Test files
├── dist/                     # Compiled JavaScript
└── public/                   # Static files
```

## 🔧 Environment Setup

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
```

### Installation & Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

## 📊 Database Models

### 1. NGO Model

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

### 2. Post Model

```typescript
interface IPost {
  Title: string; // Campaign title
  Type: string; // Campaign type
  Description: string; // Campaign description
  Location: string; // Campaign location
  ImgCid: string; // IPFS image CID
  NgoRef: ObjectId; // Reference to NGO
  NeedAmount: number; // Required amount
  CollectedAmount: number; // Amount collected
  WalletAddr: string; // Stellar wallet address
}
```

### 3. Donation Model

```typescript
interface IDonation {
  currentTxn: string; // Transaction ID
  postIDs: ObjectId; // Reference to post
  Amount: number; // Donation amount
  RemainingAmount: number; // Remaining amount
}
```

### 4. Expense Model

```typescript
interface IExpense {
  currentTxn: string; // Transaction ID
  postIDs: ObjectId; // Reference to post
}
```

## 🌐 API Endpoints

### Authentication Routes (`/api/user`)

| Method | Endpoint   | Description          | Auth Required |
| ------ | ---------- | -------------------- | ------------- |
| POST   | `/signup`  | Register new NGO     | No            |
| POST   | `/login`   | Login NGO            | No            |
| POST   | `/refresh` | Refresh access token | No            |

### Post Routes (`/api/posts`)

| Method | Endpoint | Description     | Auth Required |
| ------ | -------- | --------------- | ------------- |
| GET    | `/`      | Get all posts   | No            |
| POST   | `/`      | Create new post | Yes           |

### Stellar Routes (`/api/stellar`)

| Method | Endpoint                 | Description            | Auth Required |
| ------ | ------------------------ | ---------------------- | ------------- |
| GET    | `/balance/:publicKey`    | Get wallet balance     | No            |
| POST   | `/send-payment`          | Send payment           | No            |
| GET    | `/verify/:transactionId` | Verify transaction     | No            |
| POST   | `/create-account`        | Create Stellar account | No            |
| DELETE | `/delete-account`        | Delete Stellar account | No            |
| POST   | `/smart-contract`        | Save to smart contract | No            |
| POST   | `/get-latest-data`       | Get contract data      | No            |

### Payment Routes (`/api/payment`)

| Method | Endpoint           | Description            | Auth Required |
| ------ | ------------------ | ---------------------- | ------------- |
| POST   | `/verify-donation` | Verify donation        | No            |
| POST   | `/wallet-pay`      | Process wallet payment | No            |

### IPFS Routes (`/api/ipfs`)

| Method | Endpoint  | Description         | Auth Required |
| ------ | --------- | ------------------- | ------------- |
| POST   | `/upload` | Upload file to IPFS | No            |

## 🍪 Cookie Requirements for Frontend

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

### Frontend Implementation

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

## 📤 Data Flow from Frontend

### 1. NGO Registration

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

### 2. Campaign Creation

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

### 3. Donation Processing

```typescript
interface DonationData {
  TransactionId: string; // From Stellar transaction
  postID: string;
  Amount: number;
}
```

## 🧪 Testing Suite

### Test Structure

```
server/
├── test/
│   ├── auth.test.js         # Authentication tests
│   ├── posts.test.js        # Post management tests
│   ├── stellar.test.js      # Blockchain tests
│   ├── payment.test.js      # Payment tests
│   ├── ipfs.test.js         # File upload tests
│   └── expenses.test.js     # Expense tests
├── test-backend-setup.js    # Test utilities
├── run-tests.js             # Test runner
└── test-package.json        # Test dependencies
```

### Running Tests

#### Quick Start

```bash
# Install test dependencies
npm install --save-dev jest supertest mongodb-memory-server

# Run all tests
node run-tests.js

# Run specific test suite
node run-tests.js --mode auth --verbose

# Run with coverage
node run-tests.js --coverage --format html
```

#### Test Modes

- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user flow testing
- **All Tests**: Complete test suite

#### Test Output Formats

- **Console**: Default terminal output
- **JSON**: Machine-readable report
- **HTML**: Visual report with charts
- **JUnit**: CI/CD compatible XML

### Test Coverage

- **Total Test Cases**: 50+
- **Coverage Target**: >80% line coverage
- **Test Categories**: 6 main areas
- **Automated Tests**: 100%

## 📋 Test Cases Summary

### Authentication Tests (AUTH_001 - AUTH_007)

- ✅ Valid NGO registration
- ✅ Duplicate email handling
- ✅ Missing field validation
- ✅ Valid login
- ✅ Invalid credentials
- ✅ Token refresh
- ✅ Token validation

### Post Management Tests (POST_001 - POST_005)

- ✅ Create post with authentication
- ✅ Create post without authentication
- ✅ Missing field validation
- ✅ Get all posts (public)
- ✅ Empty database handling

### Stellar Blockchain Tests (STELLAR_001 - STELLAR_008)

- ✅ Get wallet balance
- ✅ Send payment
- ✅ Verify transaction
- ✅ Create account
- ✅ Delete account
- ✅ Smart contract operations

### Payment Tests (PAYMENT_001 - PAYMENT_004)

- ✅ Verify donation
- ✅ Wallet payment
- ✅ Invalid transaction handling
- ✅ Payment processing

### IPFS Tests (IPFS_001 - IPFS_003)

- ✅ File upload
- ✅ Invalid file type
- ✅ File size limits

### Expense Tests (EXPENSE_001 - EXPENSE_003)

- ✅ Get previous transaction
- ✅ Create transaction record
- ✅ Invalid post handling

## 🚀 Getting Started

### 1. Setup Development Environment

```bash
# Clone repository
git clone <repository-url>
cd server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Build project
npm run build

# Start development server
npm run dev
```

### 2. Setup Test Environment

```bash
# Install test dependencies
npm install --save-dev jest supertest mongodb-memory-server

# Run tests
node run-tests.js --verbose

# Run with coverage
node run-tests.js --coverage --format html
```

### 3. Frontend Integration

```javascript
// Configure API client
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
});

// Example: Create a post
const createPost = async (postData) => {
  try {
    const response = await apiClient.post('/posts', postData);
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Security**: Secure token generation and validation
- **CORS Protection**: Restricted to frontend URL
- **Input Validation**: Comprehensive data validation
- **Error Handling**: No sensitive data in error responses
- **Private Key Security**: Never exposed in responses

## 📈 Performance Considerations

- **Database Indexing**: Unique fields are indexed
- **Token Expiration**: Short-lived access tokens
- **File Upload Limits**: 10MB limit for JSON, configurable for files
- **Connection Pooling**: MongoDB connection pooling
- **Error Logging**: Comprehensive logging for debugging

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MONGODB_URI environment variable
   - Ensure MongoDB is running
   - Verify network connectivity

2. **Stellar Network Errors**
   - Check BLOCKCHAIN_NETWORK environment variable
   - Verify Stellar testnet connectivity
   - Check account funding

3. **JWT Token Errors**
   - Verify ATS and RTS environment variables
   - Check token expiration
   - Ensure proper cookie handling

4. **File Upload Issues**
   - Check file size limits
   - Verify IPFS configuration
   - Check multer configuration

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Run tests with verbose output
node run-tests.js --verbose
```

## 📚 Additional Resources

- [Complete API Documentation](./COMPREHENSIVE_SERVER_DOCUMENTATION.md)
- [Test Cases Documentation](./TEST_CASES.md)
- [Stellar Documentation](https://developers.stellar.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Soul-Society Server** - Blockchain-powered donation platform for NGOs
