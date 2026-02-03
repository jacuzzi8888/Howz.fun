// Anchor Smart Contract Integration
// Flip It - Solana Coin Flip Game
// Fight Club - Token Battle Betting
// Degen Derby - Horse Racing Betting
// Shadow Poker - Texas Hold'em Poker

export { IDL, type FlipIt } from './idl';
export { 
  PROGRAM_ID, 
  HOUSE_SEED, 
  BET_SEED,
  createProvider,
  createFlipItProgram,
  getHousePDA,
  getBetPDA,
  solToLamports,
  lamportsToSol,
  generateCommitment,
  parseFlipItError,
} from './utils';

export { 
  useFlipItProgram,
  type BetResult,
  type RevealResult,
  type BetAccount,
} from './flip-it-client';

// Fight Club exports
export { FIGHT_CLUB_IDL, type FightClub } from './fight-club-idl';
export {
  FIGHT_CLUB_PROGRAM_ID,
  HOUSE_FEE_BPS,
  FIGHT_CLUB_HOUSE_SEED,
  MATCH_SEED,
  PLAYER_BET_SEED,
  type MatchSide,
  type MatchStatus,
  createFightClubProgram,
  getFightClubHousePDA,
  getMatchPDA,
  getPlayerBetPDA,
  calculateHouseFee,
  calculateWinnings,
  calculateOdds,
  parseFightClubError,
  formatMatchStatus,
  formatSide,
  getMatchDisplayName,
  validateBetAmount,
  formatTokenAmount,
  formatPercentage,
  calculateImpliedProbability,
  getAllMatchPDAs,
} from './fight-club-utils';

export {
  useFightClubProgram,
  type BetResult as FightClubBetResult,
  type ClaimResult,
  type MatchResult,
  type CreateMatchResult,
  type PlayerBetAccount,
  type FightMatchAccount,
  type FightClubHouseAccount,
} from './fight-club-client';

// Degen Derby exports
export { DEGEN_DERBY_IDL, type DegenDerby } from './degen-derby-idl';
export {
  DEGEN_DERBY_PROGRAM_ID,
  HOUSE_FEE_BPS as DEGEN_DERBY_HOUSE_FEE_BPS,
  DEGEN_DERBY_HOUSE_SEED,
  RACE_SEED,
  PLAYER_BET_SEED as DEGEN_DERBY_PLAYER_BET_SEED,
  type RaceStatus,
  type Horse,
  type HorseData,
  createDegenDerbyProgram,
  getDegenDerbyHousePDA,
  getRacePDA,
  getPlayerBetPDA as getDegenDerbyPlayerBetPDA,
  calculateHouseFee as calculateDerbyHouseFee,
  calculateWinnings as calculateDerbyWinnings,
  calculateOdds as calculateDerbyOdds,
  calculateImpliedProbability as calculateDerbyImpliedProbability,
  calculatePotentialPayout,
  parseDegenDerbyError,
  formatRaceStatus,
  formatOdds,
  formatDecimalOdds,
  getRaceDisplayName,
  validateBetAmount as validateDerbyBetAmount,
  validateHorseIndex,
  formatTokenAmount as formatDerbyTokenAmount,
  formatPercentage as formatDerbyPercentage,
  getAllRacePDAs,
  calculateTotalPool,
  calculateBetDistribution,
} from './degen-derby-utils';

export {
  useDegenDerbyProgram,
  type BetResult as DegenDerbyBetResult,
  type ClaimResult as DegenDerbyClaimResult,
  type RaceResult,
  type CreateRaceResult,
  type StartRaceResult,
  type PlayerBetAccount as DegenDerbyPlayerBetAccount,
  type RaceAccount,
  type DegenDerbyHouseAccount,
} from './degen-derby-client';

// Shadow Poker exports
export { SHADOW_POKER_IDL, type ShadowPoker } from './shadow-poker-idl';
export {
  SHADOW_POKER_PROGRAM_ID,
  SHADOW_POKER_HOUSE_SEED,
  TABLE_SEED,
  PLAYER_STATE_SEED,
  SUITS,
  RANKS,
  type Suit,
  type Rank,
  type TableStatus,
  type BettingRound,
  type PlayerAction,
  type BlindType,
  type Card,
  type CardDisplay,
  type TableConfig,
  createShadowPokerProgram,
  getShadowPokerHousePDA,
  getTablePDA,
  getPlayerStatePDA,
  cardToDisplay,
  getSuitSymbol,
  displayToCard,
  calculateMinRaise,
  calculateCallAmount,
  parseShadowPokerError,
  formatTableStatus,
  formatPlayerAction,
  formatBlindType,
  validateBuyIn,
  validateTableParams,
  validatePlayerAction,
  getTableDisplayName,
  getAllTablePDAs,
  calculatePotOdds,
  calculateRequiredEquity,
  getCardRankValue,
  isFlush,
  isStraight,
  getHandStrengthDescription,
} from './shadow-poker-utils';

export {
  useShadowPokerProgram,
  type JoinTableResult,
  type CreateTableResult,
  type StartHandResult,
  type PlayerActionResult,
  type RevealCardsResult,
  type ShowdownResult,
  type LeaveTableResult,
  type PlayerStateAccount,
  type TableAccount,
  type ShadowPokerHouseAccount,
} from './shadow-poker-client';
