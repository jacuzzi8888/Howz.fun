/**
 * Arcium Integration for house.fun
 * 
 * This module provides confidential computing integration for provably fair gaming.
 * All games use Arcium's Multi-Party Computation (MPC) network for verifiable randomness.
 * 
 * CURRENT STATUS: Waiting for Arcium devnet access
 * 
 * @module lib/arcium
 */

// Client and core types
export {
  initializeArciumClient,
  getArciumClient,
  isArciumConfigured,
  isArciumInitialized,
  executeFlipItComputation,
  executeDegenDerbyComputation,
  executeShadowPokerComputation,
  executePokerDeckGeneration,
  executePokerCardDecryption,
  executePokerShowdown,
  serializeArciumProof,
  verifyArciumProofLocal,
  type ArciumConfig,
  type ArciumProof,
  type ComputationRequest,
  type ComputationResult,
  type FlipItComputation,
  type DegenDerbyComputation,
  type FightClubComputation,
  type EncryptedCard,
  type EncryptedDeck,
  type ShadowPokerDeckParams,
  type ShadowPokerDecryptParams,
  type ShadowPokerShowdownParams,
  type PokerComputationResult,
} from './client';

// React Context and hooks
export {
  ArciumProvider,
  useArcium,
  PrivacyProvider,
  usePrivacy,
  type ArciumContextState,
} from './ArciumContext';

// Privacy utilities (commitment scheme)
export {
  createCommitment,
  verifyReveal,
  type Commitment,
} from './privacy';

// Constants
export const ARCIUM_CONSTANTS = {
  /** Maximum time for computation in milliseconds */
  COMPUTATION_TIMEOUT: 30000,
  
  /** Maximum proof size in bytes */
  MAX_PROOF_SIZE: 1024,
  
  /** Proof validity window in milliseconds (10 minutes) */
  PROOF_VALIDITY_WINDOW: 10 * 60 * 1000,
  
  /** Default Arcium programs for each game */
  PROGRAMS: {
    FLIP_IT: 'flip_it_randomness_v1',
    DEGEN_DERBY: 'degen_derby_winner_selection_v1',
    SHADOW_POKER_SHUFFLE: 'shadow_poker_shuffle_v1',
    SHADOW_POKER_DEAL: 'shadow_poker_deal_v1',
    SHADOW_POKER_SHOWDOWN: 'shadow_poker_showdown_v1',
    FIGHT_CLUB: 'fight_club_winner_v1',
  },
} as const;
