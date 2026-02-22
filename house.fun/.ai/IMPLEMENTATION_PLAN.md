# house.fun — Implementation Plan (Feb 2026)

## Where We Stopped

### Session State (Last Active: ~Feb 22, 2026)
We successfully resolved the CI/CD out-of-funds and key-drift deployment errors. **All three Solana programs (`shadow-poker`, `degen-derby`, `fight-club`) are permanently anchored to deterministic Devnet keys**. The automated pipeline successfully provisioned the `[b"house_account"]` global PDAs across all instances using a fused CJS webhook. The frontend UI/UX aesthetic upgrade is entirely complete and merged.

### What IS Working ✅
| Layer | Status | Notes |
|-------|--------|-------|
| **Solana program deployment** | ✅ Complete | Programs permanently hashed to Devnet successfully. |
| **Frontend (Next.js 15)** | ✅ Complete | UI/UX visual upgrade complete. Connected to new IDs. |
| **UI/UX Audit** | ✅ Complete | Aesthetic flaws resolved with custom font & token system. |
| **Wallet UX** | ✅ Complete | Real-time SOL balance, multi-wallet support. |

### New Permanent Devnet Program IDs
- **Shadow Poker**: `HT1ro9KCKv3bzrvrtjonrMWuHZeNYFPvscPWy8bMaogx`
- **Degen Derby**: `G1cMMP2dDQNBDs1jDceKpLLAPiANympZUbAsLyMCXZkB`
- **Fight Club**: `5BZ86FTWQGrFnMLk17D882N7shNqoVuohbkKo2Ljt7GN`

---

## Implementation Plan

### 🟢 PHASE 1: Frontend UI/UX Upgrade (Priority: CRITICAL)
**Status**: ✔️ Complete
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

### 🟢 PHASE 2: Backend Smart Contract Crosschecking (Priority: HIGH)
**Status**: ✔️ Complete
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
**Status**: ✔️ Complete
**Goal**: Connect the polished UI to the authenticated smart contracts.

#### Step 3.1 — Synchronize IDs
- Ensure the `declare_id!()` macros in the Rust files (in `programs/*/src/lib.rs`), the `Anchor.toml` configurations, and frontend configuration hardcodes all match the new Devnet IDs.

#### Step 3.2 — Initialize House
- **Done**: Fused `scripts/init_raw.cjs` directly into the GitHub actions CI/CD pipeline to automatically execute and fund the global master PDAs.

#### Step 3.3 — End-to-End Testing
- Connect frontend wallet, initiate core loops, and run end-to-end user flows (Login -> Bet -> Calculate -> Transfer/Payout).

---

## Key Risk & Action Item
The frontend is currently disconnected from the correct Devnet contracts. It must remain pure UI work for Phase 1 to prevent getting bogged down in integration issues. Once Phase 1 is visually complete, Phase 2 and 3 can be seamlessly executed.
