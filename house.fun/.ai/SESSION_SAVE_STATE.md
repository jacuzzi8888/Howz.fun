# Session Save State: Solana Build Debugging

## Current Objective
Successfully build and deploy Solana programs (`shadow-poker`, `degen-derby`, `fight-club`) to Devnet via GitHub Actions.

## Milestone 1: Program ID & Key Parsing (Completed)
- **ID Standardization**: Identified a 45-character mismatch in the `degen_derby` ID. Standardized all instances across `Anchor.toml` and `lib.rs` to the valid 44-character version: `Dky8DpKsA4LgCMs1YFUPhrvYE1C1FbwZeFjHSHzXzpzv`.
- **Secret Reliability**: Switched from shell-based secret injection to a **Node.js parsing block** in CI. This ensures the `DEPLOYER_KEY` is written as a raw 64-byte JSON array, fixing the "String is the wrong size" parsing error.

## Milestone 2: CI Environment & Dependency Research (Completed)
- **Root Cause Identified**: Discovered a multi-layer incompatibility:
    - `Cargo.lock` v4 vs. Solana 1.18.x (v3 only).
    - `arcium-anchor 0.8.0` requires `anchor-lang 0.32.x`.
    - Solana 1.18.x bundled Rust (1.75.0-dev) cannot compile modern crates like `toml_parser` or `borsh-derive 1.6.0`.
- **Strategy Shift**: Abandoned "dependency whack-a-mole" on Solana 1.18.x. Moved to a Full Stack Upgrade.

## Milestone 3: Full Stack Upgrade (Completed)
Successfully transitioned the project to modern Solana standards to satisfy Arcium SDK requirements.

- **Stack Alignment**:
    - **Solana CLI**: `1.18.17` → `2.1.15` (Latest Agave V2 compatible with Anchor 0.32)
    - **Anchor CLI**: `0.30.1` → `0.32.1`
    - **Rust Toolchain**: `1.77.0` → `stable` (v1.85+)
- **Program Updates**: All programs upgraded to `anchor-lang = "0.32.1"`.

## Milestone 4: Unified Workspace Architecture & CI Fix (Completed)
During CI build attempts (Runs #38-41), we encountered persistent compiler errors: `indexmap 2.13.0 requires rustc 1.82`. Despite upgrading system Rust, `cargo build-sbf` strictly forces the use of Solana's bundled `rustc 1.79.0-dev`. Attempts to bypass this via individual program `Cargo.toml` patches failed due to Cargo's strict workspace resolution rules.

- **The Solution Strategy**: 
    1. Define a global root `house.fun/Cargo.toml` unifying all game programs into a single Cargo workspace. *(Completed)*
    2. Move all shared dependency constraints into a central `[workspace.dependencies]` block. *(Completed)*
    3. Revise the GitHub Actions workflow (`build-solana.yml`) to perform a single `cargo update -p indexmap --precise 2.6.0 --workspace` at the repository root, ensuring all transitive dependencies (e.g., `indexmap`, `hashbrown`, `ahash`) remain locked to versions compatible with `rustc 1.75+`. *(Completed)*
    4. Refactor `deploy` job in CI to download artifacts and deploy without triggering rebuilds. *(Completed)*

## Milestone 5: Verification (Active)
- **Task**: Push changes to GitHub and monitor CI to verify successful `cargo build-sbf` utilizing the pinned `indexmap` version.
- **Goal**: Ensure the pipeline successfully builds and deploys all programs to Devnet in a single robust run.

## Current status
- **Task**: Completed rewriting `build-solana.yml` and the local Cargo.tomls workspace manifests. Waiting for CI verification.
- **Goal**: A green build log for the GitHub actions pipeline.

## Key Files
- [Workflow](file:///c:/Users/USER/hackathon%20planning/.github/workflows/build-solana.yml)
- [New Workspace Root](file:///c:/Users/USER/hackathon%20planning/house.fun/Cargo.toml)
- [Project Plan](file:///C:/Users/USER/.gemini/antigravity/brain/76b42b2b-b88e-4609-a2c9-570c03c9deec/implementation_plan.md)
