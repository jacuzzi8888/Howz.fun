import { AnchorProvider, Program, web3, type Wallet } from '@coral-xyz/anchor';
import { type ShadowPoker, SHADOW_POKER_IDL } from './shadow-poker-idl';

// Program ID from deployment
export const SHADOW_POKER_PROGRAM_ID = new web3.PublicKey(
  process.env.NEXT_PUBLIC_SHADOW_POKER_PROGRAM_ID || 'HT1ro9KCKv3bzrvrtjonrMWuHZeNYFPvscPWy8bMaogx'
);

// House fee in basis points (1% = 100 bps)
export const HOUSE_FEE_BPS = 100;

// PDA seeds
export const SHADOW_POKER_HOUSE_SEED = Buffer.from('shadow_poker_house');
export const TABLE_SEED = Buffer.from('table');
export const PLAYER_STATE_SEED = Buffer.from('player_state');

// Card suits
export const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'] as const;
export type Suit = typeof SUITS[number];

// Card ranks
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export type Rank = typeof RANKS[number];

// Types
export type TableStatus = 'Waiting' | 'Dealing' | 'Betting' | 'Finished';
export type BettingRound = 'PreFlop' | 'Flop' | 'Turn' | 'River';
export type PlayerAction = 'Fold' | 'Check' | 'Call' | 'Raise' | 'AllIn';
export type BlindType = 'Small' | 'Big';

export interface Card {
  suit: number;
  rank: number;
}

export interface CardDisplay {
  suit: Suit;
  rank: Rank;
  display: string;
}

export interface TableConfig {
  minBuyIn: number;
  maxBuyIn: number;
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
}

interface WalletAdapter {
  publicKey: web3.PublicKey | null;
  signTransaction: ((tx: web3.Transaction) => Promise<web3.Transaction>) | undefined;
  signAllTransactions?: (txs: web3.Transaction[]) => Promise<web3.Transaction[]>;
}

/**
 * Create Anchor Provider from wallet connection
 */
export function createProvider(
  connection: web3.Connection,
  wallet: WalletAdapter,
  _sessionKey?: web3.Keypair | null
): AnchorProvider {
  return new AnchorProvider(
    connection,
    wallet as Wallet,
    AnchorProvider.defaultOptions()
  );
}

/**
 * Create Shadow Poker program instance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createShadowPokerProgram(provider: AnchorProvider): Program<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(SHADOW_POKER_IDL as any, provider);
}

/**
 * Get Shadow Poker House PDA address
 */
export function getShadowPokerHousePDA(): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [SHADOW_POKER_HOUSE_SEED],
    SHADOW_POKER_PROGRAM_ID
  );
}

/**
 * Get Table PDA address by index
 */
export function getTablePDA(tableIndex: number): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [
      TABLE_SEED,
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(tableIndex)]).buffer))
    ],
    SHADOW_POKER_PROGRAM_ID
  );
}

/**
 * Get Player State PDA address
 */
export function getPlayerStatePDA(
  tablePDA: web3.PublicKey,
  player: web3.PublicKey
): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [
      PLAYER_STATE_SEED,
      tablePDA.toBuffer(),
      player.toBuffer()
    ],
    SHADOW_POKER_PROGRAM_ID
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
 * Convert card to display format
 */
export function cardToDisplay(card: Card): CardDisplay {
  const suit = SUITS[card.suit];
  const rank = RANKS[card.rank];
  return {
    suit: suit ?? 'Hearts',
    rank: rank ?? '2',
    display: `${rank ?? '?'}${getSuitSymbol(card.suit)}`
  };
}

/**
 * Get suit symbol
 */
export function getSuitSymbol(suit: number): string {
  const symbols = ['♥', '♦', '♣', '♠'];
  return symbols[suit] ?? '?';
}

/**
 * Convert display card to program card
 */
export function displayToCard(display: CardDisplay): Card {
  return {
    suit: SUITS.indexOf(display.suit),
    rank: RANKS.indexOf(display.rank)
  };
}

/**
 * Calculate house fee from pot
 */
export function calculateHouseFee(potLamports: number): number {
  return Math.floor(potLamports * HOUSE_FEE_BPS / 10000);
}

/**
 * Calculate minimum valid raise
 */
export function calculateMinRaise(currentBet: number, bigBlind: number): number {
  return currentBet > 0 ? currentBet * 2 : bigBlind * 2;
}

/**
 * Calculate call amount
 */
export function calculateCallAmount(currentBet: number, playerBet: number): number {
  return Math.max(0, currentBet - playerBet);
}

/**
 * Shadow Poker Program Error Codes
 */
