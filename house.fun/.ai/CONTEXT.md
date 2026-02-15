# Project Context: house.fun (2026 Edition)

## Overview
house.fun is a high-performance gaming platform on Solana, leveraging **MagicBlock Ephemeral Rollups** (50ms latency) and **Arcium MXE** (MPC-based provable randomness).

## 🚀 2026 Tech Stack
- **Frontend**: Next.js 15+ (App Router), React 19, Tailwind v4.
- **On-Chain**: `@solana/kit` (Modular SDK), MagicBlock Bolt CLI.
- **Privacy**: Arcium MXE (Computation Headers v2.0.0).
- **Oracle**: Pyth Pull Oracle Receiver (v0.13.0).

## 📅 Game Development Roadmap
1.  **Phase 1: Degen Derby**:
    - Migrate to Arcium MXE for winner selection.
    - MagicBlock Bolt handlers for real-time horse progress.
    - Framer Motion + Three.js visualization.
2.  **Phase 2: Shadow Poker**:
    - Arcium-encrypted card dealing and showdown proofs.
    - MagicBlock-powered betting rounds (0-latency).
3.  **Phase 3: Memecoin Fight Club (MFC)**:
    - Pyth Pull Oracle integration for performance-based resolution.
    - Permissionless resolution via Hermes API.

## 🏁 MVP Readiness & Active Tasks
- **Flip It Game (COMPLETED)**: UI/UX polished, Arcium integrated.
- **Infrastructure (IN PROGRESS)**:
    - **MagicBlock Bolt Settings**: Configuring workspace for multi-game handlers.
    - **Unified House Account**: Reducing deposit friction via Session Keys.
- **Critical Blockers**:
    - **Compliance**: Geo-fencing & ZK-Age Gates required for launch.
    - **Observability**: Background Sentry/LogSnag for Arcium/Rollup tracing.

## Agent Instructions
- Consult `.agent/rules.md` and `COMPREHENSIVE_REPORT.md` (in brain) before every task.
- **Defensive Design**: Use the `disabledReason` pattern for buttons and global Toasts for background failures.
- **Modular Code**: Use `@solana/kit` sub-packages instead of the monolithic `@solana/web3.js`.
