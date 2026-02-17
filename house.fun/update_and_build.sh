#!/bin/bash
export PATH="$HOME/solana-release/bin:$HOME/.cargo/bin:$HOME/.avm/bin:$PATH"

UPDATE_PROGRAM() {
    local NAME=$1
    local DIR=$2
    local LIB_FILE=$3
    local ID_FILE="$HOME/house.fun/deploy/${NAME}_id.txt"
    
    if [[ -f "$ID_FILE" ]]; then
        ID=$(cat "$ID_FILE")
        echo "Updating $NAME with ID: $ID"
        
        # Update Anchor.toml
        sed -i "s/programs.localnet].*/programs.localnet]\n${NAME//-/_} = \"$ID\"/" "$DIR/Anchor.toml"
        sed -i "s/programs.devnet].*/programs.devnet]\n${NAME//-/_} = \"$ID\"/" "$DIR/Anchor.toml"
        
        # Update lib.rs
        sed -i "s/declare_id!.*/declare_id!(\"$ID\");/" "$LIB_FILE"
        
        echo "Building $NAME..."
        cd "$DIR" && anchor build
    else
        echo "ID file not found for $NAME"
    fi
}

UPDATE_PROGRAM "shadow_poker" "$HOME/house.fun/programs/shadow-poker" "$HOME/house.fun/programs/shadow-poker/programs/shadow-poker/src/lib.rs"
UPDATE_PROGRAM "degen_derby" "$HOME/house.fun/programs/degen-derby" "$HOME/house.fun/programs/degen-derby/programs/degen-derby/src/lib.rs"
UPDATE_PROGRAM "fight_club" "$HOME/house.fun/programs/fight-club" "$HOME/house.fun/programs/fight-club/programs/fight-club/src/lib.rs"
