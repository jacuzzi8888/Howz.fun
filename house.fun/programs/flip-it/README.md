# Flip It - Solana Smart Contract

A provably fair coin flip game on Solana with commit-reveal scheme.

## Architecture

### Core Features
- **Commit-Reveal Scheme**: Players commit to a choice before the flip
- **Escrow System**: SOL is held in program-controlled PDA until resolution
- **House Edge**: 1% fee on all winning bets
- **Randomness**: Uses blockhash + player commitment for fair outcomes

### Program Structure
```
programs/flip-it/
├── programs/flip-it/src/
│   ├── lib.rs              # Entry point
│   ├── instructions/       # Game instructions
│   │   ├── initialize.rs   # Initialize game state
│   │   ├── place_bet.rs    # Player places bet
│   │   ├── commit.rs       # Player commits to choice
│   │   ├── reveal.rs       # Reveal and resolve
│   │   └── claim.rs        # Claim winnings
│   ├── state/              # Account structures
│   │   ├── game.rs         # Game state
│   │   ├── bet.rs          # Bet state
│   │   └── house.rs        # House treasury
│   └── errors.rs           # Custom errors
└── tests/
    └── flip-it.ts          # Integration tests
```

## Instructions

### 1. Initialize House
Creates the house treasury account to collect fees.

### 2. Place Bet
Player deposits SOL into escrow PDA.

### 3. Commit
Player commits to HEADS or TAILS using hash commitment.

### 4. Reveal
After timeout or player reveal, resolve the game:
- Generate random outcome
- Compare with player choice
- Distribute winnings (minus house fee)

### 5. Claim
Withdraw winnings from escrow.

## Security

- **Commit-Reveal**: Prevents front-running
- **Escrow**: Funds locked until resolution
- **Timeout**: Auto-resolve if player doesn't reveal
- **Reentrancy Guard**: Protection against recursive calls

## Deployment

```bash
# Build
anchor build

# Test
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```
