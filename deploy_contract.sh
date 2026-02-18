#!/bin/bash
# AidBridge Smart Contract Deployment
# Deploys all contracts used by the server (see server/.env.example and server/src/services/stellar/*.service.ts).
# Contracts: seireitei-vault, mission-registry, escrow, reiatsu-token, soul-badge, treasury, soul-reaper-registry, notifications.
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${YELLOW}🚀 AidBridge Smart Contract Deployment${NC}"

# ─── 1. Setup PATH ───────────────────────────────────────────────────
export PATH="$HOME/.cargo/bin:$PATH"
[ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"

# ─── 2. Rust toolchain ───────────────────────────────────────────────
echo -e "${YELLOW}Checking Rust...${NC}"
if ! command -v rustup &> /dev/null; then
    echo -e "${YELLOW}Installing rustup...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi
echo -e "${GREEN}✓ rustup installed${NC}"
# Ensure a default toolchain so cargo can run (e.g. in CI or fresh install)
if ! cargo --version &>/dev/null; then
    echo -e "${YELLOW}Setting default Rust toolchain...${NC}"
    rustup default stable
fi
rustup target add wasm32-unknown-unknown 2>/dev/null || true
rustup target add wasm32v1-none 2>/dev/null || true

# ─── 3. Stellar CLI ──────────────────────────────────────────────────
if ! command -v stellar &> /dev/null; then
    echo -e "${RED}✗ Stellar CLI not found. Install: https://developers.stellar.org/docs/tools/developer-tools${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Stellar CLI: $(stellar --version | head -1)${NC}"

# ─── 4. Testnet config ───────────────────────────────────────────────
echo -e "${YELLOW}Configuring testnet...${NC}"
stellar network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015" 2>/dev/null || true
echo -e "${GREEN}✓ Testnet configured${NC}"

# ─── 5. Admin identity ───────────────────────────────────────────────
if ! stellar keys address admin &> /dev/null; then
    echo -e "${YELLOW}Creating admin identity...${NC}"
    stellar keys generate --global admin --network testnet
    ADMIN_ADDR=$(stellar keys address admin)
    echo -e "${YELLOW}Funding admin: ${ADMIN_ADDR}${NC}"
    curl -s "https://friendbot.stellar.org/?addr=${ADMIN_ADDR}" > /dev/null 2>&1 || true
    sleep 3
    echo -e "${GREEN}✓ Admin funded${NC}"
else
    echo -e "${GREEN}✓ Admin exists: $(stellar keys address admin)${NC}"
fi
ADMIN_ADDR=$(stellar keys address admin)

# ─── 6. Build all contracts ───────────────────────────────────────────
echo -e "${YELLOW}Building contracts...${NC}"
cd smartContract
stellar contract build
cd ..
echo -e "${GREEN}✓ Build done${NC}"
RELEASE_DIR="smartContract/target/wasm32v1-none/release"
ls -la "$RELEASE_DIR"/*.wasm 2>/dev/null || echo -e "${YELLOW}No WASM in wasm32v1-none; check smartContract/target/...${NC}"

# Fallback: some setups output to wasm32-unknown-unknown
if [ ! -f "$RELEASE_DIR/seireitei_vault.wasm" ] && [ -d "smartContract/target/wasm32-unknown-unknown/release" ]; then
    RELEASE_DIR="smartContract/target/wasm32-unknown-unknown/release"
fi

# ─── 7. Deploy each contract ─────────────────────────────────────────
deploy() {
    local name=$1
    local wasm=$2
    if [ ! -f "$wasm" ]; then
        echo -e "${RED}✗ $wasm not found${NC}" >&2
        return 1
    fi
    echo -e "${YELLOW}Deploying $name...${NC}" >&2
    local id
    id=$(stellar contract deploy --wasm "$wasm" --source admin --network testnet 2>&1 | tail -n 1)
    echo "$id"
}

VAULT_ID=$(deploy "Seireitei Vault" "$RELEASE_DIR/seireitei_vault.wasm")
REGISTRY_ID=$(deploy "Mission Registry" "$RELEASE_DIR/mission_registry.wasm")
ESCROW_ID=$(deploy "Escrow" "$RELEASE_DIR/escrow.wasm")
REIATSU_ID=$(deploy "Reiatsu Token" "$RELEASE_DIR/reiatsu_token.wasm")
SOUL_BADGE_ID=$(deploy "Soul Badge" "$RELEASE_DIR/soul_badge.wasm")
TREASURY_ID=$(deploy "Treasury" "$RELEASE_DIR/division_treasury.wasm")
SOUL_REAPER_ID=$(deploy "Soul Reaper Registry" "$RELEASE_DIR/soul_reaper_registry.wasm")
NOTIFICATIONS_ID=$(deploy "Notifications" "$RELEASE_DIR/notifications.wasm")

# ─── 8. Initialize contracts ──────────────────────────────────────────
echo -e "${YELLOW}Initializing contracts...${NC}"
stellar contract invoke --id "$VAULT_ID" --network testnet --source admin -- initialize --admin "$ADMIN_ADDR" >/dev/null
echo -e "${GREEN}✓ Vault${NC}"
stellar contract invoke --id "$REGISTRY_ID" --network testnet --source admin -- initialize --admin "$ADMIN_ADDR" >/dev/null
echo -e "${GREEN}✓ Mission Registry${NC}"
stellar contract invoke --id "$ESCROW_ID" --network testnet --source admin -- initialize --admin "$ADMIN_ADDR" >/dev/null
echo -e "${GREEN}✓ Escrow${NC}"
stellar contract invoke --id "$REIATSU_ID" --network testnet --source admin -- initialize --admin "$ADMIN_ADDR" >/dev/null
echo -e "${GREEN}✓ Reiatsu Token${NC}"
stellar contract invoke --id "$SOUL_BADGE_ID" --network testnet --source admin -- initialize --admin "$ADMIN_ADDR" >/dev/null
echo -e "${GREEN}✓ Soul Badge${NC}"
# Treasury: initialize(admin, multi_sig_threshold, required_approvals). Use 2 and 2.
stellar contract invoke --id "$TREASURY_ID" --network testnet --source admin -- initialize --admin "$ADMIN_ADDR" --multi_sig_threshold 2 --required_approvals 2 >/dev/null
echo -e "${GREEN}✓ Treasury${NC}"
stellar contract invoke --id "$SOUL_REAPER_ID" --network testnet --source admin -- initialize --admin "$ADMIN_ADDR" >/dev/null
echo -e "${GREEN}✓ Soul Reaper Registry${NC}"
stellar contract invoke --id "$NOTIFICATIONS_ID" --network testnet --source admin -- initialize >/dev/null
echo -e "${GREEN}✓ Notifications${NC}"

# ─── 9. Update server/.env ───────────────────────────────────────────
ENV_FILE=server/.env
CONTRACT_VARS="CONTRACT_ID VAULT_CONTRACT_ID MISSION_REGISTRY_CONTRACT_ID ESCROW_CONTRACT_ID REIATSU_TOKEN_CONTRACT_ID SOUL_BADGE_CONTRACT_ID TREASURY_CONTRACT_ID SOUL_REAPER_REGISTRY_CONTRACT_ID NOTIFICATIONS_CONTRACT_ID"
if [ -f "$ENV_FILE" ]; then
    for var in $CONTRACT_VARS; do
        grep -v "^${var}=" "$ENV_FILE" > "${ENV_FILE}.tmp" && mv "${ENV_FILE}.tmp" "$ENV_FILE"
    done
fi
{
    echo "CONTRACT_ID=$VAULT_ID"
    echo "VAULT_CONTRACT_ID=$VAULT_ID"
    echo "MISSION_REGISTRY_CONTRACT_ID=$REGISTRY_ID"
    echo "ESCROW_CONTRACT_ID=$ESCROW_ID"
    echo "REIATSU_TOKEN_CONTRACT_ID=$REIATSU_ID"
    echo "SOUL_BADGE_CONTRACT_ID=$SOUL_BADGE_ID"
    echo "TREASURY_CONTRACT_ID=$TREASURY_ID"
    echo "SOUL_REAPER_REGISTRY_CONTRACT_ID=$SOUL_REAPER_ID"
    echo "NOTIFICATIONS_CONTRACT_ID=$NOTIFICATIONS_ID"
} >> "$ENV_FILE"
echo -e "${GREEN}✓ server/.env updated${NC}"

# ─── Summary ─────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}🎉 Deployment complete${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  Vault:              ${CYAN}$VAULT_ID${NC}"
echo -e "  Mission Registry:   ${CYAN}$REGISTRY_ID${NC}"
echo -e "  Escrow:             ${CYAN}$ESCROW_ID${NC}"
echo -e "  Reiatsu Token:      ${CYAN}$REIATSU_ID${NC}"
echo -e "  Soul Badge:         ${CYAN}$SOUL_BADGE_ID${NC}"
echo -e "  Treasury:           ${CYAN}$TREASURY_ID${NC}"
echo -e "  Soul Reaper Reg.:   ${CYAN}$SOUL_REAPER_ID${NC}"
echo -e "  Notifications:      ${CYAN}$NOTIFICATIONS_ID${NC}"
echo -e "  Admin:              ${CYAN}$ADMIN_ADDR${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
