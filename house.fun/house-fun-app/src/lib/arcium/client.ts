/**
 * Arcium Client Integration for house.fun
 * Provides confidential computing for provably fair gaming
 */

import { ArciumClient, ArciumComputation } from '@arcium-hq/client';
import { PublicKey } from '@solana/web3.js';
import { 
  shouldUseMockMode, 
  logMockModeWarning,
  mockFlipItComputation,
  mockDegenDerbyComputation,
  mockShadowPokerComputation 
} from './mock';

// Arcium Configuration
export interface ArciumConfig {
  network: 'devnet' | 'mainnet';
  apiKey: string;
  clusterId?: string;
}

// Arcium Proof Structure (matches on-chain verification)
export interface ArciumProof {
  computationId: string;
  outcome: number; // 0 or 1 for coin flip
  proof: Uint8Array; // Cryptographic proof
  publicInputs: Uint8Array;
  timestamp: number;
  clusterSignature: Uint8Array;
}

// Computation Request
export interface ComputationRequest {
  program: string;
  inputs: Record<string, unknown>;
  timeout?: number;
}

// Computation Result
export interface ComputationResult {
  success: boolean;
  proof?: ArciumProof;
  error?: string;
}

// Game-specific computation types
export interface FlipItComputation {
  commitment: string;
  playerPublicKey: string;
  nonce: string;
}

export interface DegenDerbyComputation {
  raceId: string;
  totalPool: number;
  horses: Array<{
    id: string;
    odds: number;
  }>;
}

export interface ShadowPokerComputation {
  deckSeed: string;
  playerPositions: string[];
  action: 'shuffle' | 'deal' | 'showdown';
}

export interface FightClubComputation {
  matchId: string;
  tokenA: string;
  tokenB: string;
  marketData: Record<string, number>;
}

/**
 * Singleton Arcium client instance
 */
let arciumClient: ArciumClient | null = null;

/**
 * Initialize Arcium client with configuration
 */
export function initializeArciumClient(config: ArciumConfig): ArciumClient {
  if (!arciumClient) {
    arciumClient = new ArciumClient({
      network: config.network,
      apiKey: config.apiKey,
      ...(config.clusterId && { clusterId: config.clusterId }),
    });
  }
  return arciumClient;
}

/**
 * Get existing Arcium client instance
 */
export function getArciumClient(): ArciumClient {
  if (!arciumClient) {
    throw new Error('Arcium client not initialized. Call initializeArciumClient first.');
  }
  return arciumClient;
}

/**
 * Execute confidential computation for coin flip
 */
export async function executeFlipItComputation(
  commitment: string,
  playerPublicKey: PublicKey,
  nonce: string
): Promise<ComputationResult> {
  // Use mock mode if no API key is configured
  if (shouldUseMockMode()) {
    logMockModeWarning();
    return mockFlipItComputation(commitment, playerPublicKey, nonce);
  }

  try {
    const client = getArciumClient();
    
    const computation = await client.execute({
      program: 'flip_it_randomness_v1',
      inputs: {
        commitment,
        playerPublicKey: playerPublicKey.toBase58(),
        nonce,
      },
      timeout: 30000, // 30 seconds
    });

    // Parse Arcium computation result
    const proof: ArciumProof = {
      computationId: computation.id,
      outcome: computation.result.outcome as number,
      proof: new Uint8Array(computation.result.proof as number[]),
      publicInputs: new Uint8Array(computation.result.publicInputs as number[]),
      timestamp: Date.now(),
      clusterSignature: new Uint8Array(computation.result.signature as number[]),
    };

    return {
      success: true,
      proof,
    };
  } catch (error) {
    console.error('Arcium computation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown computation error',
    };
  }
}

/**
 * Execute confidential computation for Degen Derby race resolution
 */
