# Soul-Society API Documentation - Complete Analysis

## Base URL

```
http://localhost:8000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 🏥 **Health Check**

- **GET** `/health`
- **Description**: Check if the API is running
- **Response**:

```json
{
  "success": true,
  "message": "Soul-Society API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 👤 **User/NGO Management**

### Register User/NGO

- **POST** `/user/signup`
- **Description**: Register a new user or NGO
- **Body**:

```json
{
  "ngoName": "Example NGO",
  "regNumber": "REG123456",
  "description": "Helping communities",
  "email": "ngo@example.com",
  "phoneNo": "+1234567890",
  "passwrod": "securepassword",
  "publicKey": "optional_stellar_public_key",
  "privateKey": "optional_stellar_private_key"
}
```

### Login User/NGO

- **POST** `/user/login`
- **Description**: Login user or NGO
- **Body**:

```json
{
  "email": "ngo@example.com",
  "password": "securepassword"
}
```

### Find User

- **GET** `/user-management/find?email=user@example.com` or `/user-management/find?id=user_id`
- **Description**: Find user by email or ID

### Get User Private Key

- **GET** `/user-management/private-key/:userId`
- **Description**: Get user's private key (admin only)

---

## 📝 **Posts Management**

### Get All Posts

- **GET** `/posts`
- **Description**: Retrieve all posts

### Create Post

- **POST** `/posts`
- **Description**: Create a new post (requires authentication)
- **Body**:

```json
{
  "Title": "Emergency Relief Fund",
  "Type": "Emergency",
  "Description": "Help needed for disaster relief",
  "Location": "City, Country",
  "ImgCid": "ipfs_hash_of_image",
  "NeedAmount": "10000",
  "WalletAddr": "stellar_wallet_address",
  "NgoRef": "ngo_object_id"
}
```

---

## 💰 **Payment Management**

### Verify Donation

- **POST** `/payment/verify-donation`
- **Description**: Verify and save donation transaction
- **Body**:

```json
{
  "TransactionId": "stellar_transaction_id",
  "postID": "post_object_id",
  "Amount": 1000
}
```

### Wallet Payment

- **POST** `/payment/wallet-pay`
- **Description**: Process wallet-to-wallet payment
- **Body**:

```json
{
  "PublicKey": "receiver_stellar_public_key",
  "PostId": "post_object_id",
  "Amount": 1000,
  "Cid": "ipfs_content_id"
}
```

---

## 🎁 **Donation Management**

### Get Specific Donation

- **GET** `/donations/:transactionId`
- **Description**: Get donation by transaction ID

### Get All Donations

- **GET** `/donations`
- **Description**: Retrieve all donations

### Get Donations by Post

- **GET** `/donations/post/:postId`
- **Description**: Get donations related to a specific post

---

## 💸 **Expense Management**

### Get Previous Transaction

- **GET** `/expenses/prev-txn/:postId`
- **Description**: Get previous transaction for a post

### Create Transaction Record

- **POST** `/expenses/create`
- **Description**: Create new transaction record
- **Body**:

```json
{
  "txnData": "transaction_data_object",
  "postId": "post_id"
}
```

---

## 🌐 **IPFS Management**

### Upload File to IPFS

- **POST** `/ipfs/upload`
- **Description**: Upload file to IPFS
- **Content-Type**: `multipart/form-data`
- **Body**: Form data with `file` field
- **Response**: IPFS hash and metadata

---

## ⭐ **Stellar Blockchain**

### Get Wallet Balance

- **GET** `/stellar/balance/:publicKey`
- **Description**: Get Stellar wallet balance

### Send Payment

- **POST** `/stellar/send-payment`
- **Description**: Send payment between wallets
- **Body**:

```json
{
  "senderKey": "sender_private_key",
  "receiverKey": "receiver_public_key",
  "amount": 1000,
  "meta": {
    "cid": "ipfs_content_id",
    "prevTxn": "previous_transaction_id"
  }
}
```

### Verify Transaction

- **GET** `/stellar/verify/:transactionId`
- **Description**: Verify Stellar transaction

### Create Stellar Account

- **POST** `/stellar/create-account`
- **Description**: Create new Stellar account

### Delete Stellar Account

- **DELETE** `/stellar/delete-account`
- **Description**: Delete Stellar account
- **Body**:

```json
{
  "secret": "account_secret_key",
  "destination": "destination_public_key"
}
```

### Save to Smart Contract

- **POST** `/stellar/smart-contract`
- **Description**: Save data to Soroban smart contract
- **Body**:

```json
{
  "privateKey": "sender_private_key",
  "reciverKey": "receiver_public_key",
  "amount": 1000,
  "cid": "ipfs_content_id",
  "prevTxn": "previous_transaction_id",
  "metadata": "optional_metadata"
}
```

---

## 🔧 **Environment Variables Required**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/soul-society

# Server
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Authentication
ATS=your_access_token_secret
RTS=your_refresh_token_secret
ATE=15m
RTE=7d

# IPFS/Pinata
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=your_pinata_gateway_domain

# Stellar Blockchain
BLOCKCHAIN_NETWORK=https://horizon-testnet.stellar.org
BASEACCOUNTST_KEY=your_base_account_secret_key

# Soroban Smart Contract
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
CONTRACTIDF=your_smart_contract_id
```

---

## 🚀 **Setup Instructions**

1. **Install dependencies**:

```bash
npm install
```

2. **Create `.env` file** with the environment variables above

3. **Start development server**:

```bash
npm run dev
```

4. **Build for production**:

```bash
npm run build
npm start
```

---

## 📊 **API Endpoints Summary**

| Method | Endpoint                               | Description               |
| ------ | -------------------------------------- | ------------------------- |
| GET    | `/health`                              | Health check              |
| POST   | `/user/signup`                         | Register user/NGO         |
| POST   | `/user/login`                          | Login user/NGO            |
| GET    | `/user-management/find`                | Find user                 |
| GET    | `/user-management/private-key/:userId` | Get private key           |
| GET    | `/posts`                               | Get all posts             |
| POST   | `/posts`                               | Create post               |
| POST   | `/payment/verify-donation`             | Verify donation           |
| POST   | `/payment/wallet-pay`                  | Wallet payment            |
| GET    | `/donations/:transactionId`            | Get donation              |
| GET    | `/donations`                           | Get all donations         |
| GET    | `/donations/post/:postId`              | Get donations by post     |
| GET    | `/expenses/prev-txn/:postId`           | Get previous transaction  |
| POST   | `/expenses/create`                     | Create transaction record |
| POST   | `/ipfs/upload`                         | Upload to IPFS            |
| GET    | `/stellar/balance/:publicKey`          | Get balance               |
| POST   | `/stellar/send-payment`                | Send payment              |
| GET    | `/stellar/verify/:transactionId`       | Verify transaction        |
| POST   | `/stellar/create-account`              | Create account            |
| DELETE | `/stellar/delete-account`              | Delete account            |
| POST   | `/stellar/smart-contract`              | Save to contract          |

---

## ⚠️ **Important Notes**

- All monetary amounts are in the smallest unit (stroops for Stellar)
- File uploads are limited to 10MB
- Images must be JPEG, PNG, GIF, or WebP format
- CORS is configured for the frontend URL
- All routes are prefixed with `/api`
- Smart contract operations require Soroban setup
- Private key operations should be admin-protected
