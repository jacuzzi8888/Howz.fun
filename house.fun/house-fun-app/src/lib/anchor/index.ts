// Anchor Smart Contract Integration
// Flip It - Solana Coin Flip Game
// Fight Club - Token Battle Betting

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
