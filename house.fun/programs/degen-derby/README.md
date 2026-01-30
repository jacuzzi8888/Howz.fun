# Degen Derby - Solana Smart Contract

A provably fair horse racing betting game on Solana with commit-reveal scheme.

## Architecture

### Core Features
- **Commit-Reveal Scheme**: Players commit to a horse before the race
- **Escrow System**: SOL is held in program-controlled PDA until race resolution
- **House Edge**: 1% fee on all winning bets
- **Randomness**: Uses blockhash + player commitment for fair race outcomes
- **Multiple Horses**: Race between 4-8 horses with different odds

### Program Structure
```
programs/degen-derby/
├── programs/degen-derby/src/
│   ├── lib.rs              # Entry point
│   ├── instructions/       # Game instructions
│   │   ├── initialize.rs   # Initialize game state
│   │   ├── create_race.rs  # Create a new race
│   │   ├── place_bet.rs    # Player places bet on horse
│   │   ├── start_race.rs   # Start the race
│   │   ├── resolve_race.rs # Resolve race with random winner
│   │   └── claim.rs        # Claim winnings
│   ├── state/              # Account structures
│   │   ├── race.rs         # Race state
│   │   ├── bet.rs          # Bet state
│   │   ├── horse.rs        # Horse data
│   │   └── house.rs        # House treasury
│   └── errors.rs           # Custom errors
└── tests/
    └── degen-derby.ts      # Integration tests
```

## Instructions

### 1. Initialize House
Creates the house treasury account to collect fees.

### 2. Create Race
Initialize a new race with 4-8 horses and their respective odds.

### 3. Place Bet
Player deposits SOL into escrow PDA and selects a horse.

### 4. Start Race
Lock betting and prepare for race resolution.

### 5. Resolve Race
After race completion, resolve with random winner:
- Generate random outcome weighted by odds
- Determine winning horse
- Distribute winnings (minus house fee)

### 6. Claim
Withdraw winnings from escrow.

## Security

- **Commit-Reveal**: Prevents front-running
- **Escrow**: Funds locked until race resolution
- **Timeout**: Auto-resolve if race doesn't complete
- **Reentrancy Guard**: Protection against recursive calls
- **Odds Validation**: Ensures fair odds calculation

## Deployment

```bash
# Build
anchor build

# Test
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```
