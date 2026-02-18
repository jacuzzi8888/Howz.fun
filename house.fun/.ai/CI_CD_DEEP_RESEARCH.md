# CI/CD Deep Research & MVP Deployment Plan

> **Date**: February 18, 2026  
> **Objective**: Fix CI/CD pipeline, deploy Solana programs, reach MVP stage  
> **Research Sources**: GitHub Marketplace Actions, Solana Developers official repos, Anchor docs, StackExchange threads

---

## 1. Root Cause Analysis

### What's Failing
The current `build-solana.yml` uses a **raw `curl` installer** to download Solana CLI:
```yaml
# CURRENT (BROKEN)
- name: Install Solana CLI
  run: sh -c "$(curl -sSfL https://release.solana.com/v1.18.23/install)"
```

**Why it fails:**
1. **SSL_ERROR_SYSCALL**: GitHub Actions runners intermittently fail SSL handshakes with `release.solana.com`. This is a known, widespread issue [StackOverflow, GitHub Issues, Azure DevOps forums].
2. **Deprecated URL**: Solana CLI releases have migrated from `release.solana.com` to `release.anza.xyz` (Anza/Agave rebranding). The old URLs may have degraded reliability.
3. **No caching**: Every run re-downloads from scratch, increasing failure probability.
4. **No retry logic**: If the download fails once, the entire workflow fails.

### Why Manual `cargo install anchor-cli` is Also Fragile
- `cargo install anchor-cli --version 0.30.1` compiles from source (~10-15 min).
- No caching between runs = wasted CI minutes and more failure surface area.
- Potential `Cargo.lock` version 4 incompatibility if Rust version doesn't match.

---

## 2. The 2025/2026 Industry Standard Solutions

