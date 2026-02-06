use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

// Computation definition offset for flip instruction (matches encrypted-ixs)
const COMP_DEF_OFFSET_FLIP: u32 = comp_def_offset("flip");

// Program ID - will be set during deployment
declare_id!("5SLSFwTtdbomiw8fyo4obKvjBhKLaA7s7EbnWmpkgLkg");

// Constants
pub const HOUSE_FEE_BPS: u16 = 100; // 1% = 100 basis points
pub const MIN_BET_LAMPORTS: u64 = 1_000_000; // 0.001 SOL
pub const MAX_BET_LAMPORTS: u64 = 100_000_000_000; // 100 SOL

#[arcium_program]
pub mod flip_it {
    use super::*;

    // ============================================================
    // INITIALIZATION INSTRUCTIONS
    // ============================================================

    /// Initialize the house treasury account
    /// Called once when setting up the game
    pub fn initialize_house(ctx: Context<InitializeHouse>) -> Result<()> {
        let house = &mut ctx.accounts.house;
        house.authority = ctx.accounts.authority.key();
        house.treasury = 0;
        house.total_bets = 0;
        house.total_volume = 0;
        house.active_bets = 0;
        house.bump = ctx.bumps.house;

        msg!("House initialized: {}", house.key());
        Ok(())
    }

    /// Initialize the flip computation definition
    /// Called once after program deployment to register the MPC circuit
    pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)?;
        msg!("Flip computation definition initialized");
        Ok(())
    }

    // ============================================================
    // GAME INSTRUCTIONS
    // ============================================================

    /// Player places a bet with their choice
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        choice: bool, // true = HEADS, false = TAILS
    ) -> Result<()> {
        // Validate bet amount
        require!(amount >= MIN_BET_LAMPORTS, FlipItError::BetTooSmall);
        require!(amount <= MAX_BET_LAMPORTS, FlipItError::BetTooLarge);

        let bet = &mut ctx.accounts.bet;
        let player = &ctx.accounts.player;
        let clock = Clock::get()?;

        // Initialize bet state
        bet.player = player.key();
        bet.amount = amount;
        bet.choice = choice;
        bet.status = BetStatus::Placed;
        bet.placed_at = clock.unix_timestamp;
        bet.bump = ctx.bumps.bet;
        bet.player_wins = false;
        bet.payout = 0;
        bet.house_fee = 0;

        // Transfer SOL from player to bet escrow PDA
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
        house.active_bets += 1;

        msg!(
            "Bet placed: {} lamports on {} by {}",
            amount,
            if choice { "HEADS" } else { "TAILS" },
            player.key()
        );
        Ok(())
    }

    /// Request the coin flip computation from Arcium MPC cluster
    pub fn flip(
        ctx: Context<Flip>,
        computation_offset: u64,
        user_choice: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        // Build encrypted arguments for the flip circuit
        // Matches UserChoice struct in encrypted-ixs: { choice: bool }
        let args = ArgBuilder::new()
            .x25519_pubkey(pub_key)
            .plaintext_u128(nonce)
            .encrypted_u8(user_choice) // bool encoded as u8
            .build();

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        // Queue the computation
        // Callback accounts are defined in FlipCallback struct via #[callback_accounts("flip")]
        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            vec![FlipCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[],
            )?],
            1,
            0,
        )?;

        // Update bet status
        let bet = &mut ctx.accounts.bet;
        bet.status = BetStatus::Flipping;

        msg!("Flip requested for bet: {}", bet.key());
        Ok(())
    }

    /// Callback from Arcium MPC cluster with the flip result
    #[arcium_callback(encrypted_ix = "flip")]
    pub fn flip_callback(
        ctx: Context<FlipCallback>,
        output: SignedComputationOutputs<FlipOutput>,
    ) -> Result<()> {
        // Verify and extract the computation output
        let player_wins = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account,
        ) {
            Ok(FlipOutput { field_0 }) => field_0,
            Err(_) => return Err(FlipItError::ArciumVerificationFailed.into()),
        };

        let bet = &mut ctx.accounts.bet;
        let house = &mut ctx.accounts.house;

        // Calculate payouts
        let house_fee = bet.amount * HOUSE_FEE_BPS as u64 / 10000;
        let payout = if player_wins {
            bet.amount * 2 - house_fee
        } else {
            0
        };

        // Update bet with results
        bet.player_wins = player_wins;
        bet.payout = payout;
        bet.house_fee = house_fee;
        bet.status = BetStatus::Resolved;

        // Update house treasury
        house.treasury += if player_wins { house_fee } else { bet.amount };
        house.active_bets -= 1;

        emit!(FlipEvent {
            bet: bet.key(),
            player: bet.player,
            player_wins,
            payout,
        });

        msg!(
            "Flip resolved: winner = {}",
            if player_wins { "Player" } else { "House" }
        );

        Ok(())
    }

    /// Claim winnings after bet is resolved
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let bet = &ctx.accounts.bet;
        let player = &ctx.accounts.player;

        require!(
            bet.status == BetStatus::Resolved,
            FlipItError::BetNotResolved
        );
        require!(bet.player == player.key(), FlipItError::UnauthorizedPlayer);

        if bet.payout > 0 {
            let bet_key = bet.key();
            let seeds = &[
                b"bet",
                bet.player.as_ref(),
                &bet_key.to_bytes()[..8],
                &[bet.bump],
            ];
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

        let bet = &mut ctx.accounts.bet;
        bet.status = BetStatus::Claimed;

        Ok(())
    }

    // ============================================================
    // HOUSE MANAGEMENT
    // ============================================================

    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
        let house = &mut ctx.accounts.house;

        require!(
            house.authority == ctx.accounts.authority.key(),
            FlipItError::UnauthorizedHouse
        );
        require!(amount <= house.treasury, FlipItError::InsufficientTreasury);

        // Update house treasury BEFORE transferring (avoids double borrow)
        house.treasury -= amount;

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

    pub fn deposit_treasury(ctx: Context<DepositTreasury>, amount: u64) -> Result<()> {
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.depositor.key(),
            &ctx.accounts.house.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.depositor.to_account_info(),
                ctx.accounts.house.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        ctx.accounts.house.treasury += amount;

        msg!("Treasury deposit: {} lamports", amount);
        Ok(())
    }
}

