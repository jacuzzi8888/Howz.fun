'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { 
  initializeArciumClient, 
  isArciumConfigured,
  executeFlipItComputation,
  executeDegenDerbyComputation,
  executeShadowPokerComputation,
  type ArciumProof,
  type ComputationResult,
  verifyArciumProofLocal,
} from './client';

// Arcium Context State
export interface ArciumContextState {
  isInitialized: boolean;
  isConfigured: boolean;
  isComputing: boolean;
  lastComputation: ComputationResult | null;
  error: string | null;
  
  // Core functions
  initialize: (apiKey: string) => void;
  generateFlipOutcome: (
    commitment: string,
    playerPublicKey: PublicKey,
    nonce: string
  ) => Promise<ComputationResult>;
  generateDerbyWinner: (
    raceId: string,
    horses: Array<{ id: string; odds: number }>
  ) => Promise<ComputationResult>;
  generatePokerAction: (
    action: 'shuffle' | 'deal' | 'showdown',
    params: Record<string, unknown>
  ) => Promise<ComputationResult>;
  verifyProof: (proof: ArciumProof) => Promise<boolean>;
}

const ArciumContext = createContext<ArciumContextState | null>(null);

export const ArciumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [lastComputation, setLastComputation] = useState<ComputationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if Arcium is configured (has API key)
  const isConfigured = isArciumConfigured();

  // Initialize Arcium client
  const initialize = useCallback((apiKey: string) => {
    try {
      const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet' ? 'mainnet' : 'devnet';
      initializeArciumClient({
        network,
        apiKey,
      });
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Arcium');
      setIsInitialized(false);
    }
  }, []);

  // Auto-initialize if API key is in environment
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_ARCIUM_API_KEY;
    if (apiKey && !isInitialized) {
      initialize(apiKey);
    } else if (!apiKey) {
      // No API key - Arcium is not configured
      setIsInitialized(false);
    }
  }, [initialize, isInitialized]);

  // Generate provably fair coin flip outcome
  const generateFlipOutcome = useCallback(async (
    commitment: string,
    playerPublicKey: PublicKey,
    nonce: string
  ): Promise<ComputationResult> => {
    if (!isConfigured) {
      return {
        success: false,
        error: 'Arcium not configured. Set NEXT_PUBLIC_ARCIUM_API_KEY.',
      };
    }

    setIsComputing(true);
    setError(null);

    try {
      const result = await executeFlipItComputation(commitment, playerPublicKey, nonce);
      setLastComputation(result);
      
      if (!result.success) {
        setError(result.error ?? 'Computation failed');
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown computation error';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsComputing(false);
    }
  }, [isConfigured]);

  // Generate Degen Derby winner
  const generateDerbyWinner = useCallback(async (
    raceId: string,
    horses: Array<{ id: string; odds: number }>
  ): Promise<ComputationResult> => {
    if (!isConfigured) {
      return {
        success: false,
        error: 'Arcium not configured.',
      };
    }

    setIsComputing(true);
    setError(null);

    try {
      const result = await executeDegenDerbyComputation(raceId, horses);
      setLastComputation(result);
      
      if (!result.success) {
        setError(result.error ?? 'Computation failed');
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown computation error';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsComputing(false);
    }
  }, [isConfigured]);

  // Generate Shadow Poker action
  const generatePokerAction = useCallback(async (
    action: 'shuffle' | 'deal' | 'showdown',
    params: Record<string, unknown>
  ): Promise<ComputationResult> => {
    if (!isConfigured) {
      return {
        success: false,
        error: 'Arcium not configured.',
      };
    }

    setIsComputing(true);
    setError(null);

    try {
      const result = await executeShadowPokerComputation(action, params);
      setLastComputation(result);
      
      if (!result.success) {
        setError(result.error ?? 'Computation failed');
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown computation error';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsComputing(false);
    }
  }, [isConfigured]);

  // Verify Arcium proof
  const verifyProof = useCallback(async (proof: ArciumProof): Promise<boolean> => {
    return verifyArciumProofLocal(proof);
  }, []);

  return (
    <ArciumContext.Provider
      value={{
        isInitialized,
        isConfigured,
        isComputing,
        lastComputation,
        error,
        initialize,
        generateFlipOutcome,
        generateDerbyWinner,
        generatePokerAction,
        verifyProof,
      }}
    >
      {children}
    </ArciumContext.Provider>
  );
};

export const useArcium = () => {
  const context = useContext(ArciumContext);
  if (!context) {
    throw new Error('useArcium must be used within an ArciumProvider');
  }
  return context;
};

// Legacy export for backward compatibility
export const PrivacyProvider = ArciumProvider;
export const usePrivacy = useArcium;
