#!/bin/bash

# ============================================================================
# Flip It - One-Click Deployment Script
# Hackathon Edition - Free Tier
# ============================================================================
# This script automates the entire Arcium deployment process
# Just run: ./hackathon-deploy.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROGRAM_NAME="flip_it"
NETWORK="devnet"
ARCIUM_CLUSTER_OFFSET=456
HELIUS_RPC_URL="https://devnet.helius-rpc.com/?api-key=0e89ca71-766d-40cc-9628-5d709af0f2cc"
PROJECT_DIR="house.fun/programs/flip-it"

# Print banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         FLIP IT - ARCIUM DEPLOYMENT SCRIPT               ║"
echo "║              Hackathon Edition (Free Tier)               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================================================
# STEP 1: CHECK PREREQUISITES
# ============================================================================

echo ""
echo -e "${BLUE}STEP 1: Checking Prerequisites${NC}"
echo "================================"

# Check OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    print_error "Windows detected! This script requires WSL2 (Windows Subsystem for Linux)"
    print_error "Please run this script in WSL2: https://learn.microsoft.com/en-us/windows/wsl/install"
    exit 1
fi

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_success "Linux detected"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    print_success "macOS detected"
else
    print_warning "Unknown OS: $OSTYPE"
    print_warning "This script is designed for Linux/macOS"
fi

# Check if in correct directory
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    print_error "Please run this script from the repository root"
    exit 1
fi

print_success "Project directory found"

# Check wallet
if [ ! -f "$HOME/.config/solana/id.json" ]; then
    print_error "Solana wallet not found at ~/.config/solana/id.json"
    print_error "Please create a wallet first:"
    print_error "  solana-keygen new"
    exit 1
fi

WALLET_ADDRESS=$(solana address 2>/dev/null || echo "")
if [ -z "$WALLET_ADDRESS" ]; then
    print_error "Cannot read wallet address"
    exit 1
fi

print_success "Wallet found: $WALLET_ADDRESS"

# ============================================================================
# STEP 2: INSTALL DEPENDENCIES
# ============================================================================

echo ""
echo -e "${BLUE}STEP 2: Installing Dependencies${NC}"
echo "================================="

# Install Solana CLI
if command_exists solana; then
    SOLANA_VERSION=$(solana --version)
    print_success "Solana CLI already installed: $SOLANA_VERSION"
else
    print_status "Installing Solana CLI..."
    sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    print_success "Solana CLI installed"
fi

# Install Rust (if not present)
if command_exists rustc; then
    RUST_VERSION=$(rustc --version)
    print_success "Rust already installed: $RUST_VERSION"
else
    print_status "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    print_success "Rust installed"
fi

# Install Anchor
if command_exists anchor; then
    ANCHOR_VERSION=$(anchor --version)
    print_success "Anchor already installed: $ANCHOR_VERSION"
else
    print_status "Installing Anchor..."
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
    export PATH="$HOME/.cargo/bin:$PATH"
    print_success "Anchor installed"
fi

# Install Arcium CLI
if command_exists arcium; then
    ARCIUM_VERSION=$(arcium --version)
    print_success "Arcium CLI already installed: $ARCIUM_VERSION"
else
    print_status "Installing Arcium CLI..."
    curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash
    export PATH="$HOME/.arcium/bin:$PATH"
    print_success "Arcium CLI installed"
fi

# Ensure PATH is updated
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$HOME/.arcium/bin:$PATH"

# ============================================================================
# STEP 3: CHECK BALANCE
# ============================================================================

echo ""
echo -e "${BLUE}STEP 3: Checking Wallet Balance${NC}"
echo "================================="

# Configure Solana for devnet
solana config set --url devnet

# Get balance
BALANCE=$(solana balance 2>/dev/null || echo "0")
print_status "Current balance: $BALANCE"

# Extract numeric value
BALANCE_NUM=$(echo "$BALANCE" | grep -oE '^[0-9.]+' || echo "0")

# Check if balance is sufficient
if (( $(echo "$BALANCE_NUM < 2" | bc -l) )); then
    print_warning "Low balance detected: $BALANCE SOL"
    print_warning "You need at least 2 SOL for deployment"
    print_warning ""
    print_warning "Get free devnet SOL from:"
    print_warning "  1. https://faucet.solana.com/"
    print_warning "  2. Run: solana airdrop 2 $WALLET_ADDRESS"
    print_warning ""
    
    read -p "Would you like to request an airdrop now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Requesting airdrop..."
        solana airdrop 2 || print_warning "Airdrop failed. Please use the web faucet."
        BALANCE=$(solana balance)
        print_status "New balance: $BALANCE"
    fi
fi

# ============================================================================
# STEP 4: BUILD PROJECT
# ============================================================================

echo ""
echo -e "${BLUE}STEP 4: Building Project${NC}"
echo "========================"

cd "$PROJECT_DIR"

# Generate program keypair if not exists
mkdir -p target/deploy
if [ ! -f "target/deploy/${PROGRAM_NAME}-keypair.json" ]; then
    print_status "Generating program keypair..."
    solana-keygen new -o "target/deploy/${PROGRAM_NAME}-keypair.json" --no-passphrase --force
fi

PROGRAM_ID=$(solana-keygen pubkey "target/deploy/${PROGRAM_NAME}-keypair.json")
print_success "Program ID: $PROGRAM_ID"

