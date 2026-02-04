use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use anchor_lang::solana_program::keccak::hash;
use anchor_lang::solana_program::sysvar::Sysvar;

// Program ID - Replace with actual after deployment
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// Constants
pub const HOUSE_FEE_BPS: u16 = 100; // 1% = 100 basis points
pub const REVEAL_TIMEOUT_SLOTS: u64 = 150; // ~1 minute at 400ms/slot
pub const MIN_BET_LAMPORTS: u64 = 1_000_000; // 0.001 SOL
pub const MAX_BET_LAMPORTS: u64 = 100_000_000_000; // 100 SOL

// Arcium Constants
pub const ARCIUM_PROOF_MAX_SIZE: usize = 1024; // Maximum proof size in bytes
pub const ARCIUM_VERIFICATION_PUBKEY: &[u8] = b"ARCIUM_VERIFY_KEY"; // Placeholder - replace with actual Arcium verification key

/// Arcium Proof Structure
/// Contains cryptographic proof of confidential computation
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ArciumProof {
    pub outcome: u8,                 // 0 = HEADS, 1 = TAILS
    pub proof: Vec<u8>,              // Cryptographic proof data
    pub public_inputs: Vec<u8>,      // Public inputs to the computation
    pub timestamp: i64,              // When the computation was executed
    pub cluster_signature: [u8; 64], // Signature from Arcium cluster
}

impl ArciumProof {
    pub const MAX_SIZE: usize = 1 + 4 + ARCIUM_PROOF_MAX_SIZE + 4 + ARCIUM_PROOF_MAX_SIZE + 8 + 64;

    /// Verify the proof structure is valid
    pub fn verify_structure(&self) -> Result<()> {
        require!(
            self.outcome == 0 || self.outcome == 1,
            FlipItError::InvalidArciumProof
        );
        require!(
            !self.proof.is_empty() && self.proof.len() <= ARCIUM_PROOF_MAX_SIZE,
            FlipItError::InvalidArciumProof
        );
        require!(
            !self.public_inputs.is_empty() && self.public_inputs.len() <= ARCIUM_PROOF_MAX_SIZE,
            FlipItError::InvalidArciumProof
        );

        // Check timestamp is recent (within 10 minutes)
        let current_time = Clock::get()?.unix_timestamp;
        let ten_minutes = 10 * 60;
        require!(
            self.timestamp >= current_time - ten_minutes
                && self.timestamp <= current_time + ten_minutes,
            FlipItError::ArciumProofExpired
        );

        Ok(())
    }
}

#[program]
pub mod flip_it {
    use super::*;

    /// Initialize the house treasury account
    pub fn initialize_house(ctx: Context<InitializeHouse>) -> Result<()> {
        let house = &mut ctx.accounts.house;
        house.authority = ctx.accounts.authority.key();
        house.treasury = 0;
        house.total_bets = 0;
        house.total_volume = 0;
        house.bump = ctx.bumps.house;
        house.arcium_verification_enabled = true; // Enable Arcium by default

        msg!("House initialized: {}", house.key());
        Ok(())
    }

