# Tech Stack & Implementation Guide (2026 Edition)

This guide provides the research-backed blueprint for completing `house.fun` using the most advanced Solana tools available in 2026.

---

## 1. Arcium (Confidential Computing)
As of February 2026, Arcium has moved to **Mainnet Alpha**. The integration pattern has shifted towards "Multi-Party Execution Environments" (MXEs).

- **Core Tool**: `arcium-cli` (v2.x). Install via `npm install -g @arcium/cli`. It now acts as an Anchor wrapper.
- **Encryption Standard**: Use **C-SPL** (Confidential SPL). This is the 2026 industry standard for private balances. You no longer need manual AES/nonce management for standard tokens.
- **Best Practice**: Implement the `arcium_compute` macro in your Rust contracts to mark specific instructions as "Confidential."
- **Dependency**: `@arcium/sdk-ts` (latest v3.1+).

## 2. Jupiter V6 "Ultra" (The Swap Engine)
Jupiter has deprecated the old "Flash Fill" methods in favor of the **Ultra API**.

- **Integration**: Use the **Ultra Swap API**. It is "RPC-less," meaning you don't need to manage high-cost RPC nodes. Jupiter handles the transaction building and landing.
- **Swap-to-Bet**: Use **Cross Program Invocation (CPI)**. In 2026, the Solana transaction size limits have been relaxed via **Address Lookup Tables (ALTs) v2**, making CPI the most efficient way to bet with any memecoin.
- **Slippage**: Implement **Dynamic Slippage** (set to `auto` in the Jupiter SDK) to prevent failed swaps during high volatility meme fights.

## 3. MagicBlock (Ephemeral Rollups & Session Keys)
To achieve "Shadow Poker" with sub-second feedback and zero-friction UX, you must use MagicBlock.

- **Performance**: Block times are now **1ms**. This enables the "fast-fold" poker features found in Web2 apps.
- **Session Keys**: Implement the **Session Key pattern**. Players sign once to authorize an ephemeral key, allowing signless actions (Check/Fold/Raise) for the duration of the game.
- **Bolt ECS**: Use the **Bolt framework** (On-chain Entity-Component-System) for managing game state (Hands, Stacks, Pots) with high-frequency updates.
- **Pattern**: Delegate the poker table PDA to an ephemeral rollup. Moves happen on the rollup, while final payouts settle on Solana L1.
- **Gas**: MagicBlock supports **Gasless Execution** for rollups—the house can sponsor player transactions to remove all friction.

## 4. Oracles & Data (Pyth & Helius)
- **Randomness**: Use **Pyth Entropy**. It is the 2026 gold standard for secure, verifiable random numbers on-chain (use this alongside Arcium for maximum trust).
- **Price Battles**: Use **Pyth Pull Oracles**. These are more cost-effective than the old "Push" model—the frontend fetches the price and "pushes" it into the transaction only when the fight ends.
- **Indexer**: Use **Helius DAS API**. Do not use standard `getProgramAccounts` (it's too slow in 2026). Helius provides pre-filtered, indexed data for your horse race leaderboards.

## 5. Modern Frontend (Next.js 15/16)
- **Framework**: You are already on Next.js 15. Keep using **React Server Components (RSC)** for the lobby.
- **Transitions**: Use **React View Transitions API** (standard in 2026 browsers) for smooth animations between games without a heavy JS library like Framer Motion.
- **SDK**: Migrate to the new **Solana Kit** (`@solana/kit`). It replaces the fragmented `@solana/web3.js` v1 libraries with a single, modular package.

---

## 🛠️ Step-by-Step Completion Strategy

### Step 1: Secure the Poker Room
1. Port `shadow_poker` cards to **Arcium MXE**.
2. Encrypt `Card` data using Arcium keys.
3. Integrate `@magicblock/sdk` to move the betting loops onto an ephemeral rollup.

### Step 2: Automate Fight Club
1. Add a `PythPriceFeed` account to the `resolve_match` instruction.
2. Update the frontend to fetch a "Pull" price from Pyth Network.
3. Call `resolve_match` with the price proof, effectively removing the "admin" as the judge.

### Step 3: Global Swap-to-Bet
1. Add a "Any Token" button in the betting UI.
2. Use the Jupiter SDK to get a quote.
3. Chain the Jupiter Swap CPI and your Game Bet instruction in a single **Versioned Transaction**.
