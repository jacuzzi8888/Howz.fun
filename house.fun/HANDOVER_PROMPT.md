# Handover Prompt for house.fun (2026)

I am working on **house.fun**, a Solana-native casino for the 2026 Playsolana Matrix Hackathon. The platform is live at **house-fun-app.vercel.app**.

I have established a strict set of 2026 development standards. Before you write any code, you **MUST** read these files in the repository root to understand exactly how this project is built:

1.  **`.cursorrules`**: Read this first. It mandates using the **Solana Kit**, enforcing **SSR-safe** game pages, and following **Arcium MXE** patterns.
2.  **`ROADMAP.md`**: Shows the status of all 4 games and our multi-phase strategy.
3.  **`TECH_STACK_2026.md`**: Blueprint for **Arcium Mainnet Alpha**, **Jupiter Ultra API**, and **MagicBlock Rollups**.
4.  **`DEPLOYMENT_WALKTHROUGH.md`**: Explains the current build architecture and production state.
5.  **`PLAN_PHASE_1.md`**: The tactical plan for moving from simulations to real on-chain integrations.

We have finished Phase 0 and are now entering **Phase 1 of the Roadmap** (Implementing on-chain privacy and performance). 

**Your First Action**: Review the `ROADMAP.md` and the existing `ShadowPokerGame.tsx` component. Propose a technical plan to integrate the **Arcium MXE client** into the Poker hand dealing logic to ensure cards are provably private until the showdown.
