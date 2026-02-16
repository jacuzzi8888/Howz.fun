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
- **Program ID**: `6rTzxEePi1mtqs1XXp5ao8Bk6iSXQzzbSaYfCk3tdRKQ`
- **Logic**: Arcium-encrypted card dealing and showdown proofs.
- **Status**: Code standardized (schema fixes for `blindType`). House initialization pending fresh deployment.

### 2. Degen Derby
- **Program ID**: `G1qaWMRahGRqNRSPF1NSKRFeokyvPUsTEYF58sVTph38`
- **Logic**: MagicBlock Bolt handlers for real-time horse progress.
- **Status**: Correct Program ID recovered and integrated into `utils.ts`.

### 3. Memecoin Fight Club (MFC)
- **Program ID**: `AVVzy9JxsarZ7DvXwUDZFwpFH1RYJEJBperCcE15TsGN`
- **Logic**: Pyth Pull Oracle integration for performance-based resolution.
- **Status**: Correct Program ID recovered and integrated into `utils.ts`.

## 🔑 Infrastructure & Assets

### Admin Authority
- **Wallet**: `7EgawZyB5YBDoa5MP2NgJ7FmPUKj7GVvL5ociDqVLgrX`
- **Balance**: **~5.0 SOL** (Confirmed on Devnet).
- **Role**: Primary authority for Program Upgrades and House Initialization.

### Critical Blockers
- **Solana CLI**: Currently missing from the development path. This blocks `anchor deploy`.
- **On-Chain State**: Current House PDAs for recovered IDs are either uninitialized or in a stale state.
- **Action Plan**: Fresh redeployment recommended once Solana CLI is restored to ensure clean on-chain account structures.

## 🏁 MVP Readiness & Active Tasks
- **Flip It Game (COMPLETED)**: UI/UX polished, Arcium integrated.
- **Shadow Poker (RECOVERY)**: IDL standardized and Program ID mapped.
- **Compliance**: Geo-fencing & ZK-Age Gates required for launch.
- **Observability**: Background Sentry/LogSnag for Arcium/Rollup tracing.

## 📜 Audit & Recovery History (Feb 2026)
- **ID Recovery**: Audited Admin wallet (`7EgawZyB5YBDoa5M...`) transactions on Devnet. Identified executable programs via `BPFLoaderUpgradeab1e` mapping.
- **Shadow Poker Fixes**: Standardized `blindType` across the Rust implementation and the TypeScript IDL to resolve `IdlError: Type not found`.
- **Initialization Attempts**:
  - **Attempt 1**: Used Anchor CLI `initialize_house`. Blocked by IDL version mismatch and missing `solana` CLI.
  - **Attempt 2**: Used raw TypeScript transactions with the recovered Admin secret key. Simulation failed, likely due to account constraints or existing state from previous iterations.
- **Current Recommendation**: Perform a fresh deployment (`anchor deploy`) once the local Solana CLI is restored to ensure correct PDA derivation and initialization.

## Agent Instructions
- Consult `.agent/rules.md` and `COMPREHENSIVE_REPORT.md` (in brain) before every task.
- **Standardization**: Ensure `blindType` naming is consistent across all Rust and IDL files to prevent Anchor parsing errors.
- **Modular Code**: Use `@solana/kit` sub-packages instead of the monolithic `@solana/web3.js`.
