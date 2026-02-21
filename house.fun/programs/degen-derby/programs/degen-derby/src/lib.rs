use anchor_lang::prelude::*;
// use arcium_anchor::prelude::*;
use anchor_lang::solana_program::clock::Clock;

// Program ID - Replace with actual after deployment
declare_id!("Bi47R2F3rkyDfvMHEUzyDXuv9TCFPJ3uzHpNCYPBMQeE");

// Constants
pub const HOUSE_FEE_BPS: u16 = 100; // 1% house fee
pub const MIN_BET_LAMPORTS: u64 = 1_000_000; // 0.001 SOL
pub const MAX_BET_LAMPORTS: u64 = 100_000_000_000; // 100 SOL
pub const RACE_DURATION_SLOTS: u64 = 300; // ~2 minutes betting window
pub const MIN_HORSES: u8 = 2;
pub const MAX_HORSES: u8 = 8;

// const COMP_DEF_OFFSET_DERBY: u32 = comp_def_offset("derby");

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

    /// Create a new race
    pub fn create_race(ctx: Context<CreateRace>, horses: Vec<HorseData>) -> Result<()> {
        require!(horses.len() >= MIN_HORSES as usize && horses.len() <= MAX_HORSES as usize, DegenDerbyError::InvalidHorseCount);

        let race = &mut ctx.accounts.race;
        let house = &mut ctx.accounts.house;
        let clock = Clock::get()?;

        race.creator = ctx.accounts.creator.key();
        race.horses = horses.clone();
        race.total_bets = vec![0; horses.len()];
        race.player_counts = vec![0; horses.len()];
        race.status = RaceStatus::Open;
        race.created_at_slot = clock.slot;
        race.started_at_slot = 0;
        race.finished_at_slot = 0;
        race.winner = None;
        race.house_fee = 0;
        race.bump = ctx.bumps.race;

        house.total_races += 1;
        Ok(())
    }

    /// Place a bet on a horse
    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64, horse_index: u8) -> Result<()> {
        require!(amount >= MIN_BET_LAMPORTS, DegenDerbyError::BetTooSmall);
        require!(amount <= MAX_BET_LAMPORTS, DegenDerbyError::BetTooLarge);

        let race = &mut ctx.accounts.race;
        require!(race.status == RaceStatus::Open, DegenDerbyError::RaceNotOpen);
        require!((horse_index as usize) < race.horses.len(), DegenDerbyError::InvalidHorseIndex);

        let player_bet = &mut ctx.accounts.player_bet;
        require!(player_bet.amount == 0, DegenDerbyError::AlreadyBet);

        player_bet.player = ctx.accounts.player.key();
        player_bet.race_pda = race.key();
        player_bet.amount = amount;
        player_bet.horse_index = horse_index;
        player_bet.claimed = false;
        player_bet.bump = ctx.bumps.player_bet;

        race.total_bets[horse_index as usize] += amount;
        race.player_counts[horse_index as usize] += 1;

        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.player.key(),
            &race.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.player.to_account_info(),
                race.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        Ok(())
    }

    /// Start the race
    pub fn start_race(ctx: Context<StartRace>) -> Result<()> {
        let race = &mut ctx.accounts.race;
        // Skipping authority check for hackathon ease of use by any player
        require!(race.status == RaceStatus::Open, DegenDerbyError::RaceNotOpen);
        race.status = RaceStatus::Running;
        race.started_at_slot = Clock::get()?.slot;
        Ok(())
    }

    /// Resolve Race (Temporary Pseudo-Randomness until Arcium MPC is integrated)
    pub fn resolve_race(ctx: Context<ResolveRace>) -> Result<()> {
        let race = &mut ctx.accounts.race;
        let house = &mut ctx.accounts.house;
        require!(race.status == RaceStatus::Running, DegenDerbyError::RaceNotRunning);

        let clock = Clock::get()?;
        // Pseudo-random hash using slot and unix timestamp (UNSAFE for production, replaced in Phase 2)
        let mut pseudo_hash = [0u8; 32];
        let bytes = (clock.unix_timestamp as u64).wrapping_add(clock.slot).to_le_bytes();
        pseudo_hash[0..8].copy_from_slice(&bytes);

        let winner_index = select_weighted_winner(&race.total_bets, &pseudo_hash);
        
        race.winner = Some(winner_index as u8);
        race.status = RaceStatus::Finished;
        race.finished_at_slot = clock.slot;

        // Calculate and route house fee
        let total_pool: u64 = race.total_bets.iter().sum();
        let house_fee = (total_pool * HOUSE_FEE_BPS as u64) / 10000;
        
        race.house_fee = house_fee;
        house.treasury += house_fee;
        house.total_volume += total_pool;

        **race.to_account_info().try_borrow_mut_lamports()? -= house_fee;
        **house.to_account_info().try_borrow_mut_lamports()? += house_fee;

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

        let house_fee_from_losing = (total_losing_pool * HOUSE_FEE_BPS as u64) / 10000;
        let house_fee_from_winning = (total_winning_pool * HOUSE_FEE_BPS as u64) / 10000;
        let net_losing_pool = total_losing_pool.checked_sub(house_fee_from_losing + house_fee_from_winning).unwrap_or(0);

        // Proportional winnings minus house fee
        let winnings_from_pool = if total_winning_pool > 0 {
            (player_bet.amount * net_losing_pool) / total_winning_pool
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

/*
#[init_computation_definition_accounts("derby", payer)]
#[derive(Accounts)]
pub struct InitDerbyCompDef<'info> {
...
}
*/

#[derive(Accounts)]
#[instruction(horses: Vec<HorseData>)]
pub struct CreateRace<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Race::SIZE,
        seeds = [b"race".as_ref(), house.total_races.to_le_bytes().as_ref()],
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
        seeds = [b"player_bet".as_ref(), race.key().as_ref(), player.key().as_ref()],
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
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [b"race".as_ref(), race.key().as_ref()],
        bump = race.bump,
    )]
    pub race: Account<'info, Race>,
    
    #[account(
        mut,
        seeds = [b"player_bet".as_ref(), race.key().as_ref(), player.key().as_ref()],
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

/*
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub struct DerbyOutput {
    pub winner_index: u8,
}
*/

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
    #[msg("Arcium computation verification failed")]
    ArciumVerificationFailed,
    #[msg("Cluster not set for MXE")]
    ClusterNotSet,
}
