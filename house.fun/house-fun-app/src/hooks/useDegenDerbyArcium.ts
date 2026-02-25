/**
 * Degen Derby Arcium Integration Hook
 * Provides provably fair race outcomes via Arcium confidential computing
 */

import { useCallback, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useArcium } from '~/lib/arcium/ArciumContext';
import type { ArciumProof } from '~/lib/arcium/client';

export interface DegenDerbyArciumState {
    isGeneratingResult: boolean;
    arciumProof: ArciumProof | null;
    error: string | null;
}

export interface UseDegenDerbyArciumReturn extends DegenDerbyArciumState {
    generateProvablyFairWinner: (
        raceId: string,
        horses: Array<{ id: string; odds: number }>
    ) => Promise<{
        success: boolean;
        proof?: ArciumProof;
        error?: string;
    }>;
    reset: () => void;
}

export function useDegenDerbyArcium(): UseDegenDerbyArciumReturn {
    const { generateDerbyWinner, isComputing } = useArcium();
    const [arciumProof, setArciumProof] = useState<ArciumProof | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * Generate a provably fair derby winner using Arcium
     */
    const generateProvablyFairWinner = useCallback(async (
        raceId: string,
        horses: Array<{ id: string; odds: number }>
    ) => {
        setError(null);
        setArciumProof(null);

        try {
            const result = await generateDerbyWinner(raceId, horses);

            if (!result.success || !result.proof) {
                const errorMsg = result.error || 'Failed to generate provably fair winner';
                setError(errorMsg);
                return {
                    success: false,
                    error: errorMsg,
                };
            }

            setArciumProof(result.proof);

            return {
                success: true,
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
    }, [generateDerbyWinner]);

    const reset = useCallback(() => {
        setArciumProof(null);
        setError(null);
    }, []);

    return {
        isGeneratingResult: isComputing,
        arciumProof,
        error,
        generateProvablyFairWinner,
        reset,
    };
}
