#!/bin/bash
set -e

REPAIR_AND_BUILD() {
    local NAME=$1
    local KEY=$2
    local DIR=$3
    local LIB_FILE=$4
    
    echo "Repairing $NAME..."
    
    # Reset Cargo.toml (Workspace)
    cp "/mnt/c/Users/USER/hackathon planning/house.fun/programs/${NAME//_/-}/Cargo.toml" "$DIR/Cargo.toml"
    
    # Reset Cargo.toml (Program crate)
    local PROG_NAME=${NAME//_/-}
    local PROG_TOML="$DIR/programs/$PROG_NAME/Cargo.toml"
    if [[ -f "/mnt/c/Users/USER/hackathon planning/house.fun/programs/$PROG_NAME/programs/$PROG_NAME/Cargo.toml" ]]; then
        cp "/mnt/c/Users/USER/hackathon planning/house.fun/programs/$PROG_NAME/programs/$PROG_NAME/Cargo.toml" "$PROG_TOML"
    fi
    
    # Append profile section to workspace Cargo.toml
    if ! grep -q "profile.release" "$DIR/Cargo.toml"; then
        cat <<EOF >> "$DIR/Cargo.toml"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1
EOF
    fi
}

REPAIR_AND_BUILD "shadow_poker" "shadow_poker" "/home/user/house.fun/programs/shadow-poker" "/home/user/house.fun/programs/shadow-poker/programs/shadow-poker/src/lib.rs"
REPAIR_AND_BUILD "degen_derby" "degen_derby" "/home/user/house.fun/programs/degen-derby" "/home/user/house.fun/programs/degen-derby/programs/degen-derby/src/lib.rs"
REPAIR_AND_BUILD "fight_club" "fight_club" "/home/user/house.fun/programs/fight-club" "/home/user/house.fun/programs/fight-club/programs/fight-club/src/lib.rs"

# Now run the build script (final_build_v3.sh which writes Anchor.toml and updates lib.rs)
bash ~/final_build_v3.sh > ~/build_final.log 2>&1
