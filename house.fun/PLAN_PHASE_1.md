# Fix Build for Flip It App

The project currently fails to build because the frontend code (`flip-it-client.ts`, `FlipItGame.tsx`) is using a legacy Anchor API that does not match the refactored Arcium-enabled smart contract.

## Proposed Changes

### [Component Name] Anchor Integration
#### [MODIFY] [flip-it-client.ts](file:///c:/Users/USER/hackathon%20planning/house.fun/house-fun-app/src/lib/anchor/flip-it-client.ts)
- Update `placeBet` to match the new `place_bet(amount, choice: bool)` signature.
- Remove legacy `reveal` method (which doesn't exist in the contract).
- Add new `requestFlip` method to call the `flip` instruction.
- Update `fetchHouse` and other helper methods to match the new IDL fields if necessary.

#### [MODIFY] [FlipItGame.tsx](file:///c:/Users/USER/hackathon%20planning/house.fun/house-fun-app/src/components/games/FlipItGame.tsx)
- Update `handleFlip` to use the new `placeBet` signature.
- Adapt the reveal logic: since `reveal` is now an async callback from Arcium, the frontend should wait for the `FlipEvent` or poll the account rather than calling a direct `reveal` instruction.

### [Component Name] Type Definitions
#### [MODIFY] [idl.ts](file:///c:/Users/USER/hackathon%20planning/house.fun/house-fun-app/src/lib/anchor/idl.ts)
- Already fixed the raw JSON syntax error.
- Verified that types are correctly exported.

### [Game Pages] SSR Compatibility
#### [MODIFY] [fight-club/page.tsx](file:///c:/Users/USER/hackathon%20planning/house.fun/house-fun-app/src/app/games/fight-club/page.tsx)
#### [MODIFY] [flip-it/page.tsx](file:///c:/Users/USER/hackathon%20planning/house.fun/house-fun-app/src/app/games/flip-it/page.tsx)
#### [MODIFY] [degen-derby/page.tsx](file:///c:/Users/USER/hackathon%20planning/house.fun/house-fun-app/src/app/games/degen-derby/page.tsx)
#### [MODIFY] [shadow-poker/page.tsx](file:///c:/Users/USER/hackathon%20planning/house.fun/house-fun-app/src/app/games/shadow-poker/page.tsx)
- Disable server-side rendering (SSR) for all game components using `next/dynamic`. This prevents the Next.js build worker from crashing due to browser-only API usage (Solana/Anchor) during pre-rendering.

## Verification Plan

### Automated Tests
- Run `npm run build` locally to ensure the `prerender-error` on game pages is resolved and the build completes successfully.

### Manual Verification
- Deploy to Vercel and verify the build log shows success.
- Test "Place Bet" and other game actions on the deployed site.
