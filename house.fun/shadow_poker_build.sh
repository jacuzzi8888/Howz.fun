#!/bin/bash
export PATH="$HOME/solana-release/bin:$HOME/.cargo/bin:$HOME/.avm/bin:$PATH"
echo "Starting Anchor build for shadow-poker..."
cd ~/house.fun/programs/shadow-poker
anchor build
