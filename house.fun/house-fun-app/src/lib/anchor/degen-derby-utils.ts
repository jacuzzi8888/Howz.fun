import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
import { type DegenDerby, DEGEN_DERBY_IDL } from './degen-derby-idl';

// Program ID from deployment
export const DEGEN_DERBY_PROGRAM_ID = new web3.PublicKey('Bi47R2F3rkyDfvMHEUzyDXuv9TCFPJ3uzHpNCYPBMQeE');

// House fee in basis points (1% = 100 bps)
export const HOUSE_FEE_BPS = 100;

// PDA seeds
export const DEGEN_DERBY_HOUSE_SEED = Buffer.from('degen_derby_house');
export const RACE_SEED = Buffer.from('race');
export const PLAYER_BET_SEED = Buffer.from('player_bet');

// Types
export type RaceStatus = 'Open' | 'Started' | 'Resolved' | 'Cancelled';

export interface Horse {
  name: string;
  oddsNumerator: number;
  oddsDenominator: number;
}

export interface HorseData {
  name: string;
  oddsNumerator: number;
  oddsDenominator: number;
}

/**
 * Create Anchor Provider from wallet connection
 */
export function createProvider(connection: web3.Connection, wallet: any): AnchorProvider {
  return new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
}

/**
 * Create Degen Derby program instance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDegenDerbyProgram(provider: AnchorProvider): Program<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(DEGEN_DERBY_IDL as any, provider);
}

/**
 * Get Degen Derby House PDA address
 */
export function getDegenDerbyHousePDA(): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [DEGEN_DERBY_HOUSE_SEED],
    DEGEN_DERBY_PROGRAM_ID
  );
}

/**
 * Get Race PDA address by index
 */
export function getRacePDA(raceIndex: number): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [
      RACE_SEED,
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(raceIndex)]).buffer))
    ],
    DEGEN_DERBY_PROGRAM_ID
  );
}

/**
 * Get Player Bet PDA address
 */
export function getPlayerBetPDA(
  racePDA: web3.PublicKey,
  player: web3.PublicKey
): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [
      PLAYER_BET_SEED,
      racePDA.toBuffer(),
      player.toBuffer()
    ],
    DEGEN_DERBY_PROGRAM_ID
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
 * Calculate proportional winnings based on weighted odds
 * In Degen Derby, odds are inversely proportional to the amount bet on each horse
 */
export function calculateWinnings(
  playerBetLamports: number,
  totalBetsOnHorse: number,
  totalPoolLamports: number,
  allBets: number[]
): number {
  const houseFee = calculateHouseFee(totalPoolLamports);
  const payoutPool = totalPoolLamports - houseFee;

  // Calculate weighted odds: inverse of bet proportion
  // Horse with fewer bets has higher odds
  const totalInverseBets = allBets.reduce((sum, bet) => sum + (1 / Math.max(bet, 1)), 0);
  const horseInverseWeight = 1 / Math.max(totalBetsOnHorse, 1);
  const horseOddsMultiplier = totalInverseBets / horseInverseWeight;

  // Winnings = bet amount * odds multiplier * (payout pool / total pool)
  const playerShare = playerBetLamports / Math.max(totalBetsOnHorse, 1);
  const winnings = Math.floor(playerShare * horseOddsMultiplier * payoutPool / totalPoolLamports);

  return winnings;
}

/**
 * Calculate odds for a horse based on current bets
 * Returns the multiplier (e.g., 2.0 means double your money)
 * Uses inverse weighting - horses with fewer bets have higher odds
 */
export function calculateOdds(
  totalBetsOnHorse: number,
  allBets: number[]
): number {
  const totalPool = allBets.reduce((sum, bet) => sum + bet, 0);
  if (totalPool === 0) return 0;

  // Calculate inverse weights
  const totalInverseBets = allBets.reduce((sum, bet) => sum + (1 / Math.max(bet, 1)), 0);
  const horseInverseWeight = 1 / Math.max(totalBetsOnHorse, 1);

  // Odds multiplier
  const oddsMultiplier = totalInverseBets / horseInverseWeight;

  // Apply house fee
  const houseFee = calculateHouseFee(solToLamports(totalPool));
  const payoutPool = solToLamports(totalPool) - houseFee;

  // Final odds
  const odds = (payoutPool / solToLamports(totalPool)) * oddsMultiplier;

  return odds;
}

/**
 * Calculate implied probability from odds
 */
export function calculateImpliedProbability(odds: number): number {
  if (odds <= 0) return 0;
  return 1 / odds;
}

/**
 * Calculate potential payout for a bet
 */
