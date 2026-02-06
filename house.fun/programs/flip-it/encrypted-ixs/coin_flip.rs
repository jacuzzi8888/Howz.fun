// Flip It - Arcis Encrypted Instruction
// Provably fair coin flip using MPC randomness
//
// This circuit runs across multiple MPC nodes. No single party
// can predict or manipulate the outcome.

use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    /// Input from the player - their bet details
    /// The player's choice is passed as plaintext since it doesn't need to be hidden
    /// from the MPC cluster (only the randomness needs to be secret)
    pub struct CoinFlipInput {
        /// Player's choice: 0 = HEADS, 1 = TAILS
        pub player_choice: u8,
        /// Bet ID for correlation (passed through to callback)
        pub bet_id: u64,
    }

    /// Output returned to the callback
    pub struct CoinFlipOutput {
        /// The random outcome: 0 = HEADS, 1 = TAILS
        pub outcome: u8,
        /// Whether the player won
        pub player_wins: bool,
        /// Bet ID passed through for correlation
        pub bet_id: u64,
    }

    /// Generate a provably fair coin flip
    ///
    /// The randomness comes from ArcisRNG::bool() which is generated
    /// collaboratively by all MPC nodes - no single node knows the
    /// outcome until all shares are combined.
    #[instruction]
    pub fn coin_flip(input: Enc<Shared, CoinFlipInput>) -> Enc<Shared, CoinFlipOutput> {
        let data = input.to_arcis();

        // Generate random boolean: true = HEADS (0), false = TAILS (1)
        let random_flip = ArcisRNG::bool();

        // Convert to u8: 0 = HEADS, 1 = TAILS
        let outcome: u8 = if random_flip { 0 } else { 1 };

        // Determine if player won
        let player_wins = data.player_choice == outcome;

        // Build output
        let result = CoinFlipOutput {
            outcome,
            player_wins,
            bet_id: data.bet_id,
        };

        input.owner.from_arcis(result)
    }

    /// Simple version that just returns a random bool
    /// Useful for testing and simpler integrations
    #[instruction]
    pub fn simple_flip() -> bool {
        ArcisRNG::bool().reveal()
    }
}
