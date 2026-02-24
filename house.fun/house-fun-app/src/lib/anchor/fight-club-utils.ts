import { AnchorProvider, Program, web3, type Wallet } from '@coral-xyz/anchor';
import { type FightClub, FIGHT_CLUB_IDL } from './fight-club-idl';

// Program ID from deployment
export const FIGHT_CLUB_PROGRAM_ID = new web3.PublicKey(process.env.NEXT_PUBLIC_FIGHT_CLUB_PROGRAM_ID || '9cdERKti1DeD4pmspjfk1ePqtoze5FwrDzERdnDBWB9Z');

// House fee in basis points (1% = 100 bps)
export const HOUSE_FEE_BPS = 100;

// PDA seeds
export const FIGHT_CLUB_HOUSE_SEED = Buffer.from('fight_club_house');
export const MATCH_SEED = Buffer.from('match');
export const PLAYER_BET_SEED = Buffer.from('player_bet');

// Types
export type MatchSide = 'A' | 'B';
export type MatchStatus = 'Open' | 'Resolved' | 'Cancelled';

// Minimal wallet interface for provider
interface WalletAdapter {
  publicKey: web3.PublicKey | null;
  signTransaction: ((tx: web3.Transaction) => Promise<web3.Transaction>) | undefined;
  signAllTransactions?: (txs: web3.Transaction[]) => Promise<web3.Transaction[]>;
}

/**
 * Create Anchor Provider from wallet connection
 */
export function createProvider(connection: web3.Connection, wallet: WalletAdapter): AnchorProvider {
  return new AnchorProvider(
    connection,
    wallet as Wallet,
    AnchorProvider.defaultOptions()
  );
}

/**
 * Create Fight Club program instance
 */
export function createFightClubProgram(provider: AnchorProvider): Program<any> {
  return new Program(FIGHT_CLUB_IDL as any, provider);
}

/**
 * Get Fight Club House PDA address
 */
export function getFightClubHousePDA(): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [FIGHT_CLUB_HOUSE_SEED],
    FIGHT_CLUB_PROGRAM_ID
  );
}

/**
 * Get Match PDA address by index
 */
export function getMatchPDA(matchIndex: number): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [
      MATCH_SEED,
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(matchIndex)]).buffer))
    ],
    FIGHT_CLUB_PROGRAM_ID
  );
}

/**
 * Get Player Bet PDA address
 */
export function getPlayerBetPDA(
  matchPDA: web3.PublicKey,
  player: web3.PublicKey
): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [
      PLAYER_BET_SEED,
      matchPDA.toBuffer(),
      player.toBuffer()
    ],
    FIGHT_CLUB_PROGRAM_ID
  );
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.round(sol * web3.LAMPORTS_PER_SOL);
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / web3.LAMPORTS_PER_SOL;
}

/**
 * Calculate house fee from total pool
 */
export function calculateHouseFee(totalPoolLamports: number): number {
  return Math.floor(totalPoolLamports * HOUSE_FEE_BPS / 10000);
}

/**
 * Calculate proportional winnings
 */
export function calculateWinnings(
  playerBetLamports: number,
  winningPoolLamports: number,
  totalPoolLamports: number
): number {
  const houseFee = calculateHouseFee(totalPoolLamports);
  const payoutPool = totalPoolLamports - houseFee;
  const playerShare = playerBetLamports / winningPoolLamports;
  return Math.floor(payoutPool * playerShare);
}

/**
 * Calculate odds for a side
 * Returns the multiplier (e.g., 2.0 means double your money)
 */
export function calculateOdds(
  totalBetA: number,
  totalBetB: number,
  side: MatchSide
): number {
  const totalPool = totalBetA + totalBetB;
  if (totalPool === 0) return 0;

  const houseFee = calculateHouseFee(solToLamports(totalPool));
  const payoutPool = solToLamports(totalPool) - houseFee;

  const winningPool = side === 'A' ? totalBetA : totalBetB;
  if (winningPool === 0) return 0;

  const winningPoolLamports = solToLamports(winningPool);
  const odds = payoutPool / winningPoolLamports;

  return odds;
}

/**
 * Fight Club Program Error Codes
 */
export const FightClubErrors: Record<number, string> = {
  6000: 'Bet amount too small (minimum 0.001 SOL)',
  6001: 'Bet amount too large (maximum 1000 SOL)',
  6002: 'Invalid side - must be 0 for token A or 1 for token B',
  6003: 'Match is not open for betting',
  6004: 'Match has already been resolved',
  6005: 'Unauthorized house authority',
  6006: 'Player bet not found',
  6007: 'Winnings already claimed',
  6008: 'Match not resolved yet',
  6009: 'Player did not bet on winning side',
  6010: 'Insufficient treasury balance',
  6011: 'Invalid winner side',
  6012: 'No bets placed on this match',
  6013: 'Match not cancelled',
};

/**
 * Parse Fight Club program error
 */
export function parseFightClubError(error: any): string {
  // Check for program error codes
  if (error?.code && FightClubErrors[error.code]) {
    return FightClubErrors[error.code]!;
  }

  // Check for error message containing code
  const codeMatch = error?.message?.match(/custom program error: (0x[0-9a-fA-F]+|\d+)/);
  if (codeMatch) {
    const code = parseInt(codeMatch[1], codeMatch[1].startsWith('0x') ? 16 : 10);
    if (FightClubErrors[code]) {
      return FightClubErrors[code];
    }
  }

  // Check for Anchor error format
  if (error?.error?.errorCode?.code) {
    const anchorCode = error.error.errorCode.code;
    const numericCode = Object.keys(FightClubErrors).find(
      key => {
        const errorMsg = FightClubErrors[parseInt(key)];
        return errorMsg?.includes(anchorCode);
      }
    );
    if (numericCode) {
      return FightClubErrors[parseInt(numericCode)]!;
    }
  }

  if (error?.message) {
    return error.message;
  }

  return 'Unknown error occurred';
}

/**
 * Format match status for display
 */
export function formatMatchStatus(status: MatchStatus): string {
  switch (status) {
    case 'Open':
      return 'Open for Betting';
    case 'Resolved':
      return 'Resolved';
    case 'Cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Format side for display
 */
export function formatSide(side: MatchSide): string {
  return side === 'A' ? 'Token A' : 'Token B';
}

/**
 * Get match display name
 */
export function getMatchDisplayName(
  tokenASymbol: string,
  tokenBSymbol: string
): string {
  return `${tokenASymbol} vs ${tokenBSymbol}`;
}

/**
 * Validate bet amount
 */
export function validateBetAmount(amount: number): { valid: boolean; error?: string } {
  const MIN_BET = 0.001;
  const MAX_BET = 1000;

  if (amount < MIN_BET) {
    return { valid: false, error: `Minimum bet is ${MIN_BET} SOL` };
  }

  if (amount > MAX_BET) {
    return { valid: false, error: `Maximum bet is ${MAX_BET} SOL` };
  }

  return { valid: true };
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: number, decimals = 2): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate implied probability from odds
 */
export function calculateImpliedProbability(odds: number): number {
  if (odds <= 0) return 0;
  return 1 / odds;
}

/**
 * Get all match PDAs up to a certain index
 */
export function getAllMatchPDAs(upToIndex: number): web3.PublicKey[] {
  const pdas: web3.PublicKey[] = [];
  for (let i = 0; i < upToIndex; i++) {
    const [pda] = getMatchPDA(i);
    pdas.push(pda);
  }
  return pdas;
}
