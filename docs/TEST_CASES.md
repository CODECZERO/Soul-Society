# Soul-Society Server - Test Cases

## Test Environment Setup

### Prerequisites

- Node.js 18+
- MongoDB (test database)
- Stellar Testnet access
- Test IPFS/Pinata account

### Test Database Configuration

```env
MONGODB_URI=mongodb://localhost:27017/soul-society_test
NODE_ENV=test
```

## Test Categories

### 1. Authentication Tests

#### Test Case 1.1: NGO Registration - Valid Data

**Test ID**: AUTH_001
**Description**: Test successful NGO registration with valid data
**Preconditions**: Clean test database
**Test Data**:

```json
{
  "ngoName": "Test NGO",
  "regNumber": "REG123456",
  "description": "Test NGO description",
  "email": "test@ngo.com",
  "phoneNo": "+1234567890",
  "password": "TestPassword123"
}
```

**Expected Result**:

- Status: 200
- Response contains accessToken, refreshToken, userData
- Stellar account created
- User saved to database

#### Test Case 1.2: NGO Registration - Duplicate Email

**Test ID**: AUTH_002
**Description**: Test registration with existing email
**Preconditions**: User with email "test@ngo.com" exists
**Test Data**: Same as AUTH_001
**Expected Result**:

- Status: 401
- Message: "User already exists"

#### Test Case 1.3: NGO Registration - Missing Fields

**Test ID**: AUTH_003
**Description**: Test registration with missing required fields
**Test Data**:

```json
{
  "ngoName": "Test NGO",
  "email": "test@ngo.com"
}
```

**Expected Result**:

- Status: 400
- Message: "Missing required fields: regNumber, description, phoneNo, password"

#### Test Case 1.4: NGO Login - Valid Credentials

**Test ID**: AUTH_004
**Description**: Test successful login with valid credentials
**Preconditions**: User exists in database
**Test Data**:

```json
{
  "email": "test@ngo.com",
  "password": "TestPassword123"
}
```

**Expected Result**:

- Status: 200
- Response contains accessToken, refreshToken, userData
- Cookies set correctly

#### Test Case 1.5: NGO Login - Invalid Credentials

**Test ID**: AUTH_005
**Description**: Test login with invalid credentials
**Test Data**:

```json
{
  "email": "test@ngo.com",
  "password": "WrongPassword"
}
```

**Expected Result**:

- Status: 500
- Message: "something went wrong while checking"

#### Test Case 1.6: Token Refresh - Valid Refresh Token

**Test ID**: AUTH_006
**Description**: Test token refresh with valid refresh token
**Preconditions**: Valid refresh token exists
**Test Data**:

```json
{
  "refreshToken": "valid-refresh-token"
}
```

**Expected Result**:

- Status: 200
- New accessToken and refreshToken generated
- Cookies updated

#### Test Case 1.7: Token Refresh - Invalid Refresh Token

**Test ID**: AUTH_007
**Description**: Test token refresh with invalid refresh token
**Test Data**:

```json
{
  "refreshToken": "invalid-token"
}
```

**Expected Result**:

- Status: 401
- Message: "Invalid or expired refresh token"

### 2. Post Management Tests

#### Test Case 2.1: Create Post - Valid Data with Authentication

**Test ID**: POST_001
**Description**: Test successful post creation with valid data and authentication
**Preconditions**: Authenticated user, valid IPFS CID
**Headers**: `Authorization: Bearer <valid-access-token>`
**Test Data**:

```json
{
  "Title": "Test Campaign",
  "Type": "Education",
  "Description": "Test campaign description",
  "Location": "Test City",
  "ImgCid": "QmTestHash123",
  "NeedAmount": "1000",
  "WalletAddr": "GTestAddress123"
}
```

**Expected Result**:

- Status: 200
- Post created with NgoRef set
- Response contains post data

#### Test Case 2.2: Create Post - Without Authentication

**Test ID**: POST_002
**Description**: Test post creation without authentication
**Test Data**: Same as POST_001
**Expected Result**:

- Status: 401
- Message: "Access token is required"

#### Test Case 2.3: Create Post - Missing Required Fields

**Test ID**: POST_003
**Description**: Test post creation with missing required fields
**Headers**: `Authorization: Bearer <valid-access-token>`
**Test Data**:

```json
{
  "Title": "Test Campaign",
  "Type": "Education"
}
```

**Expected Result**:

- Status: 400
- Message: "invalid data"

#### Test Case 2.4: Get All Posts - Public Access

**Test ID**: POST_004
**Description**: Test retrieving all posts without authentication
**Expected Result**:

- Status: 200
- Response contains array of posts
- All posts returned

#### Test Case 2.5: Get All Posts - Empty Database

**Test ID**: POST_005
**Description**: Test retrieving posts from empty database
**Preconditions**: Empty posts collection
**Expected Result**:

- Status: 404
- Message: "post data not found"

### 3. Stellar Blockchain Tests

