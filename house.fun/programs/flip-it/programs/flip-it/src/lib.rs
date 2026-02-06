use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

// Computation definition offset for coin_flip instruction
const COMP_DEF_OFFSET_COIN_FLIP: u32 = comp_def_offset("coin_flip");

// Program ID - will be set after deployment
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

    /// Initialize the coin_flip computation definition
    /// Called once after program deployment to register the MPC circuit
    pub fn init_coin_flip_comp_def(ctx: Context<InitCoinFlipCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)?;
        msg!("Coin flip computation definition initialized");
        Ok(())
    }

    // ============================================================
    // GAME INSTRUCTIONS
    // ============================================================

    /// Player places a bet with their choice
    /// No commitment needed - Arcium handles the randomness securely
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        choice: u8, // 0 = HEADS, 1 = TAILS
    ) -> Result<()> {
        // Validate bet amount
        require!(amount >= MIN_BET_LAMPORTS, FlipItError::BetTooSmall);
        require!(amount <= MAX_BET_LAMPORTS, FlipItError::BetTooLarge);
        require!(choice == 0 || choice == 1, FlipItError::InvalidChoice);

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
        bet.outcome = None;
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
            if choice == 0 { "HEADS" } else { "TAILS" },
            player.key()
        );
        Ok(())
    }

    /// Request the coin flip computation from Arcium MPC cluster
    /// This queues the computation - result comes via callback
    pub fn request_flip(
        ctx: Context<RequestFlip>,
        computation_offset: u64,
        // Encrypted input parameters
        ciphertext_choice: [u8; 32],
        ciphertext_bet_id: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        let bet = &ctx.accounts.bet;
        let player = &ctx.accounts.player;

        // Verify bet belongs to player and is in correct state
        require!(bet.player == player.key(), FlipItError::UnauthorizedPlayer);
        require!(
            bet.status == BetStatus::Placed,
            FlipItError::InvalidBetStatus
        );

        // Build encrypted arguments for the coin_flip circuit
        // The circuit expects: Enc<Shared, CoinFlipInput> where CoinFlipInput has:
        //   - player_choice: u8
        //   - bet_id: u64
        let args = ArgBuilder::new()
            .x25519_pubkey(pub_key)
            .plaintext_u128(nonce)
            .encrypted_u8(ciphertext_choice)
            .encrypted_u64(ciphertext_bet_id)
            .build();

        // Set the bump for signing
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        // Queue the computation with Arcium
        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            // Callback instruction with bet account for resolving
            vec![CoinFlipCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[
                    CallbackAccount {
                        pubkey: ctx.accounts.bet.key(),
                        is_writable: true,
                    },
                    CallbackAccount {
                        pubkey: ctx.accounts.house.key(),
                        is_writable: true,
                    },
                ],
            )?],
            1, // Number of callback transactions
            0, // Priority fee (0 = none)
        )?;

        // Update bet status
        let bet = &mut ctx.accounts.bet;
        bet.status = BetStatus::Flipping;

        msg!("Coin flip requested for bet: {}", bet.key());
        Ok(())
    }

    /// Callback from Arcium MPC cluster with the flip result
    /// This is called automatically by the cluster after computation
    #[arcium_callback(encrypted_ix = "coin_flip")]
    pub fn coin_flip_callback(
        ctx: Context<CoinFlipCallback>,
        output: SignedComputationOutputs<CoinFlipOutput>,
    ) -> Result<()> {
        // Verify and extract the computation output
        let result = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account,
        ) {
            Ok(CoinFlipOutput {
                field_0: outcome,
                field_1: player_wins,
                field_2: _bet_id,
            }) => (outcome, player_wins),
            Err(e) => {
                msg!("Arcium verification failed: {}", e);
                return Err(FlipItError::ArciumVerificationFailed.into());
            }
        };

        let (outcome, player_wins) = result;
        let bet = &mut ctx.accounts.bet;
        let house = &mut ctx.accounts.house;

        // Calculate payouts
        let house_fee = bet.amount * HOUSE_FEE_BPS as u64 / 10000;
        let payout = if player_wins {
            bet.amount * 2 - house_fee // Double minus house fee
        } else {
            0
        };

        // Update bet with results
        bet.outcome = Some(outcome);
        bet.player_wins = player_wins;
        bet.payout = payout;
        bet.house_fee = house_fee;
        bet.status = BetStatus::Resolved;

        // Update house treasury
        house.treasury += if player_wins { house_fee } else { bet.amount };
        house.active_bets -= 1;

        // Emit event for frontend tracking
        emit!(FlipResultEvent {
            bet: bet.key(),
            player: bet.player,
            choice: bet.choice,
            outcome,
            player_wins,
            payout,
            house_fee,
        });

        msg!(
            "Flip resolved: {} chose {}, result {}, winner: {}",
            bet.player,
            if bet.choice == 0 { "HEADS" } else { "TAILS" },
            if outcome == 0 { "HEADS" } else { "TAILS" },
            if player_wins { "Player" } else { "House" }
        );

        Ok(())
    }

    /// Claim winnings after bet is resolved
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let bet = &ctx.accounts.bet;
        let player = &ctx.accounts.player;

        // Verify bet is resolved and belongs to player
        require!(
            bet.status == BetStatus::Resolved,
            FlipItError::BetNotResolved
        );
        require!(bet.player == player.key(), FlipItError::UnauthorizedPlayer);

        // Transfer payout to player
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

        // Update bet status
        let bet = &mut ctx.accounts.bet;
        bet.status = BetStatus::Claimed;

        Ok(())
    }

    // ============================================================
    // HOUSE MANAGEMENT
    // ============================================================

    /// House authority withdraws treasury funds
    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
        let house = &mut ctx.accounts.house;

        require!(
            house.authority == ctx.accounts.authority.key(),
            FlipItError::UnauthorizedHouse
        );
        require!(amount <= house.treasury, FlipItError::InsufficientTreasury);

        // Transfer from house to authority
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

        house.treasury -= amount;

        msg!("Treasury withdrawal: {} lamports", amount);
        Ok(())
    }

    /// Deposit funds to house treasury (for paying winners)
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

