# Handover Prompt for house.fun (2026)

I am working on **house.fun**, a Solana-native casino for the 2026 Playsolana Matrix Hackathon. The platform is live at **house-fun-app.vercel.app**.

I have established a strict set of 2026 development standards. Before you write any code, you **MUST** read these files in the repository root to understand exactly how this project is built:

1.  **`.cursorrules`**: Read this first. It mandates using the **Solana Kit**, enforcing **SSR-safe** game pages, and following **Arcium MXE** patterns.
2.  **`ROADMAP.md`**: Shows the status of all 4 games and our multi-phase strategy.
3.  **`TECH_STACK_2026.md`**: Blueprint for **Arcium Mainnet Alpha**, **Jupiter Ultra API**, and **MagicBlock Rollups**.
4.  **`DEPLOYMENT_WALKTHROUGH.md`**: Explains the current build architecture and production state.
5.  **`PLAN_PHASE_1.md`**: The tactical plan for moving from simulations to real on-chain integrations.
6.  **`ARCIUM_INTEGRATION.md`**: Complete Arcium integration architecture for all games.
7.  **`HACKATHON_TRACKS.md`**: How house.fun maps to the 5 Matrix Hackathon tracks.

## ✅ Completed Since Last Update

### Phase 1 Progress - Arcium Integration

**Shadow Poker - Arcium MXE Client (COMPLETE)**
- ✅ Created `useShadowPokerArcium.ts` hook with full deck generation
- ✅ Extended `ArciumContext.tsx` with poker-specific methods
- ✅ Added encrypted card types (`EncryptedCard`, `EncryptedDeck`) to client
- ✅ Updated `shadow-poker-client.ts` with `dealEncryptedCards()` and `showdownWithProof()`
- ✅ UI now displays locked cards with "🔒 Arcium Encrypted" badges
- ✅ Real-time encryption status in player HUD
- ✅ Build successful, TypeScript types resolved
- 🔄 **Remaining**: Deploy updated Rust contract with Arcium instructions

**Wallet & Button Fixes**
- ✅ Fixed `isReady` logic for wallets without `signTransaction`
- ✅ Added real-time SOL balance display in games
- ✅ Created `useWalletBalance.ts` hook
- ✅ Added button state debugging (shows why buttons are disabled)
- ✅ Buttons now work with Phantom, Solflare, and other wallets

**Build & Type Safety**
- ✅ All TypeScript compilation errors resolved
- ✅ Production build verified and successful
- ✅ No SSR errors on game pages

## 🔄 Current Status

**Phase 1 (Arcium Confidentiality)**:
- ✅ **Flip It**: Fully Arcium integrated (contract + frontend)
- ✅ **Shadow Poker**: Frontend Arcium complete, contract pending
- ⏳ **Degen Derby**: Not started
- ⏳ **Fight Club**: Not started

**Next Actions Needed**:
1. Deploy Shadow Poker Rust contract with `deal_encrypted_cards` and `showdown_with_proof`
2. Add Arcium API credentials to `.env.local` for devnet testing
3. Test end-to-end encrypted poker flow
4. Move to Phase 2 (MagicBlock rollups for fast poker betting)

## 🎯 Hackathon Track Alignment

- ✅ **Track 1 (Arcium)**: Flip It complete, Shadow Poker 80% complete
- ⏳ **Track 2 (MagicBlock)**: Ready for ephemeral rollup integration
- ⏳ **Track 3 (Jupiter)**: Ready for swap-to-bet implementation
- ⏳ **Track 4 (Metaplex)**: Ready for NFT VIP system
- ✅ **Track 5 (Play Solana)**: Platform operational on devnet

## 🚨 Critical Notes for AI Agents

1. **Always check ROADMAP.md first** - Know which phase we're in
2. **Button debugging**: If buttons don't work, check `isReady` logic and wallet compatibility
3. **Arcium pattern**: Follow `useFlipItArcium.ts` pattern for new game integrations
4. **Wallet balance**: Use `useWalletBalance.ts` for real-time SOL display
5. **Type safety**: Run `npx tsc --noEmit` before committing changes
6. **SSR**: Game pages must use `next/dynamic` with `ssr: false`
7. **Build**: Always verify with `npm run build` before deployment

## 📚 Key File Locations

**Arcium Integration**:
- `src/hooks/useShadowPokerArcium.ts` - New poker Arcium hook
- `src/hooks/useFlipItArcium.ts` - Reference implementation
- `src/lib/arcium/client.ts` - Core Arcium client
- `src/lib/arcium/ArciumContext.tsx` - React context

**Games**:
- `src/components/games/FlipItGame.tsx` - Reference Arcium game
- `src/components/games/ShadowPokerGame.tsx` - Encrypted cards UI

**Wallet**:
- `src/hooks/useWalletBalance.ts` - Real-time SOL balance
- `src/components/layout/Header.tsx` - Shows balance in header

**Contracts**:
- `programs/flip-it/src/lib.rs` - Complete Arcium contract
- `programs/shadow-poker/src/lib.rs` - Needs Arcium additions

---

**Status**: Shadow Poker Arcium frontend complete. Ready for contract deployment and devnet testing. Build verified and production-ready.