export const ShadowPokerErrors: Record<number, string> = {
  6000: 'Buy-in amount is outside table limits',
  6001: 'Table is full',
  6002: 'Table is not in waiting state',
  6003: 'Invalid blind type',
  6004: 'Not your turn to act',
  6005: 'Invalid action for current state',
  6006: 'Insufficient stack for action',
  6007: 'Unauthorized house authority',
  6008: 'Player not found at table',
  6009: 'Player is not active in hand',
  6010: 'Insufficient treasury balance',
  6011: 'Invalid winner index',
  6012: 'Invalid number of cards',
  6013: 'Invalid table parameters',
  6014: 'Minimum 2 players required',
  6015: 'Hand already in progress',
  6016: 'Invalid raise amount',
  6017: 'Player already at table',
  6018: 'Invalid blind amounts',
};

interface PokerProgramError {
  code?: number;
  message?: string;
  error?: {
    errorCode?: {
      code?: string;
    };
  };
}

function isPokerProgramError(err: unknown): err is PokerProgramError {
  return typeof err === 'object' && err !== null;
}

/**
 * Parse Shadow Poker program error
 */
export function parseShadowPokerError(error: unknown): string {
  if (!isPokerProgramError(error)) {
    return 'Unknown error occurred';
  }

  // Check for program error codes
  if (error.code) {
    const errorMsg = ShadowPokerErrors[error.code];
    if (errorMsg) {
      return errorMsg;
    }
  }

  // Check for error message containing code
  const codeMatch = error.message?.match(/custom program error: (0x[0-9a-fA-F]+|\d+)/);
  if (codeMatch?.[1]) {
    const matchedCode = codeMatch[1];
    const code = parseInt(matchedCode, matchedCode.startsWith('0x') ? 16 : 10);
    const errorMsg = ShadowPokerErrors[code];
    if (errorMsg) {
      return errorMsg;
    }
  }

  // Check for Anchor error format
  if (error.error?.errorCode?.code) {
    const anchorCode = error.error.errorCode.code;
    const numericCode = Object.keys(ShadowPokerErrors).find(
      key => {
        const msg = ShadowPokerErrors[parseInt(key)];
        return msg?.toLowerCase().includes(anchorCode?.toLowerCase() ?? '');
      }
    );
    if (numericCode) {
      const errorMsg = ShadowPokerErrors[parseInt(numericCode)];
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
 * Format table status for display
 */
export function formatTableStatus(status: TableStatus): string {
  switch (status) {
    case 'Waiting':
      return 'Waiting for Players';
    case 'Dealing':
      return 'Dealing (Arcium)';
    case 'Betting':
      return 'Betting Round';
    case 'Finished':
      return 'Hand Finished';
    default:
      return 'Unknown';
  }
}

/**
 * Format player action for display
 */
export function formatPlayerAction(action: PlayerAction): string {
  switch (action) {
    case 'Fold':
      return 'Fold';
    case 'Check':
      return 'Check';
    case 'Call':
      return 'Call';
    case 'Raise':
      return 'Raise';
    case 'AllIn':
      return 'All In';
    default:
      return 'Unknown';
  }
}

/**
 * Format blind type for display
 */
export function formatBlindType(blindType: BlindType): string {
  switch (blindType) {
    case 'Small':
      return 'Small Blind';
    case 'Big':
      return 'Big Blind';
    default:
      return 'Unknown';
  }
}

/**
 * Validate buy-in amount
 */
export function validateBuyIn(buyIn: number, minBuyIn: number, maxBuyIn: number): { valid: boolean; error?: string } {
  if (buyIn < minBuyIn) {
    return { valid: false, error: `Minimum buy-in is ${minBuyIn} SOL` };
  }

  if (buyIn > maxBuyIn) {
    return { valid: false, error: `Maximum buy-in is ${maxBuyIn} SOL` };
  }

  return { valid: true };
}

/**
 * Validate table parameters
 */
export function validateTableParams(params: TableConfig): { valid: boolean; error?: string } {
  if (params.minBuyIn >= params.maxBuyIn) {
    return { valid: false, error: 'Min buy-in must be less than max buy-in' };
  }

  if (params.smallBlind >= params.bigBlind) {
    return { valid: false, error: 'Small blind must be less than big blind' };
  }

  if (params.maxPlayers < 2 || params.maxPlayers > 10) {
    return { valid: false, error: 'Max players must be between 2 and 10' };
  }

  if (params.minBuyIn < params.bigBlind * 20) {
    return { valid: false, error: 'Min buy-in should be at least 20 big blinds' };
  }

  return { valid: true };
}

/**
 * Validate player action
 */
export function validatePlayerAction(
  action: PlayerAction,
  amount: number,
  stack: number,
  currentBet: number,
  playerBet: number,
  bigBlind: number
): { valid: boolean; error?: string } {
  const callAmount = calculateCallAmount(currentBet, playerBet);

  switch (action) {
    case 'Fold':
      return { valid: true };

    case 'Check':
      if (callAmount > 0) {
        return { valid: false, error: 'Cannot check when there is a bet to call' };
      }
      return { valid: true };

    case 'Call':
      if (callAmount === 0) {
        return { valid: false, error: 'No bet to call' };
      }
      if (stack < callAmount) {
        return { valid: false, error: 'Insufficient stack to call' };
      }
      return { valid: true };

    case 'Raise':
      if (amount <= callAmount) {
        return { valid: false, error: 'Raise must be greater than call amount' };
      }
      const minRaise = calculateMinRaise(currentBet, bigBlind);
      if (amount < minRaise) {
        return { valid: false, error: `Minimum raise is ${minRaise} SOL` };
      }
      if (stack < amount) {
        return { valid: false, error: 'Insufficient stack for raise' };
      }
      return { valid: true };

    case 'AllIn':
      return { valid: true };

    default:
      return { valid: false, error: 'Invalid action' };
  }
}

/**
 * Get table display name
 */
export function getTableDisplayName(tableIndex: number, smallBlind: number, bigBlind: number): string {
  return `Table #${tableIndex + 1} - ${smallBlind}/${bigBlind}`;
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
 * Get all table PDAs up to a certain index
 */
export function getAllTablePDAs(upToIndex: number): web3.PublicKey[] {
  const pdas: web3.PublicKey[] = [];
  for (let i = 0; i < upToIndex; i++) {
    const [pda] = getTablePDA(i);
    pdas.push(pda);
  }
  return pdas;
}

/**
 * Calculate pot odds
 */
export function calculatePotOdds(callAmount: number, potSize: number): number {
  if (callAmount === 0) return 0;
  return potSize / callAmount;
}

/**
 * Calculate required equity for a call
 */
export function calculateRequiredEquity(callAmount: number, potSize: number): number {
  const totalPot = potSize + callAmount;
  if (totalPot === 0) return 0;
  return (callAmount / totalPot) * 100;
}

/**
 * Poker hand evaluation helper - convert cards to rank values
 */
export function getCardRankValue(rank: number): number {
  // 2=0, 3=1, ..., 10=8, J=9, Q=10, K=11, A=12
  return rank;
}

/**
 * Poker hand evaluation helper - check if cards form a flush
 */
export function isFlush(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  const suitCounts: Record<number, number> = {};
  for (const card of cards) {
    suitCounts[card.suit] = (suitCounts[card.suit] ?? 0) + 1;
  }
  return Object.values(suitCounts).some(count => count >= 5);
}

/**
 * Poker hand evaluation helper - check if cards form a straight
 */
export function isStraight(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  const uniqueRanks = Array.from(new Set(cards.map(c => c.rank))).sort((a, b) => a - b);

  // Check for regular straight
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    const first = uniqueRanks[i];
    const last = uniqueRanks[i + 4];
    if (first !== undefined && last !== undefined && last - first === 4) {
      return true;
    }
  }

  // Check for A-2-3-4-5 straight (wheel)
  if (uniqueRanks.includes(12) && uniqueRanks.includes(0) &&
    uniqueRanks.includes(1) && uniqueRanks.includes(2) && uniqueRanks.includes(3)) {
    return true;
  }

  return false;
}

/**
 * Get hand strength description (simplified)
 */
export function getHandStrengthDescription(holeCards: Card[], communityCards: Card[]): string {
  const allCards = [...holeCards, ...communityCards];

  if (allCards.length < 5) return 'Insufficient cards';

  // This is a simplified version - full hand evaluation would be more complex
  if (isFlush(allCards) && isStraight(allCards)) return 'Straight Flush';
  if (isFlush(allCards)) return 'Flush';
  if (isStraight(allCards)) return 'Straight';

  // Check for pairs, trips, quads
  const rankCounts: Record<number, number> = {};
  for (const card of allCards) {
    rankCounts[card.rank] = (rankCounts[card.rank] ?? 0) + 1;
  }
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  if (counts[0] === 4) return 'Four of a Kind';
  if (counts[0] === 3 && counts[1]! >= 2) return 'Full House';
  if (counts[0] === 3) return 'Three of a Kind';
  if (counts[0] === 2 && counts[1] === 2) return 'Two Pair';
  if (counts[0] === 2) return 'One Pair';

  return 'High Card';
}
