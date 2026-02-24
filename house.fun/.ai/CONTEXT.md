# Project Context: house.fun (2026 Edition)

## Overview
house.fun is a high-performance gaming platform on Solana, leveraging **MagicBlock Ephemeral Rollups** (50ms latency) and **Arcium MXE** (MPC-based provable randomness).

## 🚀 2026 Tech Stack
- **Frontend**: Next.js 15+ (App Router), React 19, Tailwind v4.
- **On-Chain**: `@solana/kit` (Modular SDK), MagicBlock Bolt CLI.
- **Privacy**: Arcium MXE (Computation Headers v2.0.0).
- **Oracle**: Pyth Pull Oracle Receiver (v0.13.0).

## 🎮 Game Development Status (Devnet)

### 1. Shadow Poker
- **Program ID**: `2ntDKv6TbKZUHejWkQG85uXj9c3xHvmssjQ4YYKVAgfJ`
- **Logic**: Arcium-encrypted card dealing and showdown proofs.
- **Status**: Deployed to Devnet. `house_account` PDA successfully provisioned.

### 2. Degen Derby
- **Program ID**: `J21s1YjXbutGLbHkLZiY4Xz9aquKV9fVqpAFLBBveFRw`
- **Logic**: MagicBlock Bolt handlers for real-time horse progress.
- **Status**: Deployed to Devnet. `house_account` PDA successfully provisioned.

### 3. Memecoin Fight Club (MFC)
- **Program ID**: `D2j4hf6476wn2g7f1dmoesEjgXeTdRVPC39s16xhsMrt`
- **Logic**: Pyth Pull Oracle integration for performance-based resolution.
- **Status**: Deployed to Devnet. `house_account` PDA successfully provisioned.

## 🔑 Infrastructure & Assets

### Admin Authority / Deployer
- **Wallet**: `DUwMdEHY74DCYMmWDxztMMX8RB9yFGQy5BFRPSEqCCzv`
- **Balance**: **~10.0 SOL** (Confirmed on Devnet).
- **Role**: Primary authority for Program Upgrades and House Initialization.

### Blockers Removed
- **Solana CLI**: CI/CD pipeline automation completely bypassed local CLI issues.
- **On-Chain State**: Clean deterministic Keypairs successfully pushed to Devnet. 
- **Action Plan**: MVP finalized and ready for E2E user-flow testing.

## 🏁 MVP Readiness & Active Tasks
- **UI/UX Audit**: Aesthetic tokens (Arcade Premium) applied across all major views.
- **Smart Contracts**: Payout vulnerabilities removed and fractional arithmetic fixed.
- **MVP Validation**: Deployed to Devnet and PDAs actively provisioned via GitHub Actions.
- **Compliance**: Geo-fencing & ZK-Age Gates required for production launch.

## 📜 Audit & Recovery History (Feb 2026)
- **ID Overhaul**: Replaced the volatile Anchor IDs with permanent, pinned Keypairs in `deploy/keys/*`.
- **Game Loops**: Restored missing `bet` and `resolve` actions in Degen Derby / Shadow Poker.
- **CI/CD Integration**: Fused `init_raw.cjs` natively into the GitHub Actions pipeline. Automated deployer wallet SOL airdrops to prevent buffer rent exhaustion errors.

## Agent Instructions
- Consult `.agent/rules.md` and `COMPREHENSIVE_REPORT.md` (in brain) before every task.
- **Standardization**: Ensure `blindType` naming is consistent across all Rust and IDL files to prevent Anchor parsing errors.
- **Modular Code**: Use `@solana/kit` sub-packages instead of the monolithic `@solana/web3.js`.
- **CRITICAL TESTING RULE**: ALL TEST MUST BE DONE ON THE VERCEL BUILD NOT LOCAL HOST.
- **CRITICAL COMMIT RULE**: AFTER EVERY FIX COMMITS MUST BE MADE.
