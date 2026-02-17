#!/bin/bash
set -e
export PATH="/home/user/solana-release/bin:/home/user/.cargo/bin:/home/user/.avm/bin:$PATH"

# Setup default signer
mkdir -p ~/.config/solana
cp /home/user/house.fun/authority.json ~/.config/solana/id.json

SOL_ADDRESS=$(solana address)
echo "Using Signer: $SOL_ADDRESS"

UPDATE_AND_BUILD() {
    local NAME=$1
    local KEY=$2
    local DIR=$3
    local LIB_FILE=$4
    local ID_FILE="/home/user/house.fun/deploy/${NAME}_id.txt"
    
    echo "---------------------------------------"
    echo "Processing $NAME..."
    
    # Reset Anchor.toml from Windows mount
    local SRC_DIR="/mnt/c/Users/USER/hackathon planning/house.fun/programs/${NAME//_/-}"
    cp "$SRC_DIR/Anchor.toml" "$DIR/Anchor.toml"
    
    ID=$(cat "$ID_FILE")
    echo "Target ID: $ID"
    
    # Update Anchor.toml
    sed -i "s/$KEY = \".*\"/$KEY = \"$ID\"/g" "$DIR/Anchor.toml"
    sed -i "s|wallet = \".*\"|wallet = \"/home/user/house.fun/authority.json\"|g" "$DIR/Anchor.toml"
    sed -i "s|cluster = \".*\"|cluster = \"devnet\"|g" "$DIR/Anchor.toml"
    
    # Update lib.rs
    sed -i "s/declare_id!(\".*\")/declare_id!(\"$ID\")/" "$LIB_FILE"
    
    echo "Building $NAME..."
    cd "$DIR" && anchor build
}

UPDATE_AND_BUILD "shadow_poker" "shadow_poker" "/home/user/house.fun/programs/shadow-poker" "/home/user/house.fun/programs/shadow-poker/programs/shadow-poker/src/lib.rs"
UPDATE_AND_BUILD "degen_derby" "degen_derby" "/home/user/house.fun/programs/degen-derby" "/home/user/house.fun/programs/degen-derby/programs/degen-derby/src/lib.rs"
UPDATE_AND_BUILD "fight_club" "fight_club" "/home/user/house.fun/programs/fight-club" "/home/user/house.fun/programs/fight-club/programs/fight-club/src/lib.rs"