### Option A: `solana-developers/github-actions/setup-all` ⭐ RECOMMENDED
**Source**: [github.com/solana-developers/github-actions](https://github.com/solana-developers/github-actions)

This is the **official Solana ecosystem solution**, maintained by Solana Developers. It provides:
- ✅ Pre-built Solana CLI installation with caching
- ✅ Anchor CLI installation with caching
- ✅ `solana-verify` installation
- ✅ Node.js environment setup
- ✅ Automatic version detection from `Cargo.lock` / `Anchor.toml`

**Inputs:**
```yaml
- uses: solana-developers/github-actions/setup-all@v0.2.9
  with:
    solana_version: '1.18.17'  # Required for Anchor 0.30.1
    anchor_version: '0.30.1'
    node_version: '20'
```

### Option B: `solana-developers/github-workflows` (Reusable Workflows) ⭐⭐ BEST FOR TURNKEY
**Source**: [github.com/solana-developers/github-workflows](https://github.com/solana-developers/github-workflows)

This wraps `setup-all` into **complete reusable workflows** that handle build + deploy + IDL upload + verification in a single call:

```yaml
jobs:
  build:
    uses: solana-developers/github-workflows/.github/workflows/reusable-build.yaml@v0.2.9
    with:
      program: "shadow_poker"
      program-id: "3mQcoeWan1JqBJRp6717NR7U8U87fujG2AjB4Pu8vu2s"
      network: "devnet"
      deploy: true
      upload_idl: true
      verify: false
      use-squads: false
      priority-fee: "300000"
    secrets:
      DEVNET_SOLANA_DEPLOY_URL: ${{ secrets.DEVNET_SOLANA_DEPLOY_URL }}
      DEVNET_DEPLOYER_KEYPAIR: ${{ secrets.DEVNET_DEPLOYER_KEYPAIR }}
```

**Key Benefits:**
- Retry mechanisms for RPC failures
- Compute budget optimization  
- Program extension (if .so is larger than existing account)
- Caching for all installations
- Built-in IDL upload support

### Option C: `metaDAOproject/setup-solana` + `metaDAOproject/setup-anchor`
**Source**: [github.com/metaDAOproject/setup-solana](https://github.com/metaDAOproject/setup-solana)

Simpler, lightweight alternative:
```yaml
- uses: metadaoproject/setup-solana@v1.0
  with:
    solana-cli-version: '1.18.17'
- uses: metadaoproject/setup-anchor@v1.0
  with:
    anchor-version: '0.30.1'
```

**Pros**: Simple, fast, reliable.  
**Cons**: No built-in deploy/verify/IDL support — you still write deploy steps manually.

---

## 3. Critical Compatibility Matrix

| Component | Required Version | Why |
|-----------|-----------------|-----|
| **Anchor CLI** | `0.30.1` | Arcium SDK compatibility requirement |
| **Solana CLI** | `1.18.17` (recommended) | Anchor 0.30.1 built for Solana v1.18.x |
| **Rust** | `1.75.0` to `1.78.0` | 1.75.0 works but may need Cargo.lock v3; 1.78+ supports Cargo.lock v4 |
| **Node.js** | `20.x` | LTS, required for deployment scripts |

> ⚠️ **DO NOT use Solana CLI 2.x (Agave)** with Anchor 0.30.1. Solana v2 requires Anchor 0.31+.

---

## 4. Program ID Audit (CRITICAL)

### Current State — ALL CONSISTENT ✅
After reviewing all source files, the Program IDs are actually **consistent** across lib.rs and Anchor.toml files:

| Program | `declare_id!()` in lib.rs | Root Anchor.toml | Sub Anchor.toml |
|---------|--------------------------|-------------------|-----------------|
| **shadow_poker** | `3mQcoeWan1JqBJRp6717NR7U8U87fujG2AjB4Pu8vu2s` | ✅ Match | ✅ Match |
| **degen_derby** | `Dky8DpKsA4LgCMs1YFUPhrvYE1C1FbwZeFjHSHzXzpzv` | ✅ Match | ✅ Match |
| **fight_club** | `GpFdMHcrcFusgR6JMnQVakfQvrXioEw3RJGrMFkBu7nW` | ✅ Match | ✅ Match |

### ⚠️ Discrepancy in CONTEXT.md (Documentation Only)
`CONTEXT.md` lists different IDs — but these appear to be **older recovered IDs** from a previous deployment. The Anchor.toml + lib.rs files are the source of truth and they match.

**Action**: Update CONTEXT.md to reflect the current IDs, or add a note that the old IDs are deprecated.

### ⚠️ Fight Club is NOT an Arcium Program
Note that `fight-club/lib.rs` uses `#[program]` (standard Anchor), NOT `#[arcium_program]`. It uses **Pyth Pull Oracle** for price resolution instead. This means:
- Fight Club will compile **without** the `arcium-anchor` dependency
- It has a different Cargo dependency tree than shadow-poker and degen-derby

---

## 5. Secret Management Best Practice

### Current Approach: Raw JSON Array via Node.js ✅ (Works but non-standard)
```yaml
env:
  SECRET: ${{ secrets.DEPLOYER_KEY }}
```
Then parsed via inline Node.js to write `deployer-key.json`.

### 2025 Industry Standard: Byte Array in Secret
The `solana-developers/github-workflows` expects the keypair as a **byte array string** directly:
```
DEVNET_DEPLOYER_KEYPAIR= # Keypair in byte array format [3, 45, 23, ...]
```

**Migration**: Your existing `DEPLOYER_KEY` secret is already in `[u8; 64]` JSON array format. You should:
1. Rename the secret to `DEVNET_DEPLOYER_KEYPAIR` for convention compatibility
2. Optionally add `DEVNET_SOLANA_DEPLOY_URL` (a paid Devnet RPC URL like Helius or QuickNode for reliability)

### If Using Custom Workflow (Option A/C): Base64 Approach
Some teams prefer Base64 encoding:
```bash
# Encode locally
base64 -w 0 deployer-key.json | pbcopy
# Store as DEPLOYER_KEY_BASE64 in GitHub Secrets
```
Then in workflow:
```yaml
- name: Setup Wallet
  run: echo "${{ secrets.DEPLOYER_KEY_BASE64 }}" | base64 -d > deployer-key.json
```

---

## 6. Recommended CI/CD Architecture

### Strategy A: Use Reusable Workflows (FASTEST TO MVP) ⭐⭐

Create separate workflow files per program using `solana-developers/github-workflows`:

#### File: `.github/workflows/deploy-shadow-poker.yml`
```yaml
name: Deploy Shadow Poker
on:
  workflow_dispatch:
    inputs:
      priority_fee:
        description: "Priority fee for transactions"
        required: true
        default: "300000"
        type: string

jobs:
  build-and-deploy:
    uses: solana-developers/github-workflows/.github/workflows/reusable-build.yaml@v0.2.9
    with:
      program: "shadow_poker"
      program-id: "3mQcoeWan1JqBJRp6717NR7U8U87fujG2AjB4Pu8vu2s"
      network: "devnet"
      deploy: true
      upload_idl: true
      verify: false
      use-squads: false
      priority-fee: ${{ github.event.inputs.priority_fee }}
    secrets:
      DEVNET_SOLANA_DEPLOY_URL: ${{ secrets.DEVNET_SOLANA_DEPLOY_URL }}
      DEVNET_DEPLOYER_KEYPAIR: ${{ secrets.DEVNET_DEPLOYER_KEYPAIR }}
```

Create identical files for `degen_derby` and `fight_club` with their respective IDs.

**⚠️ IMPORTANT**: The reusable workflow expects `Anchor.toml` and `Cargo.toml` in the **repository root**. Your project has them inside `house.fun/`. You may need to:
1. Either move the Anchor project root to the repo root, OR
2. Use Strategy B (custom workflow with `setup-all`) where you can `cd house.fun` before building.

### Strategy B: Custom Workflow with `setup-all` (MORE CONTROL) ⭐

#### File: `.github/workflows/build-solana.yml` (REPLACEMENT)
```yaml
name: Build and Deploy Solana Programs

on:
  push:
    branches: [main, master, develop]
    paths:
      - 'house.fun/programs/**'
      - 'house.fun/Anchor.toml'
      - 'house.fun/Cargo.toml'
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Solana Environment
        uses: solana-developers/github-actions/setup-all@v0.2.9
        with:
          solana_version: '1.18.17'
          anchor_version: '0.30.1'
          node_version: '20'

      - name: Setup Wallet
        run: |
          cd house.fun
          echo '${{ secrets.DEVNET_DEPLOYER_KEYPAIR }}' > deployer-key.json
          solana config set --url devnet
          solana config set --keypair deployer-key.json

      - name: Build Programs
        run: |
          cd house.fun
          anchor build

      - name: Upload Build Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: program-builds
          path: house.fun/target/deploy/*.so

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch'
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Solana Environment
        uses: solana-developers/github-actions/setup-all@v0.2.9
        with:
          solana_version: '1.18.17'
          anchor_version: '0.30.1'

      - name: Download Build Artifacts
        uses: actions/download-artifact@v4
        with:
          name: program-builds
          path: house.fun/target/deploy/

      - name: Setup Wallet
        run: |
          cd house.fun
          echo '${{ secrets.DEVNET_DEPLOYER_KEYPAIR }}' > deployer-key.json
          solana config set --url ${{ secrets.DEVNET_SOLANA_DEPLOY_URL || 'https://api.devnet.solana.com' }}
          solana config set --keypair deployer-key.json

      - name: Deploy Shadow Poker
        run: |
          cd house.fun
          anchor deploy --provider.cluster devnet --provider.wallet deployer-key.json --program-name shadow_poker

      - name: Deploy Degen Derby
        run: |
          cd house.fun
          anchor deploy --provider.cluster devnet --provider.wallet deployer-key.json --program-name degen_derby

      - name: Deploy Fight Club
        run: |
          cd house.fun
          anchor deploy --provider.cluster devnet --provider.wallet deployer-key.json --program-name fight_club

      - name: Verify Deployments
        run: |
          solana program show 3mQcoeWan1JqBJRp6717NR7U8U87fujG2AjB4Pu8vu2s
          solana program show Dky8DpKsA4LgCMs1YFUPhrvYE1C1FbwZeFjHSHzXzpzv
          solana program show GpFdMHcrcFusgR6JMnQVakfQvrXioEw3RJGrMFkBu7nW
```

---

## 7. GitHub Secrets Required

Before running any workflow, configure these secrets in your GitHub repo:

| Secret Name | Value | Required For |
|-------------|-------|-------------|
| `DEVNET_DEPLOYER_KEYPAIR` | The 64-byte JSON array `[123, 45, ...]` from your deployer key | Build & Deploy |
| `DEVNET_SOLANA_DEPLOY_URL` | A Devnet RPC URL (e.g., `https://devnet.helius-rpc.com/?api-key=XXX`) | Deploy (optional, defaults to public RPC) |

### Getting Your Deployer Keypair
Your admin wallet is `7EgawZyB5YBDoa5MP2NgJ7FmPUKj7GVvL5ociDqVLgrX`. The keypair file should be:
```bash
# If you have the JSON file:
cat deployer-key.json
# Output: [123, 45, 67, ...]  <- Copy this entire array as the secret value
```

---

## 8. Post-Deploy: House Initialization

After successful deployment, each game needs its House PDA initialized. Use the existing `init-house.yml` workflow or run manually:

```bash
# Shadow Poker
anchor run initialize_house --program-name shadow_poker

# Degen Derby  
anchor run initialize_house --program-name degen_derby

# Fight Club
anchor run initialize_house --program-name fight_club
```

Or use the existing TypeScript scripts:
- `house-fun-app/initialize_house.cjs`
- `house-fun-app/initialize_house_manual.cjs`

---

## 9. MVP Checklist

### Critical Path to MVP:
- [ ] **Fix CI workflow** (Replace curl installer → `setup-all` action)
- [ ] **Configure GitHub secrets** (`DEVNET_DEPLOYER_KEYPAIR`, `DEVNET_SOLANA_DEPLOY_URL`)
- [ ] **Push & trigger build** (verify all 3 programs compile)
- [ ] **Deploy to Devnet** (trigger manual deploy via `workflow_dispatch`)
- [ ] **Initialize House PDAs** (run init scripts for each game)
- [ ] **Update frontend IDLs** (copy from `target/idl/` to `house-fun-app/src/lib/anchor/`)
- [ ] **Rebuild frontend** (`npm run build` in house-fun-app)
- [ ] **Redeploy to Vercel** (push to trigger Vercel rebuild)
- [ ] **End-to-end test** (connect wallet, place bet on each game)

### Nice-to-have for hackathon polish:
- [ ] Add Arcium API credentials for encrypted gameplay
- [ ] Replace `setTimeout` simulations with `onAccountChange` listeners
- [ ] Add basic geo-fencing / age-gate modal
- [ ] Record demo video

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| `arcium-anchor` crate not found in CI | Ensure `Cargo.toml` has the correct registry/git source for arcium-anchor |
| `pyth-solana-receiver-sdk` version conflict | Pin to exact version in fight-club's `Cargo.toml` |
| Deployer wallet low on SOL | Airdrop or transfer SOL before deploy: `solana airdrop 5 --url devnet` |
| Program too large for existing account | Use `solana program extend` or the workflow's auto-extend feature |
| RPC rate limiting during deploy | Use a paid RPC (Helius, QuickNode) via `DEVNET_SOLANA_DEPLOY_URL` |

---

## References

1. [solana-developers/github-actions](https://github.com/solana-developers/github-actions) — Official GitHub Actions
2. [solana-developers/github-workflows](https://github.com/solana-developers/github-workflows) — Reusable workflows  
3. [Woody4618/anchor-github-action-example](https://github.com/Woody4618/anchor-github-action-example) — Working example
4. [metaDAOproject/setup-solana](https://github.com/metaDAOproject/setup-solana) — Optimized CLI installer
5. [Anchor 0.30.1 Release Notes](https://www.anchor-lang.com/) — Compatibility matrix
6. [Video Walkthrough](https://youtu.be/h-ngRgWW_IM) — Official deployment video guide
