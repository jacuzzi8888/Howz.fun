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
- **Production Build**: Verified for Vercel deployment with SSR safety.

---

## 🏗️ The Roadmap: What's Next?

### Phase 1: Arcium Hardware Confidentiality (Privacy & Fairness)
Currently, only `Flip It` leverages Arcium. The biggest technical leap is moving the other games from "on-chain transparent" to "confidential."

- **[x] Shadow Poker - Private Hands (Arcium Client Implemented)**: 
  - *Status*: ✅ **Frontend Complete** - Arcium MXE client integrated.
  - *Completed*: 
    - `useShadowPokerArcium.ts` hook with deck generation
    - `ArciumContext.tsx` extended with poker methods
    - Encrypted card types and deck structures
    - UI shows locked cards with "Encrypted by Arcium" badges
    - Ready for smart contract deployment with `deal_encrypted_cards` and `showdown_with_proof` instructions
  - *Remaining*: Deploy updated Rust contract with Arcium proof verification
- **[ ] Degen Derby - Fair Winning**: 
  - *Status*: Uses vulnerable blockhash randomness.
  - *Plan*: Use Arcium to generate the winning horse seed in a confidential TEE, ensuring zero miner manipulation.

### Phase 2: Oracle-Driven Automation
- **[ ] Fight Club - Auto Resolution**:
  - *Status*: Requires admin manual "win" call.
  - *Plan*: Integrate **Jupiter API** or **Pyth Oracles** to automatically resolve fights based on 24h price performance of the competing memecoins.

### Phase 3: Fast Loops & Retention
- **[ ] MagicBlock Ephemeral Rollups**:
  - *Plan*: Implement MagicBlock for Shadow Poker betting rounds to enable sub-second interactions without waiting for Solana L1 finality.
- **[ ] Metaplex VIP System**:
  - *Plan*: Token-gate certain high-stakes tables to holders of specific NFTs (e.g., Mad Lads, SMB).

### Phase 4: Economy (Jupiter Swap)
- **[ ] In-Game Token Swaps**:
  - *Plan*: Allow users to bet any SPL token directly by integrating Jupiter's swap API into the bet placement flow (Swap-to-Bet).

---

## 🛠️ How Best to Build It

### Recommendation 1: The "Arcium Pattern"
Follow the pattern established in `Flip It`:
1. **Commit**: Player commits on-chain.
2. **Compute**: Request Arcium confidential computation.
3. **Resolve**: Pass Arcium proof back to the Solana contract for zero-knowledge-like verification.

### Recommendation 2: Component Hardening
Many components (Fight Club, Degen Derby) currently use `setTimeout` simulations. To move to production:
1. Replace `window.setTimeout` with `connection.onAccountChange` listeners.
2. Use the `useGameState` hook consistently across all games for transaction lifecycle management.

### Recommendation 3: Data Plumbing
The Postgres schema is already designed for leaderboards. 
- Implement tRPC procedures to read from the `bets` and `leaderboard` tables to drive the "Social Feed" on the lobby page.
