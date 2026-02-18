# house.fun — Implementation Plan (Feb 2026)

## Where We Stopped

### Session State (Last Active: ~Feb 17, 2026)
Development stalled at **CI/CD build & deployment** of the three Solana programs (`shadow-poker`, `degen-derby`, `fight-club`). The specific blocker was **GitHub Actions runner instability** — the `curl`-based Solana CLI installer was hitting SSL resets (`SSL_ERROR_SYSCALL`) during CI environment setup.

### What IS Working ✅
| Layer | Status | Notes |
|-------|--------|-------|
| **Frontend (Next.js 15)** | ✅ Live on Vercel | `house-fun-app.vercel.app` — all pages build, SSR-safe |
| **Flip It game** | ✅ Complete | Arcium contract + frontend fully integrated |
| **Shadow Poker frontend** | ✅ Complete | Arcium MXE hooks, encrypted cards UI, types — all done |
| **Wallet UX** | ✅ Complete | Real-time SOL balance, multi-wallet support, button debugging |
| **TypeScript build** | ✅ Passing | `npm run build` succeeds, no TS errors |
| **Admin wallet** | ✅ Funded | `7EgawZyB5YBDoa5MP2NgJ7FmPUKj7GVvL5ociDqVLgrX` — ~5 SOL on Devnet |

### What IS NOT Working ❌
| Item | Status | Blocker |
|------|--------|---------|
| **Solana program builds (CI)** | ❌ Blocked | SSL errors during Solana CLI install in GitHub Actions |
| **Program deployment (Devnet)** | ❌ Blocked | Can't deploy until programs build |
| **House PDA initialization** | ❌ Blocked | Can't init until programs are redeployed |
| **Shadow Poker Rust contract** | ❌ Incomplete | Needs Arcium `deal_encrypted_cards` & `showdown_with_proof` instructions |
| **Degen Derby Arcium** | ❌ Not started | Arcium integration not begun |
| **Fight Club Arcium** | ❌ Not started | Arcium integration not begun |
| **MagicBlock integration** | ❌ Not started | Phase 2 feature |
| **Jupiter Swap-to-Bet** | ❌ Not started | Phase 2 feature |

---

## Implementation Plan

### 🔴 PHASE 0: Unblock CI/CD Build (Priority: CRITICAL)
**Goal**: Get GitHub Actions to successfully build all 3 Solana programs.
**Estimated Time**: 2-4 hours

#### Step 0.1 — Fix Solana CLI Installation in CI
The `build-solana.yml` workflow currently uses a raw `curl` installer which hits SSL resets. The SESSION_SAVE_STATE recommended switching to `metadaoproject/setup-solana@v1`.

**Action**: Update `.github/workflows/build-solana.yml`:
```yaml
# REPLACE the manual curl install with:
- name: Install Solana CLI
  uses: metadaoproject/setup-solana@v1
  with:
    solana-cli-version: '1.18.23'
```

This action bundles installation + caching and avoids raw SSL downloads entirely.

#### Step 0.2 — Verify Anchor Version Compatibility
The project requires **Anchor 0.30.1** for Arcium SDK compatibility. The current workflow installs via `cargo install anchor-cli --version 0.30.1`. Consider using `coral-xyz/setup-anchor@v3` for caching:
```yaml
- name: Install Anchor CLI
  uses: coral-xyz/setup-anchor@v3
  with:
    anchor-version: '0.30.1'
```

#### Step 0.3 — Validate Program IDs
Ensure all Program IDs are consistent across these files:
- `house.fun/Anchor.toml` (root)
- `house.fun/programs/shadow-poker/Anchor.toml`
- `house.fun/programs/degen-derby/Anchor.toml`
- `house.fun/programs/fight-club/Anchor.toml`
- Each `programs/*/programs/*/src/lib.rs` (`declare_id!()`)
- `house-fun-app/src/lib/anchor/utils.ts`

Current expected IDs:
| Program | ID |
|---------|-----|
| shadow_poker | `3mQcoeWan1JqBJRp6717NR7U8U87fujG2AjB4Pu8vu2s` |
| degen_derby | `Dky8DpKsA4LgCMs1YFUPhrvYE1C1FbwZeFjHSHzXzpzv` |
| fight_club | `GpFdMHcrcFusgR6JMnQVakfQvrXioEw3RJGrMFkBu7nW` |

> ⚠️ Note: CONTEXT.md lists *different* IDs for degen_derby and fight_club than Anchor.toml. This needs verification — the Anchor.toml IDs should be the source of truth for builds.

#### Step 0.4 — Trigger Build & Verify
Push changes and trigger `workflow_dispatch`. Success criteria: the "Build Programs" step completes without errors and produces `.so` artifacts.

---

### 🟡 PHASE 1: Deploy Programs & Initialize House (Priority: HIGH)
**Goal**: Deploy all 3 programs to Devnet and initialize fresh House PDAs.
**Estimated Time**: 3-5 hours

#### Step 1.1 — Deploy Programs to Devnet
Once CI build passes, the deploy step in the workflow should handle this automatically. Verify all 3 programs are deployed and marked executable on Solana Explorer.

#### Step 1.2 — Initialize House Accounts
Each game needs a `House` PDA initialized. There are existing scripts in the codebase:
- `house-fun-app/initialize_house.cjs`
- `house-fun-app/initialize_house_manual.cjs`
- `house-fun-app/initialize_house.ts`

Or use the CI workflow `.github/workflows/init-house.yml`.

**Verify**: Each game's House PDA is initialized and the admin authority matches `7EgawZyB5YBDoa5MP2NgJ7FmPUKj7GVvL5ociDqVLgrX`.

