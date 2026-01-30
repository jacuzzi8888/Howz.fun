// Anchor Smart Contract Integration
// Flip It - Solana Coin Flip Game

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