// ============================================================
// ACCOUNT STRUCTURES
// ============================================================

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

#[init_computation_definition_accounts("flip", payer)]
#[derive(Accounts)]
pub struct InitFlipCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,

    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    pub comp_def_account: UncheckedAccount<'info>,

    #[account(mut, address = derive_mxe_lut_pda!(mxe_account.lut_offset_slot))]
    /// CHECK: address_lookup_table, checked by arcium program.
    pub address_lookup_table: UncheckedAccount<'info>,

    #[account(address = LUT_PROGRAM_ID)]
    /// CHECK: lut_program is the Address Lookup Table program.
    pub lut_program: UncheckedAccount<'info>,

    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, choice: bool)]
pub struct PlaceBet<'info> {
    #[account(
        init,
        payer = player,
        space = 8 + Bet::SIZE,
        seeds = [b"bet", player.key().as_ref(), &house.total_bets.to_le_bytes()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        seeds = [b"house"],
        bump = house.bump
    )]
    pub house: Account<'info, House>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[queue_computation_accounts("flip", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Flip<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        seeds = [b"house"],
        bump = house.bump
    )]
    pub house: Account<'info, House>,

    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, ArciumSignerAccount>,

    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,

    #[account(
        mut,
        address = derive_mempool_pda!(mxe_account, FlipItError::ClusterNotSet)
    )]
    /// CHECK: mempool_account, checked by arcium program
    pub mempool_account: UncheckedAccount<'info>,

    #[account(
        mut,
        address = derive_execpool_pda!(mxe_account, FlipItError::ClusterNotSet)
    )]
    /// CHECK: executing_pool, checked by arcium program
    pub executing_pool: UncheckedAccount<'info>,

    #[account(
        mut,
        address = derive_comp_pda!(computation_offset, mxe_account, FlipItError::ClusterNotSet)
    )]
    /// CHECK: computation_account, checked by arcium program
    pub computation_account: UncheckedAccount<'info>,

    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_FLIP))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, FlipItError::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,

    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Account<'info, FeePool>,

    #[account(mut, address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub clock_account: Account<'info, ClockAccount>,

    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("flip")]
#[derive(Accounts)]
pub struct FlipCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,

    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_FLIP))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,

    /// CHECK: computation_account, checked by arcium program
    pub computation_account: UncheckedAccount<'info>,

    #[account(address = derive_cluster_pda!(mxe_account, FlipItError::ClusterNotSet))]
    pub cluster_account: Account<'info, Cluster>,

    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar
    pub instructions_sysvar: AccountInfo<'info>,

    // Custom callback accounts
    #[account(mut)]
    pub bet: Account<'info, Bet>,

    #[account(mut, seeds = [b"house"], bump = house.bump)]
    pub house: Account<'info, House>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        constraint = bet.player == player.key() @ FlipItError::UnauthorizedPlayer,
        constraint = bet.status == BetStatus::Resolved @ FlipItError::BetNotResolved
    )]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    #[account(
        mut,
        seeds = [b"house"],
        bump = house.bump,
        has_one = authority @ FlipItError::UnauthorizedHouse
    )]
    pub house: Account<'info, House>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositTreasury<'info> {
    #[account(
        mut,
        seeds = [b"house"],
        bump = house.bump
    )]
    pub house: Account<'info, House>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ============================================================
// STATE ACCOUNTS
// ============================================================

#[account]
pub struct House {
    pub authority: Pubkey,
    pub treasury: u64,
    pub total_bets: u64,
    pub total_volume: u64,
    pub active_bets: u64,
    pub bump: u8,
}

impl House {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Bet {
    pub player: Pubkey,
    pub amount: u64,
    pub choice: bool, // true = HEADS, false = TAILS
    pub status: BetStatus,
    pub placed_at: i64,
    pub player_wins: bool,
    pub payout: u64,
    pub house_fee: u64,
    pub bump: u8,
}

impl Bet {
    pub const SIZE: usize = 32 + 8 + 1 + 1 + 8 + 1 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BetStatus {
    Placed,
    Flipping,
    Resolved,
    Claimed,
}

// ============================================================
// EVENTS
// ============================================================

#[event]
pub struct FlipEvent {
    pub bet: Pubkey,
    pub player: Pubkey,
    pub player_wins: bool,
    pub payout: u64,
}

// ============================================================
// ERRORS
// ============================================================

#[error_code]
pub enum FlipItError {
    #[msg("Bet amount too small (min 0.001 SOL)")]
    BetTooSmall,
    #[msg("Bet amount too large (max 100 SOL)")]
    BetTooLarge,
    #[msg("Unauthorized player")]
    UnauthorizedPlayer,
    #[msg("Bet not resolved yet")]
    BetNotResolved,
    #[msg("Unauthorized house authority")]
    UnauthorizedHouse,
    #[msg("Insufficient treasury balance")]
    InsufficientTreasury,
    #[msg("Arcium computation verification failed")]
    ArciumVerificationFailed,
    #[msg("Cluster not set for MXE")]
    ClusterNotSet,
}
