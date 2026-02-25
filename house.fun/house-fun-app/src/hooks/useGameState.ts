'use client';

import { useState, useCallback } from 'react';
import { useDemoMode } from '~/context/DemoModeContext';

interface GameState {
  isLoading: boolean;
  error: string | null;
  txStatus: 'idle' | 'pending' | 'confirming' | 'confirmed' | 'failed';
  txSignature: string | null;
}

interface UseGameStateReturn extends GameState {
  isDemoMode: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTxStatus: (status: GameState['txStatus'], signature?: string) => void;
  reset: () => void;
  executeGameAction: <T>(
    action: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ) => Promise<T | null>;
}

/**
 * Hook for managing game state with loading and error handling
 */
export function useGameState(): UseGameStateReturn {
  const { isDemoMode } = useDemoMode();
  const [state, setState] = useState<GameState>({
    isLoading: false,
    error: null,
    txStatus: 'idle',
    txSignature: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setTxStatus = useCallback((status: GameState['txStatus'], signature?: string) => {
    setState(prev => ({
      ...prev,
      txStatus: status,
      txSignature: signature || prev.txSignature,
      isLoading: status === 'pending' || status === 'confirming',
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      txStatus: 'idle',
      txSignature: null,
    });
  }, []);

  const executeGameAction = useCallback(async <T,>(
    action: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Transaction timed out. Please check your wallet or try again.')), 45000);
      });

      // Race the action against the timeout
      const result = await Promise.race([action(), timeoutPromise]) as T;

      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');

      // Special case: if it's a timeout, we ensure the error message is clear
      setError(error.message);
      options?.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    ...state,
    isDemoMode,
    setLoading,
    setError,
    setTxStatus,
    reset,
    executeGameAction,
  };
}
