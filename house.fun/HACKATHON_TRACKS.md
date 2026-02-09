# Matrix Hackathon Tracks: house.fun Strategy

This document outlines how **house.fun** maps to the five core tracks of the **Play Solana: The Matrix Hackathon** (Jan-Feb 2026).

---

## 1. Encrypted Gaming Track (Arcium) 🛡️
**Track Goal**: Build games using Multi-Party Computation (MPC) to handle private state.
- **Implementation**: 
    - **Flip It**: ✅ **COMPLETE** - Uses Arcium for encrypted coin flips, preventing validators or the house from front-running outcomes. Contract deployed with `request_flip` and Arcium callback.
    - **Shadow Poker**: 🔄 **80% COMPLETE** - Arcium MXE client fully implemented:
      - Frontend: `useShadowPokerArcium.ts` hook with encrypted deck generation
      - UI: Locked card display with "🔒 Arcium Encrypted" badges
      - Types: `EncryptedCard`, `EncryptedDeck` with Arcium proofs
      - Methods: `dealEncryptedCards()`, `showdownWithProof()` in client
      - Pending: Rust contract deployment with Arcium instructions
    - **C-SPL**: ⏳ Integrating the Confidential SPL standard for private betting balances (next phase).

## 2. Real-Time Gaming Track (MagicBlock) ⚡
**Track Goal**: Solve the latency issue for high-frequency on-chain interactions.
- **Implementation**:
    - **Poker Betting Loop**: Uses MagicBlock **Ephemeral Rollups** to achieve 1ms block times for "Check," "Fold," and "Raise" actions. Payouts settle back to Solana L1.
    - **Degen Derby**: Horse racing movement and real-time positioning are calculated on a rollup to provide smooth Web2-like animations without network lag.

## 3. Gamification, DeFi & Mobile Adventures (Jupiter) 🪐
**Track Goal**: Use Jupiter tools to innovate in DeFi and mobile gaming.
- **Implementation**:
    - **Swap-to-Bet (Jupiter Ultra)**: Players can gamble with *any* Solana memecoin ($WIF, $BONK, etc.). We use the **Jupiter Ultra Swap API** to atomically swap tokens into $HOUSE or $SOL at the start of every transaction.
    - **Slippage Management**: Using Jupiter's **Dynamic Slippage** to ensure bets land even during volatile price updates (Memecoin Fight Club).

## 4. Programmable Gaming Infrastructure (Metaplex) 🏗️
**Track Goal**: Use Metaplex assets in creative gaming contexts.
- **Implementation**:
    - **Metaplex Core**: Used for "House Passes" (Tiered membership NFTs) and "Winning Moments" (Compressed NFTs generated at the end of big wins).
    - **Asset Injection**: Player avatars from standard Solana NFT collections are rendered in the poker room.

## 5. Play Solana PSG1-first Track 🎮
**Track Goal**: Build the future of the Play Solana ecosystem.
- **Implementation**:
    - **house.fun** is the "Social Hub" concept Play Solana is looking for—combining betting, social feeds, and competitive gaming into a single, high-fidelity experience that showcases the full power of the Solana stack.
