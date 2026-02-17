use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use pyth_solana_receiver_sdk::price_update::{PriceUpdateV2, FeedId};

// Program ID - Replace with actual after deployment
declare_id!("GpFdMHcrcFusgR6JMnQVakfQvrXioEw3RJGrMFkBu7nW");

// Constants
pub const HOUSE_FEE_BPS: u16 = 100; // 1% house fee
pub const MIN_BET_LAMPORTS: u64 = 1_000_000; // 0.001 SOL
pub const MAX_BET_LAMPORTS: u64 = 100_000_000_000; // 100 SOL
pub const MATCH_TIMEOUT_SLOTS: u64 = 300; // ~2 minutes

#[program]
pub mod fight_club {
    use super::*;

    /// Initialize the Fight Club house
    pub fn initialize_house(ctx: Context<InitializeHouse>) -> Result<()> {
        let house = &mut ctx.accounts.house;
        house.authority = ctx.accounts.authority.key();
        house.treasury = 0;
        house.total_matches = 0;
        house.total_volume = 0;
        house.bump = ctx.bumps.house;
        
        msg!("Fight Club House initialized: {}", house.key());
        Ok(())
    }

    /// Create a new fight match with Pyth Price Feeds
    pub fn create_match_v2(
        ctx: Context<CreateMatchV2>,
        token_a: String,
        token_b: String,
        feed_id_a: [u8; 32],
        feed_id_b: [u8; 32],
    ) -> Result<()> {
        let fight_match = &mut ctx.accounts.fight_match;
        let house = &mut ctx.accounts.house;
        let clock = Clock::get()?;

        fight_match.creator = ctx.accounts.creator.key();
        fight_match.token_a = token_a;
        fight_match.token_b = token_b;
        fight_match.feed_id_a = feed_id_a;
        fight_match.feed_id_b = feed_id_b;
        
        // Fetch initial prices from Pyth
        let price_update_a = &ctx.accounts.price_update_a;
        let price_data_a = price_update_a.get_price_no_older_than(&clock, 60, &feed_id_a)?;
        fight_match.start_price_a = price_data_a.price;

        let price_update_b = &ctx.accounts.price_update_b;
        let price_data_b = price_update_b.get_price_no_older_than(&clock, 60, &feed_id_b)?;
        fight_match.start_price_b = price_data_b.price;

        fight_match.total_bet_a = 0;
        fight_match.total_bet_b = 0;
        fight_match.player_count_a = 0;
        fight_match.player_count_b = 0;
        fight_match.status = MatchStatus::Open;
        fight_match.created_at_slot = clock.slot;
        fight_match.winner = None;
        fight_match.bump = ctx.bumps.fight_match;

        house.total_matches += 1;

        msg!(
            "Fight created V2: {} ({}) vs {} ({})", 
            fight_match.token_a, 
            price_data_a.price,
            fight_match.token_b,
            price_data_b.price
        );
        Ok(())
    }

