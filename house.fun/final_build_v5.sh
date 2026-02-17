#!/bin/bash
set -e
export PATH="/home/user/solana-release/bin:/home/user/.cargo/bin:/home/user/.avm/bin:$PATH"

# Setup default signer
mkdir -p ~/.config/solana
cp /home/user/house.fun/authority.json ~/.config/solana/id.json

WRITE_TOML() {
    local NAME=$1
    local KEY=$2
    local DIR=$3
    local ID=$4
    
    cat <<EOF > "$DIR/Anchor.toml"
[features]
seeds = false
skip-lint = false

[programs.localnet]
$KEY = "$ID"

[programs.devnet]
$KEY = "$ID"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "/home/user/house.fun/authority.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
EOF
}

UPDATE_AND_BUILD() {
    local NAME=$1
    local KEY=$2
    local DIR=$3
    local LIB_FILE=$4
    local ID_FILE="/home/user/house.fun/deploy/${NAME}_id.txt"
    
    echo "---------------------------------------"
    echo "Processing $NAME..."
    
    # Update ALL Cargo.toml files in this program's directory
    find "$DIR" -name "Cargo.toml" | while read -r toml; do
        if ! grep -q "profile.release" "$toml"; then
            cat <<EOF >> "$toml"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1
EOF
            echo "Added profile.release to $toml"
        fi
    done
    
    ID=$(cat "$ID_FILE")
    WRITE_TOML "$NAME" "$KEY" "$DIR" "$ID"
    
    # Update lib.rs
    sed -i "s/declare_id!(\".*\")/declare_id!(\"$ID\")/" "$LIB_FILE"
    
    echo "Building $NAME..."
    cd "$DIR" && anchor build
}

UPDATE_AND_BUILD "shadow_poker" "shadow_poker" "/home/user/house.fun/programs/shadow-poker" "/home/user/house.fun/programs/shadow-poker/programs/shadow-poker/src/lib.rs"
UPDATE_AND_BUILD "degen_derby" "degen_derby" "/home/user/house.fun/programs/degen-derby" "/home/user/house.fun/programs/degen-derby/programs/degen-derby/src/lib.rs"
UPDATE_AND_BUILD "fight_club" "fight_club" "/home/user/house.fun/programs/fight-club" "/home/user/house.fun/programs/fight-club/programs/fight-club/src/lib.rs"
