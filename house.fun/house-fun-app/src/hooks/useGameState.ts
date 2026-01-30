'use client';

import { useState, useCallback } from 'react';

interface GameState {
  isLoading: boolean;
  error: string | null;
  txStatus: 'idle' | 'pending' | 'confirming' | 'confirmed' | 'failed';
  txSignature: string | null;
}

interface UseGameStateReturn extends GameState {
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
      const result = await action();
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      options?.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    ...state,
    setLoading,
    setError,
    setTxStatus,
    reset,
    executeGameAction,
  };
}