    /// Place bet on a fighter (token A or B)
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        side: u8, // 0 = Token A, 1 = Token B
    ) -> Result<()> {
        require!(side == 0 || side == 1, FightClubError::InvalidSide);
        require!(amount >= MIN_BET_LAMPORTS, FightClubError::BetTooSmall);
        require!(amount <= MAX_BET_LAMPORTS, FightClubError::BetTooLarge);

        let fight_match = &mut ctx.accounts.fight_match;
        let player_bet = &mut ctx.accounts.player_bet;
        let player = &ctx.accounts.player;

        // Ensure match is still open
        require!(
            fight_match.status == MatchStatus::Open,
            FightClubError::MatchNotOpen
        );

        // Check if player already bet on this match
        require!(
            player_bet.amount == 0,
            FightClubError::AlreadyBet
        );

        // Record the bet
        player_bet.player = player.key();
        player_bet.match_pda = fight_match.key();
        player_bet.amount = amount;
        player_bet.side = side;
        player_bet.claimed = false;
        player_bet.bump = ctx.bumps.player_bet;

        // Update match totals
        if side == 0 {
            fight_match.total_bet_a += amount;
            fight_match.player_count_a += 1;
        } else {
            fight_match.total_bet_b += amount;
            fight_match.player_count_b += 1;
        }

        // Transfer SOL to match escrow
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &player.key(),
            &fight_match.key(),
            amount,
        );
        
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                player.to_account_info(),
                fight_match.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        msg!(
            "Bet placed: {} lamports on {} in match {}",
            amount,
            if side == 0 { &fight_match.token_a } else { &fight_match.token_b },
            fight_match.key()
        );
        Ok(())
    }

    /// Resolve match and determine winner using Pyth Price feeds
    pub fn resolve_with_pyth(
        ctx: Context<ResolveWithPyth>
    ) -> Result<()> {
        let fight_match = &mut ctx.accounts.fight_match;
        let house = &mut ctx.accounts.house;
        let clock = Clock::get()?;

        // Ensure match is open
        require!(
            fight_match.status == MatchStatus::Open,
            FightClubError::MatchNotOpen
        );

        // Fetch final prices from Pyth
        let price_update_a = &ctx.accounts.price_update_a;
        let price_data_a = price_update_a.get_price_no_older_than(&clock, 60, &fight_match.feed_id_a)?;
        fight_match.end_price_a = price_data_a.price;

        let price_update_b = &ctx.accounts.price_update_b;
        let price_data_b = price_update_b.get_price_no_older_than(&clock, 60, &fight_match.feed_id_b)?;
        fight_match.end_price_b = price_data_b.price;

        // Calculate performance (%)
        // Perf = (End - Start) * 10000 / Start (using BPS for precision)
        let perf_a = (fight_match.end_price_a - fight_match.start_price_a) * 10000 / fight_match.start_price_a;
        let perf_b = (fight_match.end_price_b - fight_match.start_price_b) * 10000 / fight_match.start_price_b;

        let winner_side = if perf_a >= perf_b { 0 } else { 1 };

        // Calculate house fee from total pool
        let total_pool = fight_match.total_bet_a + fight_match.total_bet_b;
        let house_fee = total_pool * HOUSE_FEE_BPS as u64 / 10000;
        house.treasury += house_fee;
        house.total_volume += total_pool;

        // Update match
        fight_match.status = MatchStatus::Resolved;
        fight_match.winner = Some(winner_side);
        fight_match.resolved_at_slot = clock.slot;
        fight_match.house_fee = house_fee;

        msg!(
            "Match resolved via Pyth! Winner: {}. Pool: {} lamports",
            if winner_side == 0 { &fight_match.token_a } else { &fight_match.token_b },
            total_pool
        );
        Ok(())
    }

    /// Claim winnings for a resolved match
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let fight_match = &ctx.accounts.fight_match;
        let player_bet = &mut ctx.accounts.player_bet;
        let player = &ctx.accounts.player;

        // Verify match is resolved
        require!(
            fight_match.status == MatchStatus::Resolved,
            FightClubError::MatchNotResolved
        );

        // Verify player won
        let winner_side = fight_match.winner.ok_or(FightClubError::MatchNotResolved)?;
        require!(
            player_bet.side == winner_side,
            FightClubError::NotWinner
        );

        // Verify not already claimed
        require!(
            !player_bet.claimed,
            FightClubError::AlreadyClaimed
        );

        // Calculate winnings
        let total_losing_pool = if winner_side == 0 {
            fight_match.total_bet_b
        } else {
            fight_match.total_bet_a
        };
        
        let total_winning_pool = if winner_side == 0 {
            fight_match.total_bet_a
        } else {
            fight_match.total_bet_b
        };

        // Proportional winnings: (player_bet / total_winning_pool) * total_losing_pool
        let winnings_from_pool = if total_winning_pool > 0 {
            (player_bet.amount * total_losing_pool) / total_winning_pool
        } else {
            0
        };

        let total_payout = player_bet.amount + winnings_from_pool;

        // Mark as claimed
        player_bet.claimed = true;

        // Transfer winnings
        let match_key = fight_match.key();
        let seeds = &[
            b"match",
            match_key.as_ref(),
            &[fight_match.bump],
        ];
        let signer = &[&seeds[..]];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: fight_match.to_account_info(),
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

    /// Cancel match and refund bets (admin only, before resolution)
    pub fn cancel_match(ctx: Context<CancelMatch>) -> Result<()> {
        let fight_match = &mut ctx.accounts.fight_match;
        let house = &ctx.accounts.house;

        // Verify authority
        require!(
            house.authority == ctx.accounts.authority.key(),
            FightClubError::UnauthorizedHouse
        );

        // Ensure match is still open
        require!(
            fight_match.status == MatchStatus::Open,
            FightClubError::MatchNotOpen
        );

        fight_match.status = MatchStatus::Cancelled;

        msg!("Match cancelled: {}", fight_match.key());
        Ok(())
    }

    /// Refund bet for cancelled match
    pub fn refund_bet(ctx: Context<RefundBet>) -> Result<()> {
        let fight_match = &ctx.accounts.fight_match;
        let player_bet = &mut ctx.accounts.player_bet;
        let player = &ctx.accounts.player;

        // Verify match is cancelled
        require!(
            fight_match.status == MatchStatus::Cancelled,
            FightClubError::MatchNotCancelled
        );

        // Verify not already claimed/refunded
        require!(
            !player_bet.claimed,
            FightClubError::AlreadyClaimed
        );

        // Mark as claimed (refunded)
        player_bet.claimed = true;

        // Refund the bet amount
        let match_key = fight_match.key();
        let seeds = &[
            b"match",
            match_key.as_ref(),
            &[fight_match.bump],
        ];
        let signer = &[&seeds[..]];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: fight_match.to_account_info(),
                    to: player.to_account_info(),
                },
                signer,
            ),
            player_bet.amount,
        )?;

        msg!("Bet refunded: {} lamports", player_bet.amount);
        Ok(())
    }

    /// Withdraw treasury (admin only)
    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
        let house = &ctx.accounts.house;
        
        require!(
            house.authority == ctx.accounts.authority.key(),
            FightClubError::UnauthorizedHouse
        );
        
        require!(
            amount <= house.treasury,
            FightClubError::InsufficientTreasury
        );

        **ctx.accounts.house.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;

        msg!("Treasury withdrawal: {} lamports", amount);
        Ok(())
    }
}

