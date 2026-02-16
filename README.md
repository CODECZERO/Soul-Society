<div align="center">
  <h1 align="center">✨ Soul-Society</h1>
  <p align="center">Revolutionizing Aid Distribution with Blockchain Technology</p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Stellar](https://img.shields.io/badge/Stellar-7D00FF?logo=stellar&logoColor=white)](https://stellar.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![Soroban](https://img.shields.io/badge/Soroban-Testnet-blue)](https://soroban.stellar.org/)
  [![CI/CD](https://github.com/yourusername/soul-society/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/soul-society/actions)

  <img src="public/home_page_soul_society.png" alt="Soul-Society Dashboard" width="100%" />
</div>

---

## 📖 Documentation

Detailed documentation has been moved to the `docs/` directory:

- [📚 API Documentation](docs/API_DOCUMENTATION.md)
- [🧩 Smart Contracts](docs/SMART_CONTRACT_README.md)
- [💰 Payment Flow Guide](docs/PAYMENT_FLOW_GUIDE.md)
- [🔒 Seireitei Vault](docs/VAULT.md)
- [🛠 Backend Server Guide](docs/SERVER_README.md)

---

## 🏗 System Architecture

Soul-Society uses a hybrid architecture combining a high-performance Next.js frontend, an Express.js backend for off-chain coordination, and a suite of Soroban smart contracts for trustless execution.

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        UI[React Components] --> Redux[Redux Store]
        UI --> Wallet[Stellar Wallet SDK]
    end
    subgraph "Backend (Express)"
        API[REST API] --> Auth[JWT Auth]
        API --> Vault[SeireiteiVault Service]
        API --> Escrow[Escrow Service]
        API --> Community[Community Service]
    end
    subgraph "Blockchain (Stellar/Soroban)"
        SV[Seireitei Vault]
        MR[Mission Registry]
        RT[Reiatsu Token]
        SB[Soul Badge]
        SR[Soul Reaper Registry]
        TR[Treasury]
        ES[Escrow Contract]
    end
    subgraph "Storage"
        IPFS[Pinata/IPFS]
    end
    UI --> API
    Vault --> SV
    Escrow --> ES
    API --> IPFS
```

---

## 🛡️ Escrow & Governance ("Lock, Do Work, Get Paid")

The core of Soul-Society is the **Trustless Escrow System** designed to prevent charity fraud.

### How it Works
1. **Donation**: Donor contributes to a task. 50% goes to NGO immediately; 50% is **locked in escrow**.
2. **Proof**: NGO submits proof-of-work (photos/videos) to IPFS.
3. **Verification**: Community members vote on the authenticity of the proof.
4. **Outcome**:
   - ✅ **Verified**: Locked funds released to NGO. Voters earn **Soul Badges** and **Reiatsu Tokens**.
   - ❌ **Scam**: Funds remain locked for 30 days, then **refunded to donor**.

```mermaid
sequenceDiagram
    Donor->>Server: Donate to verification task
    Server->>Escrow Contract: create_escrow(50% locked)
    Server->>NGO: Send 50% immediately
    NGO->>Server: Submit proof of work
    Server->>Community: Notify for verification
    Community->>Server: Vote (real/scam)
    alt Verified Real (>60% real votes)
        Server->>Escrow Contract: release_escrow()
        Escrow Contract->>NGO: Release locked 50%
        Server->>Soul Badge: mint_badge (to accurate voters)
    else Disputed as Scam (>60% scam votes)
        Server->>Escrow Contract: dispute_escrow()
        Note over Escrow Contract: 30-day lock period
        Escrow Contract->>Donor: refund_escrow()
        Server->>Reiatsu Token: mint (reward to detectors)
    end
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- Cargo & Rust (for contracts)
- Docker (optional)

### Quick Start (Docker)
```bash
docker-compose up --build
```
This starts:
- Frontend: http://localhost:3000
- Server: http://localhost:8000

### Manual Setup

#### 1. Smart Contracts
```bash
cd smartContract
cargo test  # Verify all 42 tests pass
```

#### 2. Server
```bash
cd server
npm install
npm run dev
```

#### 3. Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

---

## 🏆 Stellar Journey to Mastery
**Current Status: Green Belt (Level 4) Completed** ✅

- [x] **Contracts**: Inter-contract calls (Escrow ↔ Token ↔ Badge)
- [x] **Tokens**: Custom Reiatsu Token (RA) with staking & vesting
- [x] **Real-time**: Advanced event streaming (Seireitei Alert System)
- [x] **DevOps**: Full CI/CD pipeline with GitHub Actions
- [x] **Design**: Mobile responsive "Bleach" aesthetic

---

## 🤝 Contributing
We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
