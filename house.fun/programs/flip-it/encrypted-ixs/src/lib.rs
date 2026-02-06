// Flip It - Arcis Encrypted Instruction Stub
// This is a placeholder for the Arcium CLI to compile

/// Input from the player - their bet details
pub struct CoinFlipInput {
    /// Player's choice: 0 = HEADS, 1 = TAILS
    pub player_choice: u8,
    /// Bet ID for correlation
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
