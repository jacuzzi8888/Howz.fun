use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use anchor_lang::solana_program::hash::hash;

// Program ID - Replace with actual after deployment
declare_id!("Derby111111111111111111111111111111111111111");

// Constants
pub const HOUSE_FEE_BPS: u16 = 100; // 1% house fee
pub const MIN_BET_LAMPORTS: u64 = 1_000_000; // 0.001 SOL
pub const MAX_BET_LAMPORTS: u64 = 100_000_000_000; // 100 SOL
pub const RACE_DURATION_SLOTS: u64 = 300; // ~2 minutes betting window
pub const MIN_HORSES: u8 = 2;
pub const MAX_HORSES: u8 = 8;

#[program]
pub mod degen_derby {
    use super::*;

    /// Initialize the Degen Derby house
    pub fn initialize_house(ctx: Context<InitializeHouse>) -> Result<()> {
        let house = &mut ctx.accounts.house;
        house.authority = ctx.accounts.authority.key();
        house.treasury = 0;
        house.total_races = 0;
        house.total_volume = 0;
        house.bump = ctx.bumps.house;
        
        msg!("Degen Derby House initialized: {}", house.key());
        Ok(())
    }

    /// Create a new race with horses
    pub fn create_race(
        ctx: Context<CreateRace>,
        horses: Vec<HorseData>, // Horse names and initial odds
    ) -> Result<()> {
        require!(
            horses.len() >= MIN_HORSES as usize && horses.len() <= MAX_HORSES as usize,
            DegenDerbyError::InvalidHorseCount
        );

        let race = &mut ctx.accounts.race;
        let house = &mut ctx.accounts.house;
        let clock = Clock::get()?;

        race.creator = ctx.accounts.creator.key();
        race.horses = horses;
        race.total_bets = vec![0; race.horses.len()]; // Initialize bet totals for each horse
        race.player_counts = vec![0; race.horses.len()];
        race.status = RaceStatus::Open;
        race.created_at_slot = clock.slot;
        race.winner = None;
        race.house_fee = 0;
        race.bump = ctx.bumps.race;

        house.total_races += 1;

        msg!("Race created with {} horses", race.horses.len());
        Ok(())
    }