#### Test Case 3.1: Get Wallet Balance - Valid Public Key

**Test ID**: STELLAR_001
**Description**: Test getting wallet balance with valid public key
**Test Data**: `GET /api/stellar/balance/GTestAddress123`
**Expected Result**:

- Status: 200
- Response contains balance information

#### Test Case 3.2: Get Wallet Balance - Invalid Public Key

**Test ID**: STELLAR_002
**Description**: Test getting wallet balance with invalid public key
**Test Data**: `GET /api/stellar/balance/invalid-key`
**Expected Result**:

- Status: 500
- Error in balance retrieval

#### Test Case 3.3: Send Payment - Valid Data

**Test ID**: STELLAR_003
**Description**: Test sending payment with valid data
**Test Data**:

```json
{
  "senderKey": "SValidSecretKey123",
  "receiverKey": "GValidPublicKey123",
  "amount": 100,
  "meta": {
    "cid": "QmTestHash123",
    "prevTxn": "prev-txn-hash"
  }
}
```

**Expected Result**:

- Status: 200
- Payment transaction successful
- Response contains transaction details

#### Test Case 3.4: Send Payment - Insufficient Funds

**Test ID**: STELLAR_004
**Description**: Test sending payment with insufficient funds
**Test Data**:

```json
{
  "senderKey": "SInsufficientFundsKey",
  "receiverKey": "GValidPublicKey123",
  "amount": 1000000,
  "meta": {
    "cid": "QmTestHash123",
    "prevTxn": "prev-txn-hash"
  }
}
```

**Expected Result**:

- Status: 500
- Error: "Payment failed"

#### Test Case 3.5: Verify Transaction - Valid Transaction ID

**Test ID**: STELLAR_005
**Description**: Test verifying valid transaction
**Test Data**: `GET /api/stellar/verify/valid-txn-id`
**Expected Result**:

- Status: 200
- Transaction details returned

#### Test Case 3.6: Verify Transaction - Invalid Transaction ID

**Test ID**: STELLAR_006
**Description**: Test verifying invalid transaction
**Test Data**: `GET /api/stellar/verify/invalid-txn-id`
**Expected Result**:

- Status: 404
- Message: "Transaction not found"

#### Test Case 3.7: Create Stellar Account

**Test ID**: STELLAR_007
**Description**: Test creating new Stellar account
**Expected Result**:

- Status: 200
- New account created with public/private keys

#### Test Case 3.8: Delete Stellar Account

**Test ID**: STELLAR_008
**Description**: Test deleting Stellar account
**Test Data**:

```json
{
  "secret": "SValidSecretKey123",
  "destination": "GValidDestinationKey123"
}
```

**Expected Result**:

- Status: 200
- Account deleted successfully

### 4. Payment Tests

#### Test Case 4.1: Verify Donation - Valid Transaction

**Test ID**: PAYMENT_001
**Description**: Test verifying valid donation transaction
**Test Data**:

```json
{
  "TransactionId": "valid-txn-id",
  "postID": "valid-post-id",
  "Amount": 100
}
```

**Expected Result**:

- Status: 200
- Donation saved to database
- Response contains saved data

#### Test Case 4.2: Verify Donation - Invalid Transaction

**Test ID**: PAYMENT_002
**Description**: Test verifying invalid donation transaction
**Test Data**:

```json
{
  "TransactionId": "invalid-txn-id",
  "postID": "valid-post-id",
  "Amount": 100
}
```

**Expected Result**:

- Status: 401
- Message: "Invalid Transaction"

#### Test Case 4.3: Wallet Pay - Valid Data

**Test ID**: PAYMENT_003
**Description**: Test wallet payment with valid data
**Test Data**:

```json
{
  "PublicKey": "GValidPublicKey123",
  "PostId": "valid-post-id",
  "Amount": 100,
  "Cid": "QmTestHash123"
}
```

**Expected Result**:

- Status: 200
- Payment processed
- Transaction saved

#### Test Case 4.4: Wallet Pay - Invalid Post ID

**Test ID**: PAYMENT_004
**Description**: Test wallet payment with invalid post ID
**Test Data**:

```json
{
  "PublicKey": "GValidPublicKey123",
  "PostId": "invalid-post-id",
  "Amount": 100,
  "Cid": "QmTestHash123"
}
```

**Expected Result**:

- Status: 500
- Error in payment processing

### 5. IPFS Tests

#### Test Case 5.1: Upload File - Valid File

**Test ID**: IPFS_001
**Description**: Test uploading valid file to IPFS
**Test Data**: Multipart form with valid image file
**Expected Result**:

- Status: 200
- File uploaded successfully
- Response contains IPFS hash

#### Test Case 5.2: Upload File - Invalid File Type

**Test ID**: IPFS_002
**Description**: Test uploading invalid file type
**Test Data**: Multipart form with .exe file
**Expected Result**:

- Status: 400
- Error: "Invalid file type"

#### Test Case 5.3: Upload File - File Too Large

