# Agent Session Save State: house.fun

**Last Updated**: 2026-02-16

## 🎯 Current Objective
**Goal**: Build and deploy Shadow Poker, Degen Derby, and Fight Club programs to Solana Devnet and initialize House accounts.

## 🛠 Environmental State
- **Solana CLI**: ✅ **Installed in WSL Ubuntu** (v1.18.23). Path: `/home/user/solana-release/bin`.
- **Anchor CLI**: ✅ **Installed in WSL Ubuntu** (v0.32.1). Path: `/home/user/.avm/bin`.
- **Rust/Cargo**: ✅ **Installed in WSL Ubuntu** (stable-x86_64-unknown-linux-gnu).
- **WSL Native Filesystem**: Source code mirrored in `/home/user/house.fun` to avoid `DrvsFs` issues.
- **Admin Wallet**: `7EgawZyB5YBDoa5MP2NgJ7FmPUKj7GVvL5ociDqVLgrX`.
  - **Path (Local)**: `house-fun-app/authority.json`.
  - **Balance**: **~5.0 SOL** (Devnet).

## 📂 Technical Assets & Findings

### New Devnet Program IDs (Valid Base58)
Generated via `solana-keygen` in WSL to replace invalid placeholders:
- **Shadow Poker**: `3mQcoeWan1JqBJRp6717NR7U8U87fujG2AjB4Pu8vu2s`
- **Degen Derby**: `Dky8DpKsA4LgCMs1YFUPhrrvYE1C1FbwZeFjHSHzXzpzv`
- **Fight Club**: `GpFdMHcrcFusgR6JMnQVakkfQvrXioEw3RJGrMFkBu7nW`

### Build Configuration
- **Anchor.toml**: Updated for all three programs to use the new IDs, `cluster = "devnet"`, and `wallet = "deployer-key.json"` (for GitHub Actions compatibility).
- **lib.rs**: `declare_id!` updated in all programs to match the new IDs.
- **Cargo.toml**: `overflow-checks = true` added to release profiles.
- **GitHub Action**: Created `.github/workflows/build-solana.yml` for remote building.

## 🚧 Blockers & Current Strategy
- **Blocker**: WSL 2 local builds stall silently due to severe memory limits (~3GB RAM detected).
- **Strategy**: Switched to **GitHub Actions Remote Build**. 
  - The repository is prepared to build in the cloud where resources (7GB+ RAM) are sufficient.

## ⏭️ Immediate Next Steps for Next Session
1. **GitHub Setup**:
   - Push the updated code (including `.github/workflows/build-solana.yml`) to the GitHub repository.
   - Go to **Settings > Secrets and variables > Actions** in GitHub.
   - Create a new Secret named `DEPLOYER_KEY`.
   - Paste the contents of `house-fun-app/authority.json` (the byte array) into the secret.
2. **Trigger Build**:
   - Manually trigger the "Build and Deploy Solana Programs" workflow or push to `main`.
3. **Capture & Update**:
   - Verify deployment success on Devnet.
   - Update client-side `utils.ts` if IDs change (unlikely if keypairs are reused).
4. **House Initialization**:
   - Run `node src/lib/anchor/init_v2.cjs` in `house-fun-app` to initialize the PDA House accounts.

---
*End of Save State*
