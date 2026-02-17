#!/bin/bash
export PATH="$HOME/solana-release/bin:$HOME/.cargo/bin:$PATH"
echo "Solana version:"
solana --version
echo "Anchor version:"
anchor --version
echo "Building Shadow Poker..."
cd "/mnt/c/Users/USER/hackathon planning/house.fun/programs/shadow-poker" && anchor build
echo "Building Degen Derby..."
cd "/mnt/c/Users/USER/hackathon planning/house.fun/programs/degen-derby" && anchor build
echo "Building Fight Club..."
cd "/mnt/c/Users/USER/hackathon planning/house.fun/programs/fight-club" && anchor build
