/**
 * Arcium Mock Client for Development
 * 
 * This module provides a mock implementation of Arcium for local development
 * and testing without requiring actual Arcium network access.
 * 
 * When NEXT_PUBLIC_ARCIUM_API_KEY is not set, the app automatically uses
 * this mock mode for development.
 * 
 * NOTE: This generates verifiable randomness using Web Crypto API, but
 * is NOT suitable for production. Always use real Arcium for production.
 */

import { PublicKey } from '@solana/web3.js';
import type { 
  ArciumProof, 
  ComputationResult,
  ArciumConfig 
} from './client';

// Mock configuration
const MOCK_CONFIG: ArciumConfig = {
  network: 'devnet',
  apiKey: 'mock-api-key',
};

/**
 * Generate a mock Arcium proof for development
 * Uses Web Crypto API for cryptographically secure randomness
 */
export async function generateMockProof(
  commitment: string,
  playerPublicKey: PublicKey,
  nonce: string
): Promise<ArciumProof> {
  // Generate cryptographically secure random outcome (0 or 1)
  const array = new Uint8Array(1);
  crypto.getRandomValues(array);
  const outcome = array[0] % 2;

  // Generate mock proof data
  const proofData = new Uint8Array(64);
  crypto.getRandomValues(proofData);

  // Generate public inputs
  const publicInputs = new Uint8Array(32);
  const encoder = new TextEncoder();
  const commitmentBytes = encoder.encode(commitment);
  publicInputs.set(commitmentBytes.slice(0, 32));

  // Generate cluster signature
  const clusterSignature = new Uint8Array(64);
  crypto.getRandomValues(clusterSignature);

  return {
    computationId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    outcome,
    proof: proofData,
    publicInputs,
    timestamp: Date.now(),
    clusterSignature,
  };
}

/**
 * Mock computation execution for Flip It
 */
export async function mockFlipItComputation(
  commitment: string,
  playerPublicKey: PublicKey,
  nonce: string
): Promise<ComputationResult> {
  console.log('🎲 [MOCK] Generating provably fair coin flip outcome...');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const proof = await generateMockProof(commitment, playerPublicKey, nonce);
    
    console.log(`✅ [MOCK] Outcome generated: ${proof.outcome === 0 ? 'HEADS' : 'TAILS'}`);
    console.log(`📝 [MOCK] Computation ID: ${proof.computationId}`);
    
    return {
      success: true,
      proof,
    };
  } catch (error) {
    console.error('❌ [MOCK] Failed to generate outcome:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Mock computation failed',
    };
  }
}

/**
 * Mock computation execution for Degen Derby
 */
export async function mockDegenDerbyComputation(
  raceId: string,
  horses: Array<{ id: string; odds: number }>
): Promise<ComputationResult> {
  console.log('🏇 [MOCK] Generating weighted random winner...');
  
  await new Promise(resolve => setTimeout(resolve, 800));

  try {
    // Weighted random selection based on odds
    const totalWeight = horses.reduce((sum, h) => sum + (1 / h.odds), 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    let winnerIndex = 0;
    
    for (let i = 0; i < horses.length; i++) {
      currentWeight += (1 / horses[i].odds);
      if (random <= currentWeight) {
        winnerIndex = i;
        break;
      }
    }

    const proofData = new Uint8Array(64);
    crypto.getRandomValues(proofData);

    const publicInputs = new Uint8Array(32);
    const encoder = new TextEncoder();
    const raceBytes = encoder.encode(raceId);
    publicInputs.set(raceBytes.slice(0, 32));

    const clusterSignature = new Uint8Array(64);
    crypto.getRandomValues(clusterSignature);

    const proof: ArciumProof = {
      computationId: `mock-derby-${Date.now()}`,
      outcome: winnerIndex,
      proof: proofData,
      publicInputs,
      timestamp: Date.now(),
      clusterSignature,
    };

    console.log(`✅ [MOCK] Winner: Horse ${winnerIndex} (${horses[winnerIndex]?.id || 'Unknown'})`);
    
    return {
      success: true,
      proof,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Mock computation failed',
    };
  }
}

/**
 * Mock computation execution for Shadow Poker
 */
export async function mockShadowPokerComputation(
  action: 'shuffle' | 'deal' | 'showdown',
  params: Record<string, unknown>
): Promise<ComputationResult> {
  console.log(`🃏 [MOCK] Executing poker ${action}...`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    let outcome: number;
    
    switch (action) {
      case 'shuffle':
        outcome = 0; // Success
        break;
      case 'deal':
        outcome = Math.floor(Math.random() * 52); // Random card
        break;
      case 'showdown':
        outcome = Math.floor(Math.random() * 6); // Winner position (0-5)
        break;
      default:
        outcome = 0;
    }

    const proofData = new Uint8Array(64);
    crypto.getRandomValues(proofData);

    const publicInputs = new Uint8Array(32);
    const encoder = new TextEncoder();
    const actionBytes = encoder.encode(action);
    publicInputs.set(actionBytes.slice(0, 32));

    const clusterSignature = new Uint8Array(64);
    crypto.getRandomValues(clusterSignature);

    const proof: ArciumProof = {
      computationId: `mock-poker-${action}-${Date.now()}`,
      outcome,
      proof: proofData,
      publicInputs,
      timestamp: Date.now(),
      clusterSignature,
    };

    console.log(`✅ [MOCK] Poker ${action} complete`);
    
    return {
      success: true,
      proof,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Mock computation failed',
    };
  }
}

/**
 * Check if we should use mock mode
 */
export function shouldUseMockMode(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_ARCIUM_API_KEY;
  return !apiKey || apiKey === '' || apiKey === 'mock-api-key';
}

/**
 * Log mock mode warning (only once)
 */
let hasLoggedWarning = false;

export function logMockModeWarning(): void {
  if (hasLoggedWarning) return;
  hasLoggedWarning = true;
  
  console.warn(`
⚠️  ARCIUM MOCK MODE ACTIVE ⚠️

This is a development mode that simulates Arcium confidential computing.
Random outcomes are generated using Web Crypto API but are NOT provably fair
in the cryptographic sense.

For production, you MUST:
1. Get an Arcium API key from https://arcium.com
2. Set NEXT_PUBLIC_ARCIUM_API_KEY in your environment
3. Deploy to Solana with real Arcium integration

To use real Arcium:
- Join Discord: https://discord.gg/arcium
- Visit: https://www.arcium.com/testnet
- Follow the deployment guide
  `);
}
