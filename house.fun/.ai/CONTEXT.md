# house.fun — Current Context (2026 Edition)

## Tech Stack
- Next.js 15+ (App Router, RSC, Server Actions)
- TypeScript 5.x+ (Strict Mode)
- tRPC for API
- Drizzle ORM + Supabase (Postgres)
- Tailwind CSS 4+
- Solana Kit (@solana/kit) - Replacement for web3.js v1
- Arcium SDK v3+ (Confidential SPL & MXEs)
- MagicBlock SDK (Ephemeral Rollups)
- Jupiter SDK v6 (Ultra API / RPC-less)

## Design Tool
- Google Stitch (MCP integrated)
- Project ID: house-fun

## Current Task
Implementation Phase 1: Moving from Simulations to On-Chain 2026 Integrations

## Key Decisions
- **Randomness**: Use Pyth Entropy + Arcium MXE for true provably fair logic.
- **Liquidity**: Use Jupiter Ultra API (RPC-less) for all in-game swaps/bets.
- **Performance**: Delegate high-frequency game loops (Poker, Derby) to MagicBlock rollups.
- **Privacy**: Encrypt cards and sensitive game state using Arcium MPC.
- **Transactions**: Prioritize Versioned Transactions and ALTs for atomic swap-and-bet flows.
- **Auth**: Wallet-only auth (Solana Standard).

## DO NOT
- Use `getProgramAccounts` (Use Helius DAS API instead).
- Use legacy `@solana/web3.js` (Use `@solana/kit`).
- Use old "Flash Fill" patterns (Use Jupiter CPI).
- Use Prisma (we use Drizzle).
- Create new utility files without checking existing.
- Install dependencies without checking compatibility with Next.js 15.
