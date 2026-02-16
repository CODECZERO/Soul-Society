# Soul-Society API Documentation

## Base URL

```
http://localhost:8000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Health Check

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

## User/NGO Management

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

- **Response**: User data with tokens

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

- **Response**: User data with access and refresh tokens

---

## Posts Management

### Get All Posts

- **GET** `/posts`
- **Description**: Retrieve all posts
- **Response**: Array of post objects

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

- **Response**: Created post data

---

## Payment Management

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

- **Response**: Saved donation data

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

- **Response**: Transaction data

---

## IPFS Management

### Upload File to IPFS

- **POST** `/ipfs/upload`
- **Description**: Upload file to IPFS
- **Content-Type**: `multipart/form-data`
- **Body**: Form data with `file` field
- **Response**: IPFS hash and metadata

---

## Stellar Blockchain

### Get Wallet Balance

- **GET** `/stellar/balance/:address`
- **Description**: Get Stellar wallet balance
- **Parameters**:
  - `address`: Stellar wallet address
- **Response**: Balance information

### Create Stellar Account

- **POST** `/stellar/create-account`
- **Description**: Create new Stellar account
- **Response**: Account details

### Transfer Funds

- **POST** `/stellar/transfer`
- **Description**: Transfer funds between wallets
- **Body**:

```json
{
  "from": "sender_wallet_address",
  "to": "receiver_wallet_address",
  "amount": 1000,
  "memo": "optional_memo"
}
```

- **Response**: Transaction details

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid data"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Invalid Transaction"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "post data not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Something went wrong!"
}
```

---

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file with required environment variables:

```env
MONGODB_URI=mongodb://localhost:27017/soul-society
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

3. Start development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
npm start
```

---

## Notes

- All monetary amounts are in the smallest unit (e.g., stroops for Stellar)
- File uploads are limited to 10MB
- Images must be in JPEG, PNG, GIF, or WebP format
- CORS is configured for the frontend URL
- All routes are prefixed with `/api`