    /// Place bet on a horse
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        horse_index: u8, // Index of horse in the race.horses vec
    ) -> Result<()> {
        require!(amount >= MIN_BET_LAMPORTS, DegenDerbyError::BetTooSmall);
        require!(amount <= MAX_BET_LAMPORTS, DegenDerbyError::BetTooLarge);

        let race = &mut ctx.accounts.race;
        let player_bet = &mut ctx.accounts.player_bet;
        let player = &ctx.accounts.player;

        // Validate race is open
        require!(
            race.status == RaceStatus::Open,
            DegenDerbyError::RaceNotOpen
        );

        // Validate horse index
        require!(
            (horse_index as usize) < race.horses.len(),
            DegenDerbyError::InvalidHorseIndex
        );

        // Check if player already bet on this race
        require!(
            player_bet.amount == 0,
            DegenDerbyError::AlreadyBet
        );

        // Record the bet
        player_bet.player = player.key();
        player_bet.race_pda = race.key();
        player_bet.amount = amount;
        player_bet.horse_index = horse_index;
        player_bet.claimed = false;
        player_bet.bump = ctx.bumps.player_bet;

        // Update race totals
        race.total_bets[horse_index as usize] += amount;
        race.player_counts[horse_index as usize] += 1;

        // Transfer SOL to race escrow
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &player.key(),
            &race.key(),
            amount,
        );
        
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                player.to_account_info(),
                race.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        msg!(
            "Bet placed: {} lamports on horse {} in race {}",
            amount,
            horse_index,
            race.key()
        );
        Ok(())
    }

    /// Start the race (closes betting)
    pub fn start_race(ctx: Context<StartRace>) -> Result<()> {
        let race = &mut ctx.accounts.race;
        let clock = Clock::get()?;

        // Verify race is open
        require!(
            race.status == RaceStatus::Open,
            DegenDerbyError::RaceNotOpen
        );

        // Verify betting window has passed or minimum bets reached
        require!(
            clock.slot >= race.created_at_slot + RACE_DURATION_SLOTS,
            DegenDerbyError::RaceNotReady
        );

        race.status = RaceStatus::Running;
        race.started_at_slot = clock.slot;

        msg!("Race started: {}", race.key());
        Ok(())
    }

    /// Resolve race with randomized winner
    pub fn resolve_race(ctx: Context<ResolveRace>) -> Result<()> {
        let race = &mut ctx.accounts.race;
        let house = &mut ctx.accounts.house;
        let clock = Clock::get()?;

        // Verify race is running
        require!(
            race.status == RaceStatus::Running,
            DegenDerbyError::RaceNotRunning
        );

        // Calculate total pool
        let total_pool: u64 = race.total_bets.iter().sum();
        let house_fee = total_pool * HOUSE_FEE_BPS as u64 / 10000;
        house.treasury += house_fee;
        house.total_volume += total_pool;

        // Generate random winner using recent blockhash
        let recent_blockhash = ctx.accounts.recent_blockhashes.last_blockhash();
        let mut random_seed = recent_blockhash.0.to_vec();
        random_seed.extend_from_slice(&clock.slot.to_le_bytes());
        let random_hash = hash(&random_seed).to_bytes();
        
        // Weighted random selection based on bet amounts (inverse odds)
        // More money on a horse = lower chance to win (house advantage)
        let winner_index = select_weighted_winner(&race.total_bets, &random_hash);

        // Update race
        race.status = RaceStatus::Finished;
        race.winner = Some(winner_index as u8);
        race.finished_at_slot = clock.slot;
        race.house_fee = house_fee;

        msg!(
            "Race finished! Winner: horse {}. Total pool: {} lamports, House fee: {}",
            winner_index,
            total_pool,
            house_fee
        );
        Ok(())
    }

    /// Claim winnings for a finished race
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let race = &ctx.accounts.race;
        let player_bet = &mut ctx.accounts.player_bet;
        let player = &ctx.accounts.player;

        // Verify race is finished
        require!(
            race.status == RaceStatus::Finished,
            DegenDerbyError::RaceNotFinished
        );

        // Verify player won
        let winner_index = race.winner.ok_or(DegenDerbyError::RaceNotFinished)?;
        require!(
            player_bet.horse_index == winner_index,
            DegenDerbyError::NotWinner
        );

        // Verify not already claimed
        require!(
            !player_bet.claimed,
            DegenDerbyError::AlreadyClaimed
        );

        // Calculate winnings (proportional to bet)
        let total_winning_pool = race.total_bets[winner_index as usize];
        let total_losing_pool: u64 = race.total_bets
            .iter()
            .enumerate()
            .filter(|(i, _)| *i != winner_index as usize)
            .map(|(_, bet)| bet)
            .sum();

        // Proportional winnings minus house fee
        let winnings_from_pool = if total_winning_pool > 0 {
            (player_bet.amount * total_losing_pool) / total_winning_pool
        } else {
            0
        };

        let total_payout = player_bet.amount + winnings_from_pool;

        // Mark as claimed
        player_bet.claimed = true;

        // Transfer winnings
        let race_key = race.key();
        let seeds = &[
            b"race",
            race_key.as_ref(),
            &[race.bump],
        ];
        let signer = &[&seeds[..]];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: race.to_account_info(),
                    to: player.to_account_info(),
                },
                signer,
            ),
            total_payout,
        )?;

        msg!(
            "Winnings claimed: {} lamports (bet: {}, winnings: {})",
            total_payout,
            player_bet.amount,
            winnings_from_pool
        );
        Ok(())
    }

    /// Withdraw treasury (admin only)
    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
        let house = &ctx.accounts.house;
        
        require!(
            house.authority == ctx.accounts.authority.key(),
            DegenDerbyError::UnauthorizedHouse
        );
        
        require!(
            amount <= house.treasury,
            DegenDerbyError::InsufficientTreasury
        );

        **ctx.accounts.house.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;

        msg!("Treasury withdrawal: {} lamports", amount);
        Ok(())
    }
}

// Helper function for weighted random selection
fn select_weighted_winner(bets: &Vec<u64>, random_hash: &[u8; 32]) -> usize {
    let total_bets: u64 = bets.iter().sum();
    if total_bets == 0 {
        // Random selection if no bets
        let random_value = u64::from_le_bytes([
            random_hash[0], random_hash[1], random_hash[2], random_hash[3],
            random_hash[4], random_hash[5], random_hash[6], random_hash[7],
        ]);
        return (random_value % bets.len() as u64) as usize;
    }

    // Inverse weighting: less popular horses have higher chance
    let inverse_weights: Vec<u64> = bets
        .iter()
        .map(|bet| {
            if *bet == 0 {
                total_bets * 2 // Unbet horses get 2x weight
            } else {
                (total_bets * total_bets) / bet // Inverse proportion
            }
        })
        .collect();

    let total_weight: u64 = inverse_weights.iter().sum();
    let random_value = u64::from_le_bytes([
        random_hash[0], random_hash[1], random_hash[2], random_hash[3],
        random_hash[4], random_hash[5], random_hash[6], random_hash[7],
    ]);
    let target = random_value % total_weight;

    let mut cumulative = 0u64;
    for (i, weight) in inverse_weights.iter().enumerate() {
        cumulative += weight;
        if target < cumulative {
            return i;
        }
    }

    bets.len() - 1 // Fallback
}