export async function executeDegenDerbyComputation(
  raceId: string,
  horses: Array<{ id: string; odds: number }>
): Promise<ComputationResult> {
  // Use mock mode if no API key is configured
  if (shouldUseMockMode()) {
    logMockModeWarning();
    return mockDegenDerbyComputation(raceId, horses);
  }

  try {
    const client = getArciumClient();
    
    const computation = await client.execute({
      program: 'degen_derby_winner_selection_v1',
      inputs: {
        raceId,
        horses,
        timestamp: Date.now(),
      },
      timeout: 30000,
    });

    const proof: ArciumProof = {
      computationId: computation.id,
      outcome: computation.result.winnerIndex as number,
      proof: new Uint8Array(computation.result.proof as number[]),
      publicInputs: new Uint8Array(computation.result.publicInputs as number[]),
      timestamp: Date.now(),
      clusterSignature: new Uint8Array(computation.result.signature as number[]),
    };

    return {
      success: true,
      proof,
    };
  } catch (error) {
    console.error('Arcium Derby computation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown computation error',
    };
  }
}

/**
 * Execute confidential computation for Shadow Poker
 */
export async function executeShadowPokerComputation(
  action: 'shuffle' | 'deal' | 'showdown',
  params: Record<string, unknown>
): Promise<ComputationResult> {
  // Use mock mode if no API key is configured
  if (shouldUseMockMode()) {
    logMockModeWarning();
    return mockShadowPokerComputation(action, params);
  }

  try {
    const client = getArciumClient();
    
    const programMap = {
      shuffle: 'shadow_poker_shuffle_v1',
      deal: 'shadow_poker_deal_v1',
      showdown: 'shadow_poker_showdown_v1',
    };

    const computation = await client.execute({
      program: programMap[action],
      inputs: {
        ...params,
        timestamp: Date.now(),
      },
      timeout: 60000, // Poker may take longer
    });

    const proof: ArciumProof = {
      computationId: computation.id,
      outcome: computation.result.outcome as number,
      proof: new Uint8Array(computation.result.proof as number[]),
      publicInputs: new Uint8Array(computation.result.publicInputs as number[]),
      timestamp: Date.now(),
      clusterSignature: new Uint8Array(computation.result.signature as number[]),
    };

    return {
      success: true,
      proof,
    };
  } catch (error) {
    console.error('Arcium Poker computation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown computation error',
    };
  }
}

/**
 * Serialize Arcium proof for Solana transaction
 */
export function serializeArciumProof(proof: ArciumProof): number[] {
  // Combine all proof components into a format the smart contract can verify
  const serialized = new Uint8Array(
    32 + // computationId (string hash)
    1 + // outcome
    proof.proof.length +
    proof.publicInputs.length +
    8 + // timestamp
    proof.clusterSignature.length
  );

  let offset = 0;
  
  // Add computationId hash (first 32 bytes of SHA-256 hash)
  const compIdBytes = new TextEncoder().encode(proof.computationId);
  serialized.set(compIdBytes.slice(0, 32), offset);
  offset += 32;
  
  // Add outcome
  serialized[offset] = proof.outcome;
  offset += 1;
  
  // Add proof
  serialized.set(proof.proof, offset);
  offset += proof.proof.length;
  
  // Add public inputs
  serialized.set(proof.publicInputs, offset);
  offset += proof.publicInputs.length;
  
  // Add timestamp (8 bytes, little-endian)
  const timestampBytes = new BigUint64Array([BigInt(proof.timestamp)]);
  serialized.set(new Uint8Array(timestampBytes.buffer), offset);
  offset += 8;
  
  // Add cluster signature
  serialized.set(proof.clusterSignature, offset);

  return Array.from(serialized);
}

/**
 * Verify Arcium proof locally (pre-validation before on-chain)
 */
export async function verifyArciumProofLocal(proof: ArciumProof): Promise<boolean> {
  try {
    // Basic validation
    if (!proof.proof || proof.proof.length === 0) {
      return false;
    }
    
    if (proof.outcome !== 0 && proof.outcome !== 1) {
      return false;
    }
    
    // Check timestamp is recent (within 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (proof.timestamp < fiveMinutesAgo) {
      return false;
    }
    
    // Full verification would require the Arcium verification library
    // For now, we trust the Arcium network and rely on on-chain verification
    return true;
  } catch {
    return false;
  }
}