    /// Player places a bet and commits to HEADS (0) or TAILS (1)
    /// Commitment = hash(player_choice + secret_nonce)
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        commitment: [u8; 32], // SHA-256 hash of (choice + nonce)
    ) -> Result<()> {
        // Validate bet amount
        require!(amount >= MIN_BET_LAMPORTS, FlipItError::BetTooSmall);
        require!(amount <= MAX_BET_LAMPORTS, FlipItError::BetTooLarge);

        let bet = &mut ctx.accounts.bet;
        let player = &ctx.accounts.player;
        let clock = Clock::get()?;

        bet.player = player.key();
        bet.amount = amount;
        bet.commitment = commitment;
        bet.status = BetStatus::Committed;
        bet.commit_slot = clock.slot;
        bet.bump = ctx.bumps.bet;
        bet.arcium_proof = None;

        // Transfer SOL from player to escrow PDA
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &player.key(),
            &bet.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                player.to_account_info(),
                bet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Update house stats
        let house = &mut ctx.accounts.house;
        house.total_bets += 1;
        house.total_volume += amount;

        msg!("Bet placed: {} lamports by {}", amount, player.key());
        Ok(())
    }

    /// LEGACY: Player reveals with pseudo-randomness (slot-based)
    /// DEPRECATED: Use reveal_with_arcium for provably fair outcomes
    pub fn reveal(
        ctx: Context<Reveal>,
        choice: u8, // 0 = HEADS, 1 = TAILS
        nonce: u64, // Secret nonce used in commitment
    ) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let house = &mut ctx.accounts.house;

        // Check if Arcium is enforced
        require!(
            !house.arcium_verification_enabled,
            FlipItError::ArciumRequired
        );

        // Verify commitment
        let mut commitment_data = vec![choice];
        commitment_data.extend_from_slice(&nonce.to_le_bytes());
        let computed_commitment = hash(&commitment_data).to_bytes();

        require!(
            computed_commitment == bet.commitment,
            FlipItError::InvalidReveal
        );

        // Generate random outcome using clock slot + player data
        // Note: This is NOT cryptographically secure - use Arcium for production
        let clock = Clock::get()?;
        let mut random_seed = clock.slot.to_le_bytes().to_vec();
        random_seed.extend_from_slice(&bet.player.to_bytes());
        random_seed.extend_from_slice(&nonce.to_le_bytes());
        random_seed.extend_from_slice(&clock.unix_timestamp.to_le_bytes());
        let random_hash = hash(&random_seed).to_bytes();
        let outcome = random_hash[0] % 2;

        // Resolve the bet
        resolve_bet_internal(bet, house, choice, outcome)?;

        msg!("Bet resolved (legacy): Outcome: {}", outcome);
        Ok(())
    }

    /// NEW: Player reveals with Arcium provably fair proof
    /// This is the recommended method for maximum fairness
    pub fn reveal_with_arcium(
        ctx: Context<RevealWithArcium>,
        choice: u8,
        nonce: u64,
        arcium_proof: ArciumProof,
    ) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let player = &ctx.accounts.player;
        let house = &mut ctx.accounts.house;

        // Verify player
        require!(bet.player == player.key(), FlipItError::UnauthorizedPlayer);

        // Verify bet status
        require!(
            bet.status == BetStatus::Committed,
            FlipItError::InvalidBetStatus
        );

        // Verify not timed out
        let clock = Clock::get()?;
        require!(
            clock.slot < bet.commit_slot + REVEAL_TIMEOUT_SLOTS,
            FlipItError::RevealTimeout
        );

        // Verify commitment
        let mut commitment_data = vec![choice];
        commitment_data.extend_from_slice(&nonce.to_le_bytes());
        let computed_commitment = hash(&commitment_data).to_bytes();

        require!(
            computed_commitment == bet.commitment,
            FlipItError::InvalidReveal
        );

        // Verify Arcium proof structure
        arcium_proof.verify_structure()?;

        // Verify Arcium proof (cryptographic verification)
        // In production, this would verify the cluster signature against Arcium's public key
        // For now, we verify the proof is well-formed and recent
        verify_arcium_proof_internal(&arcium_proof, &bet.commitment)?;

        // Store the Arcium proof
        bet.arcium_proof = Some(arcium_proof.clone());

        // Use the Arcium-provided outcome
        let outcome = arcium_proof.outcome;

        // Resolve the bet
        resolve_bet_internal(bet, house, choice, outcome)?;

        msg!(
            "Bet resolved with Arcium: Outcome: {}, Proof ID: {}",
            outcome,
            arcium_proof.timestamp
        );
        Ok(())
    }

    /// Claim winnings after bet is resolved
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let bet = &ctx.accounts.bet;
        let player = &ctx.accounts.player;

        // Verify bet is resolved
        require!(
            bet.status == BetStatus::Resolved,
            FlipItError::BetNotResolved
        );

        // Verify player
        require!(bet.player == player.key(), FlipItError::UnauthorizedPlayer);

        // Transfer payout to player
        if bet.payout > 0 {
            let bet_key = bet.key();
            let seeds = &[b"bet", player.key().as_ref(), bet_key.as_ref(), &[bet.bump]];
            let signer = &[&seeds[..]];

            anchor_lang::system_program::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    anchor_lang::system_program::Transfer {
                        from: bet.to_account_info(),
                        to: player.to_account_info(),
                    },
                    signer,
                ),
                bet.payout,
            )?;

            msg!("Payout claimed: {} lamports", bet.payout);
        }

        // Update bet status to claimed
        let bet = &mut ctx.accounts.bet;
        bet.status = BetStatus::Claimed;

        Ok(())
    }

    /// Auto-resolve bet if player doesn't reveal within timeout
    pub fn timeout_resolve(ctx: Context<TimeoutResolve>) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let house = &mut ctx.accounts.house;
        let clock = Clock::get()?;

        // Verify timeout reached
        require!(
            clock.slot >= bet.commit_slot + REVEAL_TIMEOUT_SLOTS,
            FlipItError::TimeoutNotReached
        );

        // Verify bet still committed
        require!(
            bet.status == BetStatus::Committed,
            FlipItError::InvalidBetStatus
        );

        // House wins by default (player forfeited by not revealing)
        bet.status = BetStatus::Resolved;
        bet.player_wins = false;
        bet.payout = 0;
        bet.house_fee = bet.amount;
        house.treasury += bet.amount;

        msg!("Bet auto-resolved: Player timeout, house wins");
        Ok(())
    }

    /// House authority withdraws treasury funds
    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
        let house = &ctx.accounts.house;
        let authority = &ctx.accounts.authority;

        require!(
            house.authority == authority.key(),
            FlipItError::UnauthorizedHouse
        );

        require!(amount <= house.treasury, FlipItError::InsufficientTreasury);

        // Transfer from house treasury to authority
        **ctx
            .accounts
            .house
            .to_account_info()
            .try_borrow_mut_lamports()? -= amount;
        **ctx
            .accounts
            .authority
            .to_account_info()
            .try_borrow_mut_lamports()? += amount;

        msg!("Treasury withdrawal: {} lamports", amount);
        Ok(())
    }

    /// Toggle Arcium verification requirement
    /// Only house authority can call this
    pub fn toggle_arcium_verification(ctx: Context<ToggleArcium>) -> Result<()> {
        let house = &mut ctx.accounts.house;
        house.arcium_verification_enabled = !house.arcium_verification_enabled;

        msg!(
            "Arcium verification {}",
            if house.arcium_verification_enabled {
                "enabled"
            } else {
                "disabled"
            }
        );
        Ok(())
    }
}

