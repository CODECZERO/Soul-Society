#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Starting AidBridge Smart Contract Deployment...${NC}"

# ─── 1. Setup PATH ───────────────────────────────────────────────────
export PATH="$HOME/.cargo/bin:$PATH"
if [ -f "$HOME/.cargo/env" ]; then
    source "$HOME/.cargo/env"
fi

# ─── 2. Check Rust Toolchain ─────────────────────────────────────────
echo -e "${YELLOW}Checking Rust toolchain...${NC}"
if ! command -v rustup &> /dev/null; then
    echo -e "${YELLOW}rustup not found. Installing...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi
echo -e "${GREEN}✓ rustup is installed$(NC)"

echo -e "${YELLOW}Installing wasm32-unknown-unknown target...${NC}"
rustup target add wasm32-unknown-unknown
echo -e "${YELLOW}Installing wasm32v1-none target (required for newer Stellar SDK)...${NC}"
rustup target add wasm32v1-none

# ─── 3. Check Stellar CLI ────────────────────────────────────────────
if ! command -v stellar &> /dev/null; then
    echo -e "${RED}✗ Stellar CLI not found. Install it from https://developers.stellar.org/docs/tools/developer-tools${NC}"
    echo -e "${YELLOW}  Or run: cargo install --locked stellar-cli${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Stellar CLI: $(stellar --version | head -1)${NC}"

# ─── 4. Configure Testnet ────────────────────────────────────────────
echo -e "${YELLOW}Configuring Testnet...${NC}"
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015" 2>/dev/null || true
echo -e "${GREEN}✓ Testnet configured${NC}"

# ─── 5. Generate & Fund Admin Identity ───────────────────────────────
if ! stellar keys address admin &> /dev/null; then
    echo -e "${YELLOW}Creating admin identity...${NC}"
    stellar keys generate --global admin --network testnet
    echo -e "${GREEN}✓ Admin identity created${NC}"

    # Fund via Friendbot
    ADMIN_ADDR=$(stellar keys address admin)
    echo -e "${YELLOW}Funding admin via Friendbot: ${ADMIN_ADDR}${NC}"
    curl -s "https://friendbot.stellar.org/?addr=${ADMIN_ADDR}" > /dev/null 2>&1 || true
    sleep 3
    echo -e "${GREEN}✓ Admin funded${NC}"
else
    echo -e "${GREEN}✓ Admin identity exists: $(stellar keys address admin)${NC}"
fi

# ─── 6. Build All Contracts ──────────────────────────────────────────
echo -e "${YELLOW}Building all smart contracts...${NC}"
cd smartContract
stellar contract build
cd ..
echo -e "${GREEN}✓ All contracts built${NC}"

# List produced WASM files
echo -e "${CYAN}Produced WASM files:${NC}"
ls -la smartContract/target/wasm32v1-none/release/*.wasm 2>/dev/null || echo "No WASM files found"

# ─── 7. Deploy Seireitei Vault ────────────────────────────────────────
echo -e "${YELLOW}Deploying Seireitei Vault...${NC}"
VAULT_ID=$(stellar contract deploy \
    --wasm smartContract/target/wasm32v1-none/release/seireitei_vault.wasm \
    --source admin \
    --network testnet 2>&1 | tail -n 1)
echo -e "${GREEN}✓ Seireitei Vault: $VAULT_ID${NC}"

# ─── 8. Deploy Mission Registry ──────────────────────────────────────
echo -e "${YELLOW}Deploying Mission Registry...${NC}"
REGISTRY_ID=$(stellar contract deploy \
    --wasm smartContract/target/wasm32v1-none/release/mission_registry.wasm \
    --source admin \
    --network testnet 2>&1 | tail -n 1)
echo -e "${GREEN}✓ Mission Registry: $REGISTRY_ID${NC}"

# ─── 9. Deploy Escrow ────────────────────────────────────────────────
echo -e "${YELLOW}Deploying Escrow...${NC}"
ESCROW_ID=$(stellar contract deploy \
    --wasm smartContract/target/wasm32v1-none/release/escrow.wasm \
    --source admin \
    --network testnet 2>&1 | tail -n 1)
echo -e "${GREEN}✓ Escrow: $ESCROW_ID${NC}"

# ─── 10. Initialize Contracts ────────────────────────────────────────
ADMIN_ADDR=$(stellar keys address admin)

echo -e "${YELLOW}Initializing Seireitei Vault...${NC}"
stellar contract invoke --id $VAULT_ID --network testnet --source admin -- initialize --admin "$ADMIN_ADDR" >/dev/null
echo -e "${GREEN}✓ Vault Initialized${NC}"

echo -e "${YELLOW}Initializing Mission Registry...${NC}"
stellar contract invoke --id $REGISTRY_ID --network testnet --source admin -- initialize --admin "$ADMIN_ADDR" >/dev/null
echo -e "${GREEN}✓ Registry Initialized${NC}"

echo -e "${YELLOW}Initializing Escrow...${NC}"
stellar contract invoke --id $ESCROW_ID --network testnet --source admin -- initialize --admin "$ADMIN_ADDR" >/dev/null
echo -e "${GREEN}✓ Escrow Initialized${NC}"

# ─── 10. Update server/.env ──────────────────────────────────────────
ENV_FILE=server/.env
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Updating server/.env with contract IDs...${NC}"

    # Remove old contract entries (safely)
    sed -i '/^VAULT_CONTRACT_ID=/d' "$ENV_FILE"
    sed -i '/^MISSION_REGISTRY_CONTRACT_ID=/d' "$ENV_FILE"
    sed -i '/^ESCROW_CONTRACT_ID=/d' "$ENV_FILE"
    sed -i '/^CONTRACT_ID=/d' "$ENV_FILE"

    # Add new entries
    echo "CONTRACT_ID=$VAULT_ID" >> "$ENV_FILE"
    echo "VAULT_CONTRACT_ID=$VAULT_ID" >> "$ENV_FILE"
    echo "MISSION_REGISTRY_CONTRACT_ID=$REGISTRY_ID" >> "$ENV_FILE"
    echo "ESCROW_CONTRACT_ID=$ESCROW_ID" >> "$ENV_FILE"

    echo -e "${GREEN}✓ server/.env updated${NC}"
else
    echo -e "${RED}⚠ server/.env not found — creating from template...${NC}"
    echo "CONTRACT_ID=$VAULT_ID" > "$ENV_FILE"
    echo "VAULT_CONTRACT_ID=$VAULT_ID" >> "$ENV_FILE"
    echo "MISSION_REGISTRY_CONTRACT_ID=$REGISTRY_ID" >> "$ENV_FILE"
    echo "ESCROW_CONTRACT_ID=$ESCROW_ID" >> "$ENV_FILE"
fi

# ─── Summary ─────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  Vault:    ${CYAN}$VAULT_ID${NC}"
echo -e "  Registry: ${CYAN}$REGISTRY_ID${NC}"
echo -e "  Escrow:   ${CYAN}$ESCROW_ID${NC}"
echo -e "  Admin:    ${CYAN}$(stellar keys address admin)${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