// Account Structures

#[derive(Accounts)]
pub struct InitializeHouse<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + FightClubHouse::SIZE,
        seeds = [b"fight_club_house"],
        bump
    )]
    pub house: Account<'info, FightClubHouse>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(token_a: String, token_b: String, feed_id_a: [u8; 32], feed_id_b: [u8; 32])]
pub struct CreateMatchV2<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + FightMatch::SIZE,
        seeds = [b"match", &house.total_matches.to_le_bytes()],
        bump
    )]
    pub fight_match: Account<'info, FightMatch>,
    
    #[account(mut)]
    pub house: Account<'info, FightClubHouse>,
    
    #[account(mut)]
    pub creator: Signer<'info>,

    pub price_update_a: Account<'info, PriceUpdateV2>,
    pub price_update_b: Account<'info, PriceUpdateV2>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateMatch<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + FightMatch::SIZE,
        seeds = [b"match", &house.total_matches.to_le_bytes()],
        bump
    )]
    pub fight_match: Account<'info, FightMatch>,
    
    #[account(mut)]
    pub house: Account<'info, FightClubHouse>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, side: u8)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub fight_match: Account<'info, FightMatch>,
    
    #[account(
        init,
        payer = player,
        space = 8 + PlayerBet::SIZE,
        seeds = [b"player_bet", fight_match.key().as_ref(), player.key().as_ref()],
        bump
    )]
    pub player_bet: Account<'info, PlayerBet>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveWithPyth<'info> {
    #[account(mut)]
    pub fight_match: Account<'info, FightMatch>,
    
    #[account(mut)]
    pub house: Account<'info, FightClubHouse>,

    pub price_update_a: Account<'info, PriceUpdateV2>,
    pub price_update_b: Account<'info, PriceUpdateV2>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveMatch<'info> {
    #[account(mut)]
    pub fight_match: Account<'info, FightMatch>,
    
    #[account(mut)]
    pub house: Account<'info, FightClubHouse>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [b"match", &fight_match.key().to_bytes()],
        bump = fight_match.bump,
    )]
    pub fight_match: Account<'info, FightMatch>,
    
    #[account(
        mut,
        seeds = [b"player_bet", fight_match.key().as_ref(), player.key().as_ref()],
        bump = player_bet.bump,
    )]
    pub player_bet: Account<'info, PlayerBet>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelMatch<'info> {
    #[account(mut)]
    pub fight_match: Account<'info, FightMatch>,
    
    pub house: Account<'info, FightClubHouse>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RefundBet<'info> {
    #[account(
        mut,
        seeds = [b"match", &fight_match.key().to_bytes()],
        bump = fight_match.bump,
    )]
    pub fight_match: Account<'info, FightMatch>,
    
    #[account(
        mut,
        seeds = [b"player_bet", fight_match.key().as_ref(), player.key().as_ref()],
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
        seeds = [b"fight_club_house"],
        bump = house.bump,
    )]
    pub house: Account<'info, FightClubHouse>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// State Accounts