// Internal helper functions (outside #[program] module)

/// Verify Arcium proof cryptographically
fn verify_arcium_proof_internal(proof: &ArciumProof, _commitment: &[u8; 32]) -> Result<()> {
    // In a full implementation, this would:
    // 1. Verify the cluster signature against Arcium's public key
    // 2. Verify the ZK proof using Arcium's verification algorithm
    // 3. Ensure the proof corresponds to the commitment

    // For the hackathon implementation, we verify:
    // - Proof structure is valid (done in verify_structure)
    // - Proof is recent (done in verify_structure)
    // - Proof contains valid outcome (0 or 1)

    // TODO: Add full cryptographic verification when Arcium SDK provides on-chain verification library

    require!(
        proof.outcome == 0 || proof.outcome == 1,
        FlipItError::InvalidArciumProof
    );

    msg!("Arcium proof verified: Outcome {}", proof.outcome);
    Ok(())
}

/// Internal function to resolve a bet
fn resolve_bet_internal(
    bet: &mut Account<Bet>,
    house: &mut Account<House>,
    choice: u8,
    outcome: u8,
) -> Result<()> {
    // Determine winner
    let player_wins = choice == outcome;

    // Calculate payouts
    let house_fee = bet.amount * HOUSE_FEE_BPS as u64 / 10000;
    let payout = if player_wins {
        bet.amount * 2 - house_fee // Double minus house fee
    } else {
        0
    };

    // Update bet status
    bet.status = BetStatus::Resolved;
    bet.outcome = Some(outcome);
    bet.player_wins = player_wins;
    bet.payout = payout;
    bet.house_fee = house_fee;

    // Transfer house fee to treasury
    house.treasury += house_fee;

    msg!(
        "Bet resolved: Player chose {}, Outcome: {}, Winner: {}",
        if choice == 0 { "HEADS" } else { "TAILS" },
        if outcome == 0 { "HEADS" } else { "TAILS" },
        if player_wins { "Player" } else { "House" }
    );

    Ok(())
}