**Test ID**: IPFS_003
**Description**: Test uploading file that's too large
**Test Data**: Multipart form with 50MB file
**Expected Result**:

- Status: 400
- Error: "File too large"

### 6. Expense Tests

#### Test Case 6.1: Get Previous Transaction - Valid Post ID

**Test ID**: EXPENSE_001
**Description**: Test getting previous transaction for valid post
**Test Data**: `GET /api/expenses/prev-txn/valid-post-id`
**Expected Result**:

- Status: 200
- Previous transaction data returned

#### Test Case 6.2: Get Previous Transaction - Invalid Post ID

**Test ID**: EXPENSE_002
**Description**: Test getting previous transaction for invalid post
**Test Data**: `GET /api/expenses/prev-txn/invalid-post-id`
**Expected Result**:

- Status: 404
- No previous transaction found

#### Test Case 6.3: Create Transaction Record - Valid Data

**Test ID**: EXPENSE_003
**Description**: Test creating transaction record with valid data
**Test Data**:

```json
{
  "transactionData": "valid-transaction-data",
  "postId": "valid-post-id"
}
```

**Expected Result**:

- Status: 200
- Transaction record created

### 7. Error Handling Tests

#### Test Case 7.1: Invalid JSON Format

**Test ID**: ERROR_001
**Description**: Test handling invalid JSON in request body
**Test Data**: Malformed JSON string
**Expected Result**:

- Status: 400
- Message: "Invalid JSON format in request body"

#### Test Case 7.2: Missing Content-Type Header

**Test ID**: ERROR_002
**Description**: Test handling missing Content-Type header
**Expected Result**:

- Status: 400
- Error in request processing

#### Test Case 7.3: Route Not Found

**Test ID**: ERROR_003
**Description**: Test accessing non-existent route
**Test Data**: `GET /api/nonexistent-route`
**Expected Result**:

- Status: 404
- Message: "Route /api/nonexistent-route not found"

### 8. Security Tests

#### Test Case 8.1: SQL Injection Attempt

**Test ID**: SECURITY_001
**Description**: Test protection against SQL injection
**Test Data**: Malicious input in email field
**Expected Result**:

- Status: 400
- Input properly sanitized

#### Test Case 8.2: XSS Attempt

**Test ID**: SECURITY_002
**Description**: Test protection against XSS attacks
**Test Data**: Script tags in text fields
**Expected Result**:

- Input properly escaped
- No script execution

#### Test Case 8.3: Token Manipulation

**Test ID**: SECURITY_003
**Description**: Test handling of manipulated JWT tokens
**Test Data**: Modified JWT token
**Expected Result**:

- Status: 401
- Message: "Invalid or expired token"

## Test Execution

### Running Tests

```bash
# Install test dependencies
npm install --save-dev jest supertest @types/jest

# Run all tests
npm test

# Run specific test suite
npm test -- --grep "Authentication"

# Run with coverage
npm test -- --coverage
```

### Test Data Setup

```javascript
// Test database setup
beforeAll(async () => {
  await connectDB();
  await clearDatabase();
});

afterAll(async () => {
  await clearDatabase();
  await disconnectDB();
});

// Test user creation
const createTestUser = async () => {
  return await ngoModel.create({
    NgoName: 'Test NGO',
    RegNumber: 'TEST123',
    Description: 'Test Description',
    Email: 'test@ngo.com',
    PhoneNo: '+1234567890',
    Password: 'TestPassword123',
    PublicKey: 'GTestPublicKey123',
    PrivateKey: 'STestPrivateKey123',
  });
};
```

### Mock Services

```javascript
// Mock Stellar service
jest.mock('../services/stellar/transcation.stellar.js', () => ({
  getBalance: jest.fn(),
  sendPaymentToWallet: jest.fn(),
  verfiyTransaction: jest.fn(),
}));

// Mock IPFS service
jest.mock('../services/ipfs(pinata)/ipfs.services.js', () => ({
  uploadOnIpfs: jest.fn(),
}));
```

## Performance Tests

### Load Testing

- **Concurrent Users**: 100
- **Duration**: 5 minutes
- **Endpoints**: All major endpoints
- **Expected Response Time**: < 2 seconds

### Stress Testing

- **Concurrent Users**: 500
- **Duration**: 10 minutes
- **Expected Behavior**: Graceful degradation

## Test Reports

### Coverage Requirements

- **Line Coverage**: > 80%
- **Function Coverage**: > 90%
- **Branch Coverage**: > 75%

### Test Metrics

- **Total Test Cases**: 50+
- **Automated Tests**: 100%
- **Manual Tests**: Critical paths only
- **Test Execution Time**: < 5 minutes

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Test Maintenance

### Regular Updates

- Update test data monthly
- Review test coverage quarterly
- Update test cases with new features
- Maintain test documentation

### Test Data Management

- Use separate test database
- Clean data between test runs
- Use realistic test data
- Avoid hardcoded values