export function calculatePotentialPayout(
  betAmount: number,
  horseIndex: number,
  allBets: number[]
): number {
  const totalBetsOnHorse = allBets[horseIndex] || 0;
  const totalPool = allBets.reduce((sum, bet) => sum + bet, 0);

  if (totalPool === 0) return betAmount;

  const odds = calculateOdds(totalBetsOnHorse, allBets);
  return betAmount * odds;
}

/**
 * Degen Derby Program Error Codes
 */
export const DegenDerbyErrors: Record<number, string> = {
  6000: 'Bet amount too small (minimum 0.001 SOL)',
  6001: 'Bet amount too large (maximum 1000 SOL)',
  6002: 'Invalid horse index',
  6003: 'Race is not open for betting',
  6004: 'Race has already been resolved',
  6005: 'Unauthorized house authority',
  6006: 'Player bet not found',
  6007: 'Winnings already claimed',
  6008: 'Race not resolved yet',
  6009: 'Player did not bet on winning horse',
  6010: 'Insufficient treasury balance',
  6011: 'Invalid winner',
  6012: 'No bets placed on this race',
  6013: 'Race not cancelled',
  6014: 'Too many horses in race (max 20)',
  6015: 'Too few horses in race (min 2)',
  6016: 'Race has not started yet',
};

interface ProgramError {
  code?: number;
  message?: string;
  error?: {
    errorCode?: {
      code?: string;
    };
  };
}

/**
 * Parse Degen Derby program error
 */
export function parseDegenDerbyError(error: unknown): string {
  // Type guard to safely access error properties
  const isProgramError = (err: unknown): err is ProgramError => {
    return typeof err === 'object' && err !== null;
  };

  if (!isProgramError(error)) {
    return 'Unknown error occurred';
  }

  // Check for program error codes
  if (error.code) {
    const errorMsg = DegenDerbyErrors[error.code];
    if (errorMsg) {
      return errorMsg;
    }
  }

  // Check for error message containing code
  const codeMatch = error.message?.match(/custom program error: (0x[0-9a-fA-F]+|\d+)/);
  if (codeMatch?.[1]) {
    const matchedCode = codeMatch[1];
    const code = parseInt(matchedCode, matchedCode.startsWith('0x') ? 16 : 10);
    const errorMsg = DegenDerbyErrors[code];
    if (errorMsg) {
      return errorMsg;
    }
  }

  // Check for Anchor error format
  if (error.error?.errorCode?.code) {
    const anchorCode = error.error.errorCode.code;
    const numericCode = Object.keys(DegenDerbyErrors).find(
      key => {
        const msg = DegenDerbyErrors[parseInt(key)];
        return msg?.includes(anchorCode);
      }
    );
    if (numericCode) {
      const errorMsg = DegenDerbyErrors[parseInt(numericCode)];
      if (errorMsg) {
        return errorMsg;
      }
    }
  }

  if (error.message) {
    return error.message;
  }

  return 'Unknown error occurred';
}

/**
 * Format race status for display
 */
export function formatRaceStatus(status: RaceStatus): string {
  switch (status) {
    case 'Open':
      return 'Open for Betting';
    case 'Started':
      return 'Race Started';
    case 'Resolved':
      return 'Race Finished';
    case 'Cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Format odds for display (e.g., "5:1")
 */
export function formatOdds(odds: number): string {
  if (odds <= 0) return 'N/A';
  const rounded = Math.round(odds * 10) / 10;
  return `${rounded}:1`;
}

/**
 * Format decimal odds for display
 */
export function formatDecimalOdds(odds: number, decimals = 2): string {
  if (odds <= 0) return 'N/A';
  return odds.toFixed(decimals);
}

/**
 * Get race display name
 */
export function getRaceDisplayName(horses: Horse[]): string {
  if (horses.length === 0) return 'Empty Race';
  if (horses.length === 1) return horses[0]!.name;
  return `${horses.length} Horses`;
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
 * Validate horse index
 */
export function validateHorseIndex(index: number, horseCount: number): { valid: boolean; error?: string } {
  if (index < 0 || index >= horseCount) {
    return { valid: false, error: `Invalid horse index. Must be between 0 and ${horseCount - 1}` };
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
 * Get all race PDAs up to a certain index
 */
export function getAllRacePDAs(upToIndex: number): web3.PublicKey[] {
  const pdas: web3.PublicKey[] = [];
  for (let i = 0; i < upToIndex; i++) {
    const [pda] = getRacePDA(i);
    pdas.push(pda);
  }
  return pdas;
}

/**
 * Calculate total pool from all bets
 */
export function calculateTotalPool(allBets: number[]): number {
  return allBets.reduce((sum, bet) => sum + bet, 0);
}

/**
 * Calculate bet distribution percentages
 */
export function calculateBetDistribution(allBets: number[]): number[] {
  const total = calculateTotalPool(allBets);
  if (total === 0) return allBets.map(() => 0);
  return allBets.map(bet => (bet / total) * 100);
}
