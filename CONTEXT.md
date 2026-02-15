# house.fun — Session Context Refresher

> **Goal**: This document is a high-density "brain-index" for AI agents to resume work on the house.fun Solana + Arcium hackathon project.

## 🏗️ Infrastructure & Environment
- **Flagship Game**: FlipIt (Active), FightClub/DegenDerby/ShadowPoker (Coming Soon/WIP).
- **Core Stack**: `Next.js 14`, `Anchor (Rust)`, `TRPC`, `Drizzle + Supabase (PostgreSQL)`, `MagicBlock (Rollup)`, `Arcium (MPC)`.
- **Active Network**: `Devnet`.
- **Key Files**:
  - `src/lib/anchor/utils.ts`: Provider and Program initialization.
  - `src/components/games/FlipItGame.tsx`: Main game logic and UI.
  - `src/lib/magicblock/SessionManager.ts`: Ephemeral key / Session logic.
  - `src/server/api/routers/game.ts`: TRPC mutations for recording/resolving bets.

## ✅ Major Fixes (DO NOT ROLL BACK)
1. **Wallet Signing**: `createProvider` in `utils.ts` must use the **real wallet adapter** for signing transactions. Substitutions with session keys break "Missing Signature" verification until on-chain delegation is implemented.
2. **Responsive Layout**: Game containers must use `min-h-[calc(100vh-80px)]` and `overflow-y-auto`. `overflow-hidden` clips the main action buttons on mobile.
3. **TRPC Auth**: `x-wallet-address` header is injected via a `walletAddressRef` in `src/trpc/react.tsx` to handle `protectedProcedure`.
4. **Supabase Connectivity**: `prepare: false` is required in Drizzle config to allow connection via Supabase Pooler.

## 🚧 Active Blockers
- **Supabase IP Whitelist**: Live history/Leaderboard might show "Loading..." on Vercel if the Supabase network settings haven't whitelisted Vercel's outbound IPs (or opened to 0.0.0.0).
- **Arcium Performance**: MPC operations for the card games are high-latency; currently using placeholder/mock logic until Arcium devnet stabilizer.

## 🗺️ State of Artifacts
- [task.md](file:///C:/Users/USER/.gemini/antigravity/brain/eec33346-1cae-4daf-ad31-9ace2b122da7/task.md) — Progress tracker.
- [site_map.md](file:///C:/Users/USER/.gemini/antigravity/brain/eec33346-1cae-4daf-ad31-9ace2b122da7/site_map.md) — Architectural diagrams.
- [research_report.md](file:///C:/Users/USER/.gemini/antigravity/brain/eec33346-1cae-4daf-ad31-9ace2b122da7/research_report.md) — Depth-first code/UI audit.

---
*Last Updated: 2026-02-13*
