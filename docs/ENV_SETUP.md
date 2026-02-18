# Environment Setup (Frontend & Server)

This guide explains how to configure environment variables for the Soul-Society frontend and server.

## Quick setup

1. **Server:** Copy `server/.env.example` to `server/.env` and replace placeholders (JWT secrets, Pinata JWT, contract IDs after deployment).
2. **Frontend:** Copy `frontend/.env.example` to `frontend/.env.local` and set `NEXT_PUBLIC_API_URL` to your API base URL (e.g. `http://localhost:8000/api` for local dev).

## Server (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `8000` |
| `FRONTEND_URL` | Allowed CORS origins (comma-separated) | `http://localhost:3000,http://127.0.0.1:3000` |
| `ATS` | JWT access token secret | Strong random string |
| `RTS` | JWT refresh token secret | Strong random string |
| `ATE` / `RTE` | Token expiry | `15m` / `7d` |
| `BLOCKCHAIN_NETWORK` | Stellar Horizon URL | `https://horizon-testnet.stellar.org` |
| `SOROBAN_RPC_URL` | Soroban RPC | `https://soroban-testnet.stellar.org` |
| `STACK_ADMIN_SECRET` | Stellar secret key for contract ops (testnet) | `S...` |
| `PINATA_JWT` | Pinata API JWT for IPFS | From Pinata dashboard |
| `PINATA_GATEWAY` | IPFS gateway domain | `gateway.pinata.cloud` |
| `CONTRACT_ID` / `VAULT_CONTRACT_ID` | Vault contract ID | Set by `./deploy_contract.sh` |
| `MISSION_REGISTRY_CONTRACT_ID` … | Other contract IDs | Set by deploy script |

After running `./deploy_contract.sh` from the repo root, contract IDs are written into `server/.env` automatically.

## Frontend (`.env.local`)

All frontend env vars must be prefixed with `NEXT_PUBLIC_` to be available in the browser.

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (including `/api`) | `http://localhost:8000/api` or your Render URL |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `TESTNET` or `MAINNET` | `TESTNET` |
| `NEXT_PUBLIC_HORIZON_URL` | Stellar Horizon | `https://horizon-testnet.stellar.org` |
| `NEXT_PUBLIC_PINATA_GATEWAY` | IPFS gateway for images | `https://gateway.pinata.cloud` |
| `NEXT_PUBLIC_VAULT_CONTRACT_ID` etc. | Contract IDs (optional for some features) | Same as server after deploy |
| `NEXT_PUBLIC_APP_NAME` | App title | `Soul Society Registry` |

For local development, set `NEXT_PUBLIC_API_URL=http://localhost:8000/api` and ensure the server is running on port 8000.

## Security notes

- Never commit `.env` or `.env.local` (they are in `.gitignore`).
- Use strong, unique values for `ATS` and `RTS` in production.
- Keep `STACK_ADMIN_SECRET` and Pinata JWT private; use testnet keys only in dev.
