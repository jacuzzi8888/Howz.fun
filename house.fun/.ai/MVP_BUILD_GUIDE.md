# Howz.fun MVP Build Guide

This document serves as the architectural and strategic guide for the AI Agent executing the remaining development phases of the Howz.fun platform.

## Current System State
- The 3 Solana programs (`shadow-poker`, `degen-derby`, `fight-club`) have been **successfully deployed to Devnet**, bypassing the RPC rate limits using the `--no-idl` flag.
- The new, permanent Devnet Program IDs are:
  - **Shadow Poker**: `5YScsLMogjS2JHeXPfQjxEHoAK17RGMCauo1rj343RWD`
  - **Degen Derby**: `Bi47R2F3rkyDfvMHEUzyDXuv9TCFPJ3uzHpNCYPBMQeE`
  - **Fight Club**: `9cdERKti1DeD4pmspjfk1ePqtoze5FwrDzERdnDBWB9Z`
- The application is currently non-functional because the Next.js frontend is not yet synced with these new Program IDs.

## Phase 1: Frontend UI/UX Upgrade
**Goal**: Transform the current "generic template" aesthetic into a high-end, premium "32-bit Arcade / Casino" experience.
- DO NOT focus on Solana integration yet. Focus purely on CSS, Tailwind tokens, and React component polish.
- Reference the `UI_UX_AUDIT.md` for specific design flaws to address.
- Prioritize: Custom typography, unified brand colors (neon green), glassmorphism on game cards, tactical button hover states, and replacing raw text loading screens with skeleton loaders.

## Phase 2: Backend Smart Contract Crosschecking
**Goal**: Ensure the deployed Rust logic is bulletproof and secure before routing real player actions to them.
- Audit the inner arithmetic and logical constraints of the 3 anchor programs.
- Verify randomness generation in Degen Derby.
- Verify encrypted hand state in Shadow Poker.
- Verify matchmaking and fee collection in Fight Club.

## Phase 3: MVP Integration & Assembly
**Goal**: Connect the polished UI to the authenticated smart contracts.
- Update all hardcoded Program IDs in the frontend configuration/utils to match the Devnet IDs listed above.
- Ensure the `declare_id!()` macros in the Rust files and `Anchor.toml` files are synchronized.
- Create an initialization script (`scripts/initialize_houses.ts`) to initialize the master global PDAs for the games.
- Run end-to-end tests for all core gaming loops (Login -> Bet -> Calculate -> Transfer/Payout).