#[init_computation_definition_accounts("coin_flip")]
#[derive(Accounts)]
pub struct InitCoinFlipCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,

    #[account(
        init,
        payer = payer,
        space = ComputationDefinitionAccount::size(None),
        seeds = [MXE_SEED, &COMP_DEF_OFFSET_COIN_FLIP.to_le_bytes()],
        bump
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, choice: u8)]
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

#[queue_computation_accounts("coin_flip", player)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct RequestFlip<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        constraint = bet.player == player.key() @ FlipItError::UnauthorizedPlayer,
        constraint = bet.status == BetStatus::Placed @ FlipItError::InvalidBetStatus
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        seeds = [b"house"],
        bump = house.bump
    )]
    pub house: Account<'info, House>,

    // Arcium required accounts
    #[account(
        init_if_needed,
        space = 9,
        payer = player,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, ArciumSignerAccount>,

    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,

    #[account(
        mut,
        address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: mempool_account, checked by arcium program
    pub mempool_account: UncheckedAccount<'info>,

    #[account(
        mut,
        address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: executing_pool, checked by arcium program
    pub executing_pool: UncheckedAccount<'info>,

    #[account(
        mut,
        address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: computation_account, checked by arcium program
    pub computation_account: UncheckedAccount<'info>,

    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_COIN_FLIP))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,

    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Account<'info, FeePool>,

    #[account(mut, address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub clock_account: Account<'info, ClockAccount>,

    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("coin_flip")]
#[derive(Accounts)]
pub struct CoinFlipCallback<'info> {
    // Standard Arcium callback accounts
    pub arcium_program: Program<'info, Arcium>,

    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_COIN_FLIP))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,

    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,

    /// CHECK: computation_account, checked by arcium program
    pub computation_account: UncheckedAccount<'info>,

    #[account(address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet))]
    pub cluster_account: Account<'info, Cluster>,

    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar
    pub instructions_sysvar: AccountInfo<'info>,

    // Custom callback accounts (must match order in request_flip)
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
    pub authority: Pubkey, // House admin
    pub treasury: u64,     // Accumulated funds for paying winners
    pub total_bets: u64,   // Total bet count (used for PDA seeds)
    pub total_volume: u64, // Total SOL volume
    pub active_bets: u64,  // Currently pending bets
    pub bump: u8,          // PDA bump
}

impl House {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Bet {
    pub player: Pubkey,      // Player address
    pub amount: u64,         // Bet amount in lamports
    pub choice: u8,          // 0 = HEADS, 1 = TAILS
    pub status: BetStatus,   // Current status
    pub placed_at: i64,      // Unix timestamp
    pub outcome: Option<u8>, // Result: 0 = HEADS, 1 = TAILS
    pub player_wins: bool,   // Did player win?
    pub payout: u64,         // Amount to payout
    pub house_fee: u64,      // Fee collected
    pub bump: u8,            // PDA bump
}

impl Bet {
    pub const SIZE: usize = 32 + 8 + 1 + 1 + 8 + 2 + 1 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BetStatus {
    Placed,   // Bet placed, waiting for flip request
    Flipping, // Flip requested, waiting for MPC result
    Resolved, // Result received, ready to claim
    Claimed,  // Winnings claimed
}

// ============================================================
// EVENTS
// ============================================================

#[event]
pub struct FlipResultEvent {
    pub bet: Pubkey,
    pub player: Pubkey,
    pub choice: u8,
    pub outcome: u8,
    pub player_wins: bool,
    pub payout: u64,
    pub house_fee: u64,
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
    #[msg("Invalid choice - must be 0 (HEADS) or 1 (TAILS)")]
    InvalidChoice,
    #[msg("Unauthorized player")]
    UnauthorizedPlayer,
    #[msg("Invalid bet status for this operation")]
    InvalidBetStatus,
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

// ============================================================
// OUTPUT TYPE (auto-generated by Arcium, defined here for reference)
// ============================================================

// This is generated by the arcium build process from the Arcis circuit
// Matches the CoinFlipOutput struct in encrypted-ixs/coin_flip.rs
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CoinFlipOutput {
    pub field_0: u8,   // outcome
    pub field_1: bool, // player_wins
    pub field_2: u64,  // bet_id
}
