# Session Save State: Solana Build Debugging

## Current Objective
Successfully build and deploy Solana programs (`shadow-poker`, `degen-derby`, `fight-club`) to Devnet via GitHub Actions.

## Milestone 1: Program ID & Key Parsing (Completed)
- **ID Standardization**: Identified a 45-character mismatch in the `degen_derby` ID. Standardized all instances across `Anchor.toml` and `lib.rs` to the valid 44-character version: `Dky8DpKsA4LgCMs1YFUPhrvYE1C1FbwZeFjHSHzXzpzv`.
- **Secret Reliability**: Switched from shell-based secret injection to a **Node.js parsing block** in CI. This ensures the `DEPLOYER_KEY` is written as a raw 64-byte JSON array, fixing the "String is the wrong size" parsing error.

## Milestone 2: CI Environment Research (Active)
I compared our current "manual" route to the 2025 industry standards to identify why the runners are failing.

| Feature | 2025 Industry Standard | Our Current Route |
| :--- | :--- | :--- |
| **Installation** | **`solana-developers/setup-all`**: Bundles tools + automatic caching. | **Manual Shell Scripts**: Vulnerable to SSL errors (`SSL_ERROR_SYSCALL`). |
| **Secret Handling** | **Base64 Encoding**: Workflow decodes a Base64 secret string. | **Raw JSON + Node.js**: Safely parses a JSON array string. |
| **Workflow Logic** | **Reusable Workflows**: Stable, pre-configured boilerplate. | **Explicit CLI Commands**: Manual path/command management. |

## Current Blocker
- **Runner Stability**: GitHub Actions are failing during the environment setup phase. Manual `curl` installers are hitting SSL resets. 
- **Action Incompatibility**: Official `solana-developers` action references have changed (some now require `@solana-developers/github-actions`).

## Next Steps
- [ ] Update `.github/workflows/build-solana.yml` to use `metadaoproject/setup-solana@v1` for stable CLI installation.
- [ ] Verify that "Build Programs" proceeds past the Base58 parsing phase.

## Key Files
- [Workflow](file:///C:/Users/USER/hackathon%20planning/.github/workflows/build-solana.yml)
- [Root Anchor.toml](file:///C:/Users/USER/hackathon%20planning/house.fun/Anchor.toml)
- [Degen Derby lib.rs](file:///C:/Users/USER/hackathon%20planning/house.fun/programs/degen-derby/programs/degen-derby/src/lib.rs)