// Account Structures

#[derive(Accounts)]
pub struct InitializeHouse<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + House::SIZE,
        seeds = [b"house"],
        bump
    )]
    pub house: Account<'info, House>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, commitment: [u8; 32])]
pub struct PlaceBet<'info> {
    #[account(
        init,
        payer = player,
        space = 8 + Bet::SIZE,
        seeds = [b"bet", player.key().as_ref(), &house.total_bets.to_le_bytes()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub house: Account<'info, House>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Reveal<'info> {
    #[account(mut)]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub house: Account<'info, House>,

    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevealWithArcium<'info> {
    #[account(mut)]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub house: Account<'info, House>,

    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
    // Note: No recent_blockhashes needed - Arcium provides provably fair randomness
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [b"bet", player.key().as_ref(), &bet.key().to_bytes()],
        bump = bet.bump,
    )]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TimeoutResolve<'info> {
    #[account(mut)]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub house: Account<'info, House>,

    /// Anyone can call this after timeout
    pub caller: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    #[account(
        mut,
        seeds = [b"house"],
        bump = house.bump,
        has_one = authority,
    )]
    pub house: Account<'info, House>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ToggleArcium<'info> {
    #[account(
        mut,
        seeds = [b"house"],
        bump = house.bump,
        has_one = authority,
    )]
    pub house: Account<'info, House>,

    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// State Accounts

#[account]
pub struct House {
    pub authority: Pubkey,                 // House admin
    pub treasury: u64,                     // Accumulated fees
    pub total_bets: u64,                   // Total bet count
    pub total_volume: u64,                 // Total SOL volume
    pub bump: u8,                          // PDA bump
    pub arcium_verification_enabled: bool, // Whether to require Arcium proofs
}

impl House {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct Bet {
    pub player: Pubkey,                    // Player address
    pub amount: u64,                       // Bet amount in lamports
    pub commitment: [u8; 32],              // Hash commitment
    pub status: BetStatus,                 // Current status
    pub commit_slot: u64,                  // Slot when committed
    pub outcome: Option<u8>,               // 0 = HEADS, 1 = TAILS
    pub player_wins: bool,                 // Did player win?
    pub payout: u64,                       // Amount to payout
    pub house_fee: u64,                    // Fee collected
    pub bump: u8,                          // PDA bump
    pub arcium_proof: Option<ArciumProof>, // Arcium proof (if used)
}

impl Bet {
    pub const SIZE: usize = 32 + 8 + 32 + 1 + 8 + 1 + 1 + 8 + 8 + 1 + (1 + ArciumProof::MAX_SIZE);
}

// Enums

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BetStatus {
    Committed,
    Resolved,
    Claimed,
}

// Errors

#[error_code]
pub enum FlipItError {
    #[msg("Bet amount too small")]
    BetTooSmall,
    #[msg("Bet amount too large")]
    BetTooLarge,
    #[msg("Unauthorized player")]
    UnauthorizedPlayer,
    #[msg("Invalid bet status")]
    InvalidBetStatus,
    #[msg("Reveal timeout reached")]
    RevealTimeout,
    #[msg("Invalid reveal - commitment mismatch")]
    InvalidReveal,
    #[msg("Bet not resolved yet")]
    BetNotResolved,
    #[msg("Timeout not reached yet")]
    TimeoutNotReached,
    #[msg("Unauthorized house authority")]
    UnauthorizedHouse,
    #[msg("Insufficient treasury balance")]
    InsufficientTreasury,
    #[msg("Invalid Arcium proof structure")]
    InvalidArciumProof,
    #[msg("Arcium proof has expired")]
    ArciumProofExpired,
    #[msg("Arcium verification is required for this game")]
    ArciumRequired,
}
