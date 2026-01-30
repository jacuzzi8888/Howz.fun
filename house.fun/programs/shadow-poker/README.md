# Shadow Poker - Solana Smart Contract

An encrypted Texas Hold'em poker game on Solana with private card dealing and verifiable fairness.

## Architecture

### Core Features
- **Encrypted Card Dealing**: Cards are encrypted using player public keys, ensuring only the recipient can see their hole cards
- **Mental Poker Protocol**: Cryptographic commitment scheme prevents cheating while maintaining privacy
- **Table Management**: Multi-player tables with configurable buy-ins and blinds
- **Betting Rounds**: Full Texas Hold'em betting structure (Pre-flop, Flop, Turn, River)
- **Escrow System**: Player funds locked in program-controlled PDA until hand resolution
- **House Edge**: 2% fee on all winning pots
- **Randomness**: Uses VRF (Verifiable Random Function) for fair card shuffling and dealing

### Program Structure
```
programs/shadow-poker/
├── programs/shadow-poker/src/
│   ├── lib.rs              # Entry point
│   ├── instructions/       # Game instructions
│   │   ├── initialize.rs   # Initialize house and table
│   │   ├── join_table.rs   # Player joins table with buy-in
│   │   ├── deal_hole_cards.rs    # Encrypted dealing of hole cards
│   │   ├── place_bet.rs    # Player betting actions
│   │   ├── deal_community.rs     # Deal flop/turn/river
│   │   ├── showdown.rs     # Reveal and evaluate hands
│   │   ├── claim_pot.rs    # Winner claims pot
│   │   └── leave_table.rs  # Cash out and exit
│   ├── state/              # Account structures
│   │   ├── house.rs        # House treasury
│   │   ├── table.rs        # Table state and config
│   │   ├── player.rs       # Player seat and balance
│   │   ├── hand.rs         # Current hand state
│   │   └── deck.rs         # Encrypted deck management
│   ├── crypto/             # Cryptographic utilities
│   │   ├── encryption.rs   # Card encryption/decryption
│   │   ├── commitment.rs   # Commitment scheme
│   │   └── vrf.rs          # Verifiable randomness
│   └── errors.rs           # Custom errors
└── tests/
    └── shadow-poker.ts     # Integration tests
```

## Instructions

### 1. Initialize House
Creates the house treasury account to collect fees and manage tables.

### 2. Create Table
Sets up a new poker table with parameters:
- Minimum/Maximum buy-in
- Small blind and big blind amounts
- Maximum number of players (2-9)
- Encryption parameters

### 3. Join Table
Player deposits SOL into escrow and takes a seat at the table. Receives encrypted hole cards.

### 4. Betting Actions
Players can perform standard poker actions:
- **Fold**: Surrender hand and forfeit pot contribution
- **Check**: Pass action (if no bet to call)
- **Call**: Match current bet
- **Raise**: Increase bet amount
- **All-In**: Bet all remaining chips

### 5. Deal Community Cards
Program deals encrypted community cards (flop, turn, river) using VRF.

### 6. Showdown
At river or when all but one player folds:
- Players reveal their hole cards
- Program evaluates hand strength
- Winner(s) determined by poker hand rankings

### 7. Claim Pot
Winner claims the pot minus house fee (2%).

### 8. Leave Table
Player cashes out remaining balance and leaves the table.

## Encryption Scheme

### Card Encryption
- Each card is encrypted using the recipient's public key
- Uses ElGamal encryption on the Solana curve
- Only the intended player can decrypt their cards
- Community cards are encrypted to all players simultaneously

### Commitment Protocol
1. **Shuffle Commitment**: Players commit to shuffle permutations
2. **Card Dealing**: Cards dealt with zero-knowledge proofs
3. **Reveal Phase**: Players prove they played honestly without revealing private keys

## Security

- **Card Privacy**: Hole cards encrypted, only visible to holder
- **Fair Dealing**: VRF ensures unbiased card distribution
- **Escrow Protection**: Funds locked until hand resolution
- **Timeout Handling**: Auto-fold for inactive players
- **Reentrancy Guard**: Protection against recursive calls
- **Front-running Prevention**: Commit-reveal for critical actions

## Hand Evaluation

Standard Texas Hold'em hand rankings:
1. Royal Flush
2. Straight Flush
3. Four of a Kind
4. Full House
5. Flush
6. Straight
7. Three of a Kind
8. Two Pair
9. One Pair
10. High Card

## Deployment

```bash
# Build
anchor build

# Test
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Program ID

- **Devnet**: `PoKeR5PaoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`
- **Mainnet**: TBD
