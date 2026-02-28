# Tech Stack & Implementation Guide (2026 Edition)

This guide provides the research-backed blueprint for completing `house.fun` using the most advanced Solana tools available in 2026.

---

## 🏗️ Submission Status
**Demo Phase**: Complete. We have implemented stable gameplay engines for all 4 games.
**Production Phase**: Initiated on the `develop` branch. Focus is on migrating simulated loops to real-time Arcium MXE and MagicBlock Rollup state.

---

## 1. Arcium (Confidential Computing)
As of February 2026, Arcium integration has shifted towards "Multi-Party Execution Environments" (MXEs).

- **Current (Demo)**: Using Arcium hooks for Flip It; simulated encryption visuals for Shadow Poker.
- **Goal (Production)**: Port `shadow_poker` cards to **Arcium MXE**. Use the `arcium_compute` macro in Rust to mark dealing instructions as "Confidential." This ensures the house cannot see the deck.
- **Standard**: C-SPL (Confidential SPL).

## 2. MagicBlock (Ephemeral Rollups)
To achieve sub-second feedback in Shadow Poker and Degen Derby, we utilize MagicBlock.

- **Current (Demo)**: High-speed local simulations (1ms - 5s loops).
- **Goal (Production)**: Delegate the poker table PDA to an **Ephemeral Rollup**. This moves moves/bets to a 1ms tick rate while settling final pots on Solana L1.
- **Session Keys**: Replace the `useWallet` approval popups with sign-once session keys for a frictionless betting experience.

## 3. Jupiter V6 "Ultra" (Swap Engine)
- **Status**: Ready for phase 2 integration.
- **Goal**: Implement "Swap-to-Bet" using the RPC-less **Ultra API**. Chaining Jupiter Swap CPI and Game Bet in a single Versioned Transaction (ALT v2).

## 4. Oracles (Pyth & Helius)
- **Randomness**: Transition all games to **Pyth Entropy** for verifiable on-chain RNG.
- **Price Resolution**: Use **Pyth Pull Oracles** in Fight Club to resolve matches autonomously based on price proofs.
- **Indexing**: Helius DAS API for real-time leaderboard and social feed updates.

---

## 🛠️ Phase 2: Post-Submission Hardening

1. **Poker Privacy**: Port dealing to Arcium MXE to prevent validator front-running.
2. **Rollup Migration**: Shift the `handlePlayerAction` loop to an Ephemeral Rollup listener.
3. **Oracle Autonomy**: Remove "Admin Resolution" from Fight Club by verified Pyth price proofs.

---
*Last Updated: 2026-02-27*