# Update program ID in source files
print_status "Syncing program ID..."
sed -i.bak "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/g" programs/flip-it/src/lib.rs
sed -i.bak "s/flip_it = \".*\"/flip_it = \"$PROGRAM_ID\"/g" Anchor.toml
rm -f programs/flip-it/src/lib.rs.bak Anchor.toml.bak

# Build Arcis circuits
print_status "Building Arcis circuits..."
arcium build

print_success "Build complete!"

# ============================================================================
# STEP 5: DEPLOY
# ============================================================================

echo ""
echo -e "${BLUE}STEP 5: Deploying to Devnet${NC}"
echo "==========================="

print_status "Deploying program..."
print_status "Program ID: $PROGRAM_ID"
print_status "Cluster Offset: $ARCIUM_CLUSTER_OFFSET"
print_status "RPC: Helius (Free Tier)"

# Deploy with Arcium
if arcium deploy \
    --cluster-offset $ARCIUM_CLUSTER_OFFSET \
    --recovery-set-size 4 \
    --keypair-path "$HOME/.config/solana/id.json" \
    --rpc-url "$HELIUS_RPC_URL"; then
    print_success "Deployment successful!"
else
    print_warning "Deployment command finished with warnings"
    print_warning "Checking if program already exists..."
    
    if solana program show "$PROGRAM_ID" --url devnet >/dev/null 2>&1; then
        print_success "Program already deployed!"
    else
        print_error "Deployment failed"
        exit 1
    fi
fi

# ============================================================================
# STEP 6: INITIALIZE COMPUTATION DEFINITION
# ============================================================================

echo ""
echo -e "${BLUE}STEP 6: Initializing Computation Definition${NC}"
echo "============================================"

print_status "Initializing Arcium computation definition..."

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status "Installing npm dependencies..."
    npm install
fi

# Run initialization
if npx ts-node scripts/init-comp-def.ts 2>/dev/null; then
    print_success "Computation definition initialized!"
else
    print_warning "Initialization may have already been done or failed"
    print_warning "This is OK - you can test the program anyway"
fi

# ============================================================================
# STEP 7: VERIFY DEPLOYMENT
# ============================================================================

echo ""
echo -e "${BLUE}STEP 7: Verifying Deployment${NC}"
echo "============================"

print_status "Checking program on devnet..."
if solana program show "$PROGRAM_ID" --url devnet; then
    print_success "Program verified!"
else
    print_warning "Could not verify program status"
fi

# ============================================================================
# STEP 8: UPDATE FRONTEND
# ============================================================================

echo ""
echo -e "${BLUE}STEP 8: Updating Frontend${NC}"
echo "========================="

# Check if IDL exists
if [ -f "target/idl/${PROGRAM_NAME}.json" ]; then
    print_status "IDL found at target/idl/${PROGRAM_NAME}.json"
    
    # Copy to frontend
    FRONTEND_IDL_PATH="../../house-fun-app/src/lib/anchor/idl.ts"
    if [ -d "../../house-fun-app" ]; then
        print_status "Copying IDL to frontend..."
        cp "target/idl/${PROGRAM_NAME}.json" "$FRONTEND_IDL_PATH"
        print_success "IDL copied!"
    else
        print_warning "Frontend directory not found at expected location"
        print_warning "Please manually copy: target/idl/${PROGRAM_NAME}.json"
    fi
else
    print_warning "IDL not found"
fi

# Update .env.local
ENV_FILE="../../house-fun-app/.env.local"
if [ -f "$ENV_FILE" ]; then
    print_status "Updating .env.local..."
    
    # Check if variable already exists
    if grep -q "NEXT_PUBLIC_FLIP_IT_PROGRAM_ID" "$ENV_FILE"; then
        # Update existing
        sed -i.bak "s/NEXT_PUBLIC_FLIP_IT_PROGRAM_ID=.*/NEXT_PUBLIC_FLIP_IT_PROGRAM_ID=$PROGRAM_ID/g" "$ENV_FILE"
        rm -f "$ENV_FILE.bak"
    else
        # Add new
        echo "NEXT_PUBLIC_FLIP_IT_PROGRAM_ID=$PROGRAM_ID" >> "$ENV_FILE"
    fi
    
    print_success ".env.local updated!"
else
    print_warning ".env.local not found"
    print_warning "Please create it with:"
    print_warning "  NEXT_PUBLIC_FLIP_IT_PROGRAM_ID=$PROGRAM_ID"
fi

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================

echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                   DEPLOYMENT COMPLETE!                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${BLUE}Program Details:${NC}"
echo "================"
echo "Program ID: $PROGRAM_ID"
echo "Network: Devnet"
echo "Deployer: $WALLET_ADDRESS"
echo ""

echo -e "${BLUE}Links:${NC}"
echo "======"
echo "Solana Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo "Solscan: https://solscan.io/account/$PROGRAM_ID?cluster=devnet"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "==========="
echo "1. Your .env.local has been updated"
echo "2. The IDL has been copied to your frontend"
echo "3. Run the tests: cd house.fun/programs/flip-it && anchor test"
echo "4. Start your frontend: cd house.fun/house-fun-app && npm run dev"
echo ""

echo -e "${GREEN}Happy hacking! 🚀${NC}"
echo ""
