# Roadmap: house.fun On-Chain Casino

This document outlines the current state of the project, identifying what has been built and the technical roadmap for the **Playsolana Matrix Hackathon**.

## ✅ Current Status: The Foundation is Built
We have established a robust, high-performance foundation for a Solana-native gaming platform.

### Core Infrastructure
- **Next.js 15 App Router**: Modern SSR-compatible architecture.
- **Anchor Framework**: Four dedicated Solana programs (`flip-it`, `fight-club`, `shadow-poker`, `degen-derby`).
- **Database Layer**: Supabase + Drizzle ORM with full schema for bettors, tables, and sessions.
- **Premium UI**: Glassmorphism aesthetic, custom animations, and responsive design systems.

### 🪙 Flip It (Production Ready)
- **Arcium Integrated**: Provably fair randomness via encrypted computations.
- **Commit-Reveal Scheme**: Secure betting flow that prevents manipulation.
# Roadmap: house.fun On-Chain Casino

This document outlines the current state of the project and the technical roadmap as we transition from a **Hackathon Demo** to a **Production Mainnet** platform.

## ✅ Current Status: Demo Submission Complete
We successfully submitted the project for the Playsolana Matrix Hackathon with a feature-rich, stable demo implementation.

### Core Infrastructure (Completed)
- **Next.js 15 App Router**: Modern SSR-compatible architecture with tRPC for server-client communication.
- **Anchor Framework**: Programs for `flip-it`, `fight-club`, `shadow-poker`, and `degen-derby` deployed to Devnet.
- **Branding & UX**: Premium "Dark Arcade" UI with consistent design language across all 4 games.
- **PWA Support**: App is installable on mobile and desktop for a native-like experience.

### Gameplay Status (Demo/Mockup Phase Completed)
- 🪙 **Flip It**: ✅ **Production Ready**. Arcium-based provably fair logic integrated.
- 🏇 **Degen Derby**: ✅ **Demo Ready**. High-speed (5s) race engine with MagicBlock simulation.
- 🃏 **Shadow Poker**: ✅ **Demo Ready**. Comprehensive gameplay loop with AI opponents and round progression.
- 🥊 **Memecoin Fight Club**: ✅ **UI Ready**. Betting logic and standard resolution cycle functional.

---

## 🏗️ Post-Submission Roadmap - develop Branch
Development continues at high speed on the `develop` branch to replace simulated components with fully autonomous on-chain logic.

### 🟢 Phase 1: Hardening & Integration (Immediate)
- **[ ] Real Arcium Hand Dealing (Poker)**:
  - Replace the simulated card dealing with real Arcium MPC encrypted packets.
  - Implement on-chain verification for showdown proofs.
- **[ ] Live MagicBlock Rollup (Derby & Poker)**:
  - Transition the poker betting loop and horse race telemetry to a live Ephemeral Rollup for 1ms latency.
- **[ ] Pyth Pull Oracles (Fight Club)**:
  - Integrate Pyth pull oracles to resolve fights based on real-time market data without admin intervention.

### 🟡 Phase 2: UX & Retention (Next 2 Weeks)
- **[ ] Global Jackpot Loop**: Implement the on-chain jackpot logic that triggers a payout across the entire ecosystem.
- **[ ] Telegram Mini App (TMA)**: Expand accessibility by wrapping the PWA for Telegram deployment.
- **[ ] Sound Design**: Add reactive audio cues for wins, losses, and dealer actions.

### 🔴 Phase 3: Ecosystem & Scale (Post-Judging)
- **[ ] Metaplex VIP System**: Token-gate high-roller tables for specific NFT collections.
- **[ ] Jupiter Swap-to-Bet**: Allow betting with any SPL token via atomic swaps within the game transaction.
- **[ ] Mainnet Launch**: Final program audits and deployment to Solana Mainnet-Beta.

---

## 🛠️ Implementation Guidance

### 1. The "Momentum" Rule
Commit messages on the `develop` branch should clearly state which "mock" is being replaced (e.g., `feat: replaced demo poker engine with live MagicBlock rollup`). This builds proof of execution for judges watching the repo.

### 2. Consistency
Maintain the `GameResultModal` standard for all new game wins to ensure the premium feel is preserved.

---
*Last Updated: 2026-02-27 (Post-Submission)*