#### Step 1.3 — Update Frontend with Fresh IDLs
After deployment, regenerated IDL JSON files will be in `target/idl/`. Copy them to:
- `house-fun-app/src/lib/anchor/shadow-poker-idl.ts`
- `house-fun-app/src/lib/anchor/degen-derby-idl.ts`
- `house-fun-app/src/lib/anchor/fight-club-idl.ts`

Then rebuild the frontend to ensure no type mismatches.

---

### 🟢 PHASE 2: Complete Arcium Integration (Priority: HIGH)
**Goal**: Bring Shadow Poker to full Arcium parity with Flip It. Start Degen Derby + Fight Club Arcium work.
**Estimated Time**: 2-3 days

#### Step 2.1 — Shadow Poker Rust Contract (Arcium Instructions)
The frontend is already complete. The Rust contract needs:
- `deal_encrypted_cards` instruction — sends computation request to Arcium MXE
- `showdown_with_proof` instruction — Arcium callback to verify and reveal hands

Follow the `programs/flip-it/src/lib.rs` pattern (Arcium `request_flip` + callback).

#### Step 2.2 — Degen Derby Arcium Integration
- Add Arcium MPC for private winner selection (horse race outcomes)
- Create `useDegenDerbyArcium.ts` hook (follow `useShadowPokerArcium.ts` pattern)
- Update `DegenDerbyGame.tsx` to use encrypted race resolution

#### Step 2.3 — Fight Club Arcium Integration
- Add Arcium MPC for match resolution (currently uses Pyth oracles + simulations)
- Create `useFightClubArcium.ts` hook
- Update `FightClubGame.tsx` to use Arcium-based resolution

#### Step 2.4 — Add Arcium API Credentials
Add to `house-fun-app/.env.local`:
```
NEXT_PUBLIC_ARCIUM_API_KEY=<your-key>
NEXT_PUBLIC_ARCIUM_CLUSTER=devnet
```

---

### 🔵 PHASE 3: MagicBlock Ephemeral Rollups (Priority: MEDIUM)
**Goal**: Enable sub-second interactions for poker betting and horse racing.
**Estimated Time**: 1-2 days

#### Step 3.1 — MagicBlock Bolt Integration for Shadow Poker
- Route `check`, `fold`, `raise` actions through MagicBlock Ephemeral Rollups
- Final payout settles back to Solana L1
- Reference: `house-fun-bolt/` directory and `magicblock.config.json`

#### Step 3.2 — MagicBlock for Degen Derby
- Real-time horse positioning on rollup
- Smooth Web2-like animation without network lag

#### Step 3.3 — Session Keys (Signless UX)
- Implement session keys so users sign once at session start
- No wallet popups during gameplay

---

### 🟣 PHASE 4: Jupiter + Metaplex (Priority: MEDIUM-LOW)
**Goal**: Add swap-to-bet and NFT features for hackathon track coverage.
**Estimated Time**: 1-2 days

#### Step 4.1 — Jupiter Ultra Swap-to-Bet
- Integrate Jupiter Ultra API into bet placement flow
- Users can bet with any SPL token ($WIF, $BONK, etc.)
- Atomic swap into SOL at transaction time

#### Step 4.2 — Metaplex Core NFT System
- House Passes (tiered membership NFTs)
- "Winning Moments" (compressed NFTs for big wins)
- NFT-gated VIP tables

---

### ⚪ PHASE 5: Polish & Compliance (Priority: LOW for MVP)
**Goal**: Final hackathon submission readiness.
**Estimated Time**: 1 day

#### Step 5.1 — Replace Simulations with Real On-Chain Listeners
Many game components still use `setTimeout` for simulations. Replace with:
- `connection.onAccountChange()` listeners
- Consistent `useGameState` hook across all games

#### Step 5.2 — Compliance Scaffolding
- Geo-fencing middleware (block restricted jurisdictions)
- Age-gate component (ZK-based or simple modal)

#### Step 5.3 — Observability
- Sentry integration for error monitoring
- LogSnag for Arcium/Rollup event tracing

#### Step 5.4 — README & Demo Video
- Update README.md with final architecture diagram
- Record demo video showing all game flows

---

## Recommended Execution Order

```
Phase 0 (CI Fix)          ← DO THIS FIRST (2-4 hours)
  ↓
Phase 1 (Deploy + Init)   ← Same day as Phase 0 (3-5 hours)
  ↓
Phase 2 (Arcium)           ← Priority work (2-3 days)
  ↓
Phase 3 (MagicBlock)       ← If time permits (1-2 days)
  ↓
Phase 4 (Jupiter/Metaplex) ← Track coverage (1-2 days)
  ↓
Phase 5 (Polish)           ← Final day (1 day)
```

**Total estimated time**: ~6-8 days of focused work.

---

## Quick Wins (Can Be Done in Parallel)

1. **Fix CI workflow** (Phase 0) — High impact, ~1 hour of code changes
2. **Verify Program ID consistency** — Audit all files now, prevent future headaches
3. **Add Arcium env vars** — Simple `.env.local` update once you have API keys
4. **Replace simulations** — Can start in frontend while CI builds are running

---

## Key Risk: Program ID Mismatch

The CONTEXT.md lists different Program IDs than Anchor.toml:
- **CONTEXT**: degen_derby = `G1qaWMRahGRqNRSPF1NSKRFeokyvPUsTEYF58sVTph38`
- **Anchor.toml**: degen_derby = `Dky8DpKsA4LgCMs1YFUPhrvYE1C1FbwZeFjHSHzXzpzv`

This must be reconciled before deployment. The `declare_id!()` in lib.rs is the ultimate source of truth — it must match both `Anchor.toml` and the frontend `utils.ts`.
