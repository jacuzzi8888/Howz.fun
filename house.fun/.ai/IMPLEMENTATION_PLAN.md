# house.fun — Implementation Plan (Feb 2026)

## Where We Stopped

### Session State (Last Active: ~Feb 20, 2026)
We successfully resolved the CI/CD build issues and **deployed all three Solana programs (`shadow-poker`, `degen-derby`, `fight-club`) to Devnet**. We bypassed the severe RPC rate limiting by using the `--no-idl` flag. We also completed a comprehensive UI/UX aesthetic audit of the Vercel frontend.

### What IS Working ✅
| Layer | Status | Notes |
|-------|--------|-------|
| **Solana program deployment** | ✅ Complete | Programs deployed to Devnet successfully. |
| **Frontend (Next.js 15)** | ✅ Live on Vercel | `howz-fun.vercel.app` — all pages build, SSR-safe. |
| **UI/UX Audit** | ✅ Complete | Critical aesthetic flaws documented. |
| **Wallet UX** | ✅ Complete | Real-time SOL balance, multi-wallet support. |

### New Permanent Devnet Program IDs
- **Shadow Poker**: `5YScsLMogjS2JHeXPfQjxEHoAK17RGMCauo1rj343RWD`
- **Degen Derby**: `Bi47R2F3rkyDfvMHEUzyDXuv9TCFPJ3uzHpNCYPBMQeE`
- **Fight Club**: `9cdERKti1DeD4pmspjfk1ePqtoze5FwrDzERdnDBWB9Z`

---

## Implementation Plan

### 🔴 PHASE 1: Frontend UI/UX Upgrade (Priority: CRITICAL)
**Status**: Active
**Goal**: Transform the current "generic template" aesthetic into a high-end, premium "32-bit Arcade / Casino" experience. *Focus purely on CSS, Tailwind tokens, and React component polish, not Solana integration.*

#### Step 1.1 — Establish Token System & Typography
- Establish a cohesive Token System utilizing one primary neon brand color.
- Upgrade Typography by importing a sharp, modern display font (e.g., Space Grotesk, Clash Display, or Outfit).

#### Step 1.2 — Introduce Glassmorphism & Depth
- Fix game cards: Add radial background gradients, inner borders, and high-quality drop-shadows.

#### Step 1.3 — Polish Micro-Interactions & Loaders
- Make "Play Now" and other key buttons feel responsive and tactile with glowing hover states.
- Re-engineer loading states: Replace raw text ("Loading...") with graceful animated skeleton loaders.

---

### 🟡 PHASE 2: Backend Smart Contract Crosschecking (Priority: HIGH)
**Status**: Upcoming
**Goal**: Audit the deployed Rust smart contracts to ensure logic is bulletproof before routing real funds.

#### Step 2.1 — Audit Degen Derby
- Verify randomness generation mechanisms.

#### Step 2.2 — Audit Shadow Poker
- Verify encrypted hand state logic constraint bounds.

#### Step 2.3 — Audit Fight Club
- Verify matchmaking and fee collection dynamics.

#### Step 2.4 — General Audit
- Ensure inner arithmetic and logical constraints of the Anchor programs are robust against overflow/underflow and logical exploits.

---

### 🟢 PHASE 3: MVP Integration & Assembly (Priority: HIGH)
**Status**: Upcoming
**Goal**: Connect the polished UI to the authenticated smart contracts.

#### Step 3.1 — Synchronize IDs
- Ensure the `declare_id!()` macros in the Rust files (in `programs/*/src/lib.rs`), the `Anchor.toml` configurations, and frontend configuration hardcodes all match the new Devnet IDs.

#### Step 3.2 — Initialize House
- Create/update an initialization script (`scripts/initialize_houses.ts`) to initialize the master global PDAs for the games over Devnet.

#### Step 3.3 — End-to-End Testing
- Connect frontend wallet, initiate core loops, and run end-to-end user flows (Login -> Bet -> Calculate -> Transfer/Payout).

---

## Key Risk & Action Item
The frontend is currently disconnected from the correct Devnet contracts. It must remain pure UI work for Phase 1 to prevent getting bogged down in integration issues. Once Phase 1 is visually complete, Phase 2 and 3 can be seamlessly executed.