// Account Structures

#[derive(Accounts)]
pub struct InitializeHouse<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + DegenDerbyHouse::SIZE,
        seeds = [b"degen_derby_house"],
        bump
    )]
    pub house: Account<'info, DegenDerbyHouse>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(horses: Vec<HorseData>)]
pub struct CreateRace<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Race::SIZE,
        seeds = [b"race", &house.total_races.to_le_bytes()],
        bump
    )]
    pub race: Account<'info, Race>,
    
    #[account(mut)]
    pub house: Account<'info, DegenDerbyHouse>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, horse_index: u8)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub race: Account<'info, Race>,
    
    #[account(
        init,
        payer = player,
        space = 8 + PlayerBet::SIZE,
        seeds = [b"player_bet", race.key().as_ref(), player.key().as_ref()],
        bump
    )]
    pub player_bet: Account<'info, PlayerBet>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartRace<'info> {
    #[account(mut)]
    pub race: Account<'info, Race>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveRace<'info> {
    #[account(mut)]
    pub race: Account<'info, Race>,
    
    #[account(mut)]
    pub house: Account<'info, DegenDerbyHouse>,
    
    /// CHECK: Recent blockhashes for randomness
    pub recent_blockhashes: AccountInfo<'info>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [b"race", &race.key().to_bytes()],
        bump = race.bump,
    )]
    pub race: Account<'info, Race>,
    
    #[account(
        mut,
        seeds = [b"player_bet", race.key().as_ref(), player.key().as_ref()],
        bump = player_bet.bump,
    )]
    pub player_bet: Account<'info, PlayerBet>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    #[account(
        mut,
        seeds = [b"degen_derby_house"],
        bump = house.bump,
    )]
    pub house: Account<'info, DegenDerbyHouse>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// State Accounts

#[account]
pub struct DegenDerbyHouse {
    pub authority: Pubkey,
    pub treasury: u64,
    pub total_races: u64,
    pub total_volume: u64,
    pub bump: u8,
}

impl DegenDerbyHouse {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct HorseData {
    pub name: String,      // 4 bytes + up to 20 chars
    pub odds: u16,         // Fixed odds display (e.g., 850 = 8.5x)
}

#[account]
pub struct Race {
    pub creator: Pubkey,
    pub horses: Vec<HorseData>,           // Dynamic size
    pub total_bets: Vec<u64>,             // Parallel to horses
    pub player_counts: Vec<u32>,          // Parallel to horses
    pub status: RaceStatus,
    pub created_at_slot: u64,
    pub started_at_slot: u64,
    pub finished_at_slot: u64,
    pub winner: Option<u8>,
    pub house_fee: u64,
    pub bump: u8,
}

impl Race {
    // Base size + space for up to 8 horses with 20 char names
    pub const SIZE: usize = 32 + (4 + 8 * (4 + 20 + 2)) + (4 + 8 * 8) + (4 + 8 * 4) + 1 + 8 + 8 + 8 + 1 + 8 + 1;
}

#[account]
pub struct PlayerBet {
    pub player: Pubkey,
    pub race_pda: Pubkey,
    pub amount: u64,
    pub horse_index: u8,
    pub claimed: bool,
    pub bump: u8,
}

impl PlayerBet {
    pub const SIZE: usize = 32 + 32 + 8 + 1 + 1 + 1;
}

// Enums

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum RaceStatus {
    Open,
    Running,
    Finished,
}

// Errors

#[error_code]
pub enum DegenDerbyError {
    #[msg("Bet amount too small")]
    BetTooSmall,
    #[msg("Bet amount too large")]
    BetTooLarge,
    #[msg("Invalid horse count (2-8 allowed)")]
    InvalidHorseCount,
    #[msg("Invalid horse index")]
    InvalidHorseIndex,
    #[msg("Race is not open for betting")]
    RaceNotOpen,
    #[msg("Race is not running")]
    RaceNotRunning,
    #[msg("Race is not finished")]
    RaceNotFinished,
    #[msg("Race betting window not complete")]
    RaceNotReady,
    #[msg("Player already bet on this race")]
    AlreadyBet,
    #[msg("Player did not win")]
    NotWinner,
    #[msg("Winnings already claimed")]
    AlreadyClaimed,
    #[msg("Unauthorized house authority")]
    UnauthorizedHouse,
    #[msg("Insufficient treasury balance")]
    InsufficientTreasury,
}
