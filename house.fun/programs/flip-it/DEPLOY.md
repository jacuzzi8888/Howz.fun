# Flip It - Arcium Deployment Guide

## Prerequisites

You need a Linux environment with:
- Rust
- Solana CLI 2.3.0+
- Anchor 0.32.1
- Yarn/npm
- Docker & Docker Compose

## Step 1: Install Arcium CLI

```bash
# Install Arcium
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash

# Verify installation
arcium --version
```

## Step 2: Configure Environment

Make sure you have:
1. Solana wallet configured: `~/.config/solana/id.json`
2. Devnet SOL: `solana airdrop 2` (repeat until you have ~5 SOL)
3. Helius or QuickNode RPC key

## Step 3: Build the Program

```bash
cd house.fun/programs/flip-it

# Build the Arcis circuits and Anchor program
arcium build

# This generates:
# - build/coin_flip.arcis (compiled circuit)
# - target/deploy/flip_it.so (deployable binary)
# - target/idl/flip_it.json (IDL for frontend)
```

## Step 4: Deploy to Devnet

```bash
# Deploy with cluster offset 456 (v0.7.0)
arcium deploy \
  --cluster-offset 456 \
  --recovery-set-size 4 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY

# Save the program ID output
```

## Step 5: Initialize Computation Definition

After deployment, initialize the Arcium circuit (one-time setup):

```bash
# Run the test that initializes the comp def
arcium test --cluster devnet

# Or manually via CLI (requires custom script)
```

## Step 6: Update Frontend

1. Copy the new IDL:
```bash
cp target/idl/flip_it.json ../../../house-fun-app/src/lib/anchor/idl.ts
```

2. Update `.env.local`:
```
NEXT_PUBLIC_FLIP_IT_PROGRAM_ID=<NEW_PROGRAM_ID>
```

3. Install Arcium client library:
```bash
cd ../../../house-fun-app
npm install @arcium-hq/client @noble/curves
```

## Step 7: Test the Integration

```bash
# In the flip-it directory
arcium test --cluster devnet
```

## Architecture

```
Player places bet
      │
      ▼
┌─────────────────────┐
│   request_flip()    │ ← Encrypts choice with Arcium
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│  Arcium MPC Cluster │ ← Generates provably fair randomness
│   (Multiple nodes)  │   No single party can predict outcome
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│ coin_flip_callback()│ ← Receives result, resolves bet
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│   claim_winnings()  │ ← Player claims payout
└─────────────────────┘
```

## Important Notes

1. **Arcium is Linux/Mac only** - Use WSL2 on Windows
2. **Compilation takes time** - First build may take 5-10 minutes
3. **Devnet can be slow** - MPC computation takes 10-30 seconds
4. **Need reliable RPC** - Use Helius/QuickNode, not default devnet RPC
5. **Treasury funding** - House needs SOL to pay winners

## Troubleshooting

### "No such file or directory: arcium"
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$HOME/.cargo/bin:$PATH"
source ~/.bashrc
```

### "Insufficient funds"
```bash
solana airdrop 2 <YOUR_PUBKEY> -u devnet
# Repeat 3-4 times
```

### "Transaction simulation failed"
- Check you're using a reliable RPC (Helius/QuickNode)
- Default devnet RPC drops transactions frequently

### "Cluster offset not found"
```bash
# Check available clusters
solana account <CLUSTER_ACCOUNT> -u devnet

# Common offsets:
# 123 = v0.5.4
# 456 = v0.7.0 (recommended)
```

## Next Steps

After successful deployment:
1. Update the FlipItGame.tsx component
2. Test placing a bet
3. Verify Arcium callback resolves the bet
4. Claim winnings

The game is now using **provably fair** randomness via MPC!
