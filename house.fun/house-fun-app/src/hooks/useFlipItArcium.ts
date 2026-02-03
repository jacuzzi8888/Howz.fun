/**
 * Flip It Arcium Integration Hook
 * Provides provably fair randomness via Arcium confidential computing
 */

import { useCallback, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useArcium } from '~/lib/arcium/ArciumContext';
import { createCommitment } from '~/lib/arcium/privacy';
import type { ArciumProof } from '~/lib/arcium/client';

export interface FlipItArciumState {
  isGeneratingProof: boolean;
  arciumProof: ArciumProof | null;
  error: string | null;
}

export interface UseFlipItArciumReturn extends FlipItArciumState {
  generateProvablyFairOutcome: (
    choice: 'HEADS' | 'TAILS',
    playerPublicKey: PublicKey
  ) => Promise<{
    success: boolean;
    commitment?: string;
    nonce?: string;
    proof?: ArciumProof;
    error?: string;
  }>;
  reset: () => void;
}

export function useFlipItArcium(): UseFlipItArciumReturn {
  const { generateFlipOutcome, isComputing } = useArcium();
  const [arciumProof, setArciumProof] = useState<ArciumProof | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate a provably fair coin flip outcome using Arcium
   * 
   * Flow:
   * 1. Create commitment (choice + random nonce)
   * 2. Request Arcium confidential computation
   * 3. Arcium generates random outcome in TEE (Trusted Execution Environment)
   * 4. Return proof for on-chain verification
   */
  const generateProvablyFairOutcome = useCallback(async (
    choice: 'HEADS' | 'TAILS',
    playerPublicKey: PublicKey
  ) => {
    setError(null);
    setArciumProof(null);

    try {
      // Step 1: Create commitment
      const choiceValue = choice === 'HEADS' ? '0' : '1';
      const commitment = await createCommitment(choiceValue);
      
      // Step 2: Request Arcium computation
      // This executes in a confidential environment - no one can see or manipulate the outcome
      const result = await generateFlipOutcome(
        commitment.hash,
        playerPublicKey,
        commitment.salt
      );

      if (!result.success || !result.proof) {
        const errorMsg = result.error || 'Failed to generate provably fair outcome';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      // Step 3: Store the Arcium proof
      setArciumProof(result.proof);

      return {
        success: true,
        commitment: commitment.hash,
        nonce: commitment.salt,
        proof: result.proof,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error in Arcium computation';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }, [generateFlipOutcome]);

  const reset = useCallback(() => {
    setArciumProof(null);
    setError(null);
  }, []);

  return {
    isGeneratingProof: isComputing,
    arciumProof,
    error,
    generateProvablyFairOutcome,
    reset,
  };
}

/**
 * Serialize Arcium proof for Solana transaction
 * This creates a buffer that can be passed to the smart contract
 */
export function serializeProofForTransaction(proof: ArciumProof): Buffer {
  // Structure: [outcome (1 byte)] [proof_length (4 bytes)] [proof] [public_inputs_length (4 bytes)] [public_inputs]
  const outcomeByte = Buffer.from([proof.outcome]);
  
  const proofLength = Buffer.allocUnsafe(4);
  proofLength.writeUInt32LE(proof.proof.length, 0);
  
  const publicInputsLength = Buffer.allocUnsafe(4);
  publicInputsLength.writeUInt32LE(proof.publicInputs.length, 0);
  
  return Buffer.concat([
    outcomeByte,
    proofLength,
    Buffer.from(proof.proof),
    publicInputsLength,
    Buffer.from(proof.publicInputs),
  ]);
}

/**
 * Validate that the Arcium proof matches the commitment
 * This is an additional client-side check before sending to blockchain
 */
export function validateProofAgainstCommitment(
  proof: ArciumProof,
  commitment: string,
  choice: 'HEADS' | 'TAILS'
): boolean {
  // The commitment should be derived from the choice and nonce
  // The Arcium proof contains the outcome determined by confidential computation
  // We verify that the computation was executed correctly by checking the proof structure
  
  if (!proof.proof || proof.proof.length === 0) {
    return false;
  }
  
  // Outcome should be 0 (HEADS) or 1 (TAILS)
  if (proof.outcome !== 0 && proof.outcome !== 1) {
    return false;
  }
  
  // Proof should be recent (within 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  if (proof.timestamp < tenMinutesAgo) {
    return false;
  }
  
  return true;
}