#[account]
pub struct FightClubHouse {
    pub authority: Pubkey,
    pub treasury: u64,
    pub total_matches: u64,
    pub total_volume: u64,
    pub bump: u8,
}

impl FightClubHouse {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 1;
}

#[account]
pub struct FightMatch {
    pub creator: Pubkey,
    pub token_a: String,      // 4 bytes length + 10 chars max
    pub token_b: String,      // 4 bytes length + 10 chars max
    pub feed_id_a: [u8; 32],
    pub feed_id_b: [u8; 32],
    pub start_price_a: i64,
    pub start_price_b: i64,
    pub end_price_a: i64,
    pub end_price_b: i64,
    pub total_bet_a: u64,
    pub total_bet_b: u64,
    pub player_count_a: u32,
    pub player_count_b: u32,
    pub status: MatchStatus,
    pub created_at_slot: u64,
    pub resolved_at_slot: u64,
    pub winner: Option<u8>,   // 0 = Token A, 1 = Token B
    pub house_fee: u64,
    pub bump: u8,
}

impl FightMatch {
    pub const SIZE: usize = 32 + (4 + 10) + (4 + 10) + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 4 + 4 + 1 + 8 + 8 + 1 + 8 + 1;
}

#[account]
pub struct PlayerBet {
    pub player: Pubkey,
    pub match_pda: Pubkey,
    pub amount: u64,
    pub side: u8,            // 0 = Token A, 1 = Token B
    pub claimed: bool,
    pub bump: u8,
}

impl PlayerBet {
    pub const SIZE: usize = 32 + 32 + 8 + 1 + 1 + 1;
}

// Enums

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MatchStatus {
    Open,
    Resolved,
    Cancelled,
}

// Errors

#[error_code]
pub enum FightClubError {
    #[msg("Bet amount too small")]
    BetTooSmall,
    #[msg("Bet amount too large")]
    BetTooLarge,
    #[msg("Invalid side selection")]
    InvalidSide,
    #[msg("Match is not open for betting")]
    MatchNotOpen,
    #[msg("Match is not resolved yet")]
    MatchNotResolved,
    #[msg("Match is not cancelled")]
    MatchNotCancelled,
    #[msg("Player already bet on this match")]
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
