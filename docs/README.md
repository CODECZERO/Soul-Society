# Soul-Society Documentation

Welcome to the Soul-Society documentation! This folder contains comprehensive guides for both backend and frontend development.

## 📚 Documentation Index

### Core Documentation

1. **[Environment Setup (Frontend & Server)](./ENV_SETUP.md)**
   - Copy `.env.example` to `.env` / `.env.local`
   - Required variables for server and frontend
   - Security notes

2. **[Backend API Documentation](./BACKEND_API.md)**
   - Complete API reference
   - Authentication & authorization
   - Data models & schemas
   - Stellar & IPFS integration
   - Error handling

3. **[Frontend Guide](./FRONTEND_GUIDE.md)**
   - Tech stack & architecture
   - Component documentation
   - State management (Redux)
   - User & NGO flows
   - Stellar wallet integration

### Feature-Specific Guides

4. **[NGO Dashboard Guide](./NGO_DASHBOARD_GUIDE.md)**
   - Create posts/tasks
   - Send payments to wallets
   - Upload proofs
   - Complete workflows

5. **[Backend-Frontend Data Flow](./BACKEND_FRONTEND_DATA_FLOW.md)**
   - Complete data flow diagrams
   - API request/response formats
   - Database field mappings

### Bug Fixes & Solutions

6. **[Amount & Wallet Address Fix](./AMOUNT_WALLET_FIX.md)**
   - Stellar amount formatting (7 decimals)
   - Wallet address integration

7. **[Wallet Address Missing Fix](./WALLET_ADDR_MISSING_FIX.md)**
   - Task object wallet address issue
   - Data flow corrections

8. **[Memo Length Fix](./MEMO_LENGTH_FIX.md)**
   - Stellar memo 28-byte limit
   - Solution implementation

9. **[Network Error Fix](./NETWORK_ERROR_FIX.md)**
   - CORS configuration
   - Environment variables
   - Frontend-backend connection

10. **[Duplication Error Fix](./DUPLICATION_ERROR_FIX.md)**
   - MongoDB unique constraint
   - Idempotent API design
   - Duplicate prevention

11. **[Memo vs Backend Data](./MEMO_VS_BACKEND_DATA.md)**
    - Why data is sent via API, not Stellar memo
    - Best practices explanation

---

## 🚀 Quick Start

### Backend Setup

```bash
cd server
npm install
npm run dev
```

**Server runs on:** `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

**Frontend runs on:** `http://localhost:3000`

---

## 📖 Reading Guide

### For Backend Developers
1. Start with [Backend API Documentation](./BACKEND_API.md)
2. Review [Backend-Frontend Data Flow](./BACKEND_FRONTEND_DATA_FLOW.md)
3. Check bug fix docs for common issues

### For Frontend Developers
1. Start with [Frontend Guide](./FRONTEND_GUIDE.md)
2. Review [NGO Dashboard Guide](./NGO_DASHBOARD_GUIDE.md)
3. Check bug fix docs for Stellar integration issues

### For Full-Stack Understanding
1. Read both [Backend API](./BACKEND_API.md) and [Frontend Guide](./FRONTEND_GUIDE.md)
2. Study [Backend-Frontend Data Flow](./BACKEND_FRONTEND_DATA_FLOW.md)
3. Review all bug fix documentation

---

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────┐
│   User/NGO      │
│   (Browser)     │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   Port: 3000    │
└────────┬────────┘
         │
         │ REST API
         ▼
┌─────────────────┐
│   Backend       │
│   (Express)     │
│   Port: 8000    │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
    ▼         ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌──────┐
│MongoDB │ │Stellar│ │  IPFS  │ │ JWT  │
│Database│ │Network│ │(Pinata)│ │ Auth │
└────────┘ └──────┘ └────────┘ └──────┘
```

### Data Flow

```
User Donation:
Frontend → Stellar Network → Backend → MongoDB

NGO Payment:
Frontend → Backend → Stellar Network → MongoDB
                  ↓
                IPFS (Receipt)
```

---

## 🔑 Key Technologies

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Stellar SDK** - Blockchain integration
- **Pinata** - IPFS storage
- **JWT** - Authentication

### Frontend
- **Next.js 16** - React framework
- **Redux Toolkit** - State management
- **Stellar SDK** - Blockchain
- **Freighter** - Wallet integration
- **TailwindCSS** - Styling

---

## 📊 API Endpoints Summary

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post (NGO auth required)

### Donations
- `POST /api/payment/verify-donation` - Verify & save donation
- `GET /api/donations` - Get all donations
- `GET /api/donations/post/:postId` - Get donations by post

### Payments
- `POST /api/payment/wallet-pay` - NGO send payment (auth required)

### Expenses
- `GET /api/expenses/prev-txn/:postId` - Get expenses by post

### Stellar
- `GET /api/stellar/balance/:publicKey` - Get wallet balance

### IPFS
- `POST /api/ipfs/upload` - Upload file to IPFS

---

## 🐛 Common Issues & Solutions

| Issue | Solution | Documentation |
|-------|----------|---------------|
| Amount format error | Use `.toFixed(7)` | [Amount Fix](./AMOUNT_WALLET_FIX.md) |
| Wallet address missing | Include `WalletAddr` in task object | [Wallet Fix](./WALLET_ADDR_MISSING_FIX.md) |
| Memo too long | Keep memo under 28 bytes | [Memo Fix](./MEMO_LENGTH_FIX.md) |
| Network error | Check CORS & `.env.local` | [Network Fix](./NETWORK_ERROR_FIX.md) |
| Duplicate donation | Backend checks existing | [Duplication Fix](./DUPLICATION_ERROR_FIX.md) |

---

## 🧪 Testing

### Backend Testing
```bash
# Test API endpoints
curl http://localhost:8000/api/posts

# Test Stellar balance
curl http://localhost:8000/api/stellar/balance/GABC...
```

### Frontend Testing
1. Connect Freighter wallet
2. Browse tasks at `/explore`
3. Make a donation
4. Check transaction on Stellar Expert

### NGO Testing
1. Login at `/ngo/login`
2. Create task at `/ngo-dashboard`
3. Send payment from task
4. Verify on Stellar network

---

## 📝 Contributing

When adding new features:
1. Update relevant documentation
2. Add API endpoints to [Backend API](./BACKEND_API.md)
3. Add components to [Frontend Guide](./FRONTEND_GUIDE.md)
4. Document data flow in [Data Flow](./BACKEND_FRONTEND_DATA_FLOW.md)

---

## 🔗 External Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Freighter Wallet](https://www.freighter.app/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Pinata IPFS](https://www.pinata.cloud/)

---

## 📞 Support

For issues or questions:
1. Check the relevant documentation
2. Review bug fix guides
3. Check API endpoints in [Backend API](./BACKEND_API.md)
4. Review component usage in [Frontend Guide](./FRONTEND_GUIDE.md)

---

## ✅ Documentation Checklist

- [x] Backend API complete
- [x] Frontend guide complete
- [x] NGO dashboard documented
- [x] Data flow diagrams
- [x] Bug fixes documented
- [x] Common issues covered
- [x] Testing guides included
- [x] Architecture overview

**All documentation is complete and ready to use!** 🎉
