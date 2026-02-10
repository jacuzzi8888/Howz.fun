# Project Context: house.fun

## Overview
house.fun is a high-performance gaming platform built on Solana, utilizing **MagicBlock Ephemeral Rollups** for 0-latency gameplay and **Arcium** for provably fair randomness.

## Key Components
- **Flip It Game**: A coin-flip game.
- **MagicBlock**: Provides the rollup connection for sub-second transactions.
- **Arcium**: Handles confidential computing for randomness.
- **Session Keys**: Allows users to play without signing every transaction.

## Current State & Active Tasks
- **UI/UX Upgrade (COMPLETED)**: Refactored Flip It game to fit on one screen; 3D coin scaled, padding reduced, gaps tightened.
- **Logic & Balance (COMPLETED)**: Implemented robust result polling, manual check backup, and immediate SOL balance refresh.
- **Automation (IN PROGRESS)**:
    - Auto-session start implemented.
    - **Auto-House Initialization**: Implementing auto-detection and setup for the House Account.

## Agent Instructions
- Consult `.agent/rules.md` before every task.
- Implementation requires explicit user approval.
- Logic/Design decisions must be offered as options to the user.
- Log major tasks in this file after user approval.
