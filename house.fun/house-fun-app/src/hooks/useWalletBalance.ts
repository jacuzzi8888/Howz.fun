/**
 * Wallet Balance Hook
 * 
 * Provides real-time wallet SOL balance with auto-refresh.
 * Used across all games to show available balance for betting.
 */

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

export interface WalletBalanceState {
  balance: number | null;
  balanceLamports: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWalletBalance(): WalletBalanceState {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balanceLamports, setBalanceLamports] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalanceLamports(0);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const lamports = await connection.getBalance(publicKey);
      setBalanceLamports(lamports);
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
      setError('Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey, connected]);

  // Initial fetch and real-time updates
  useEffect(() => {
    fetchBalance();

    if (!publicKey) return;

    // Subscribe to account changes for real-time updates
    const subscriptionId = connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        setBalanceLamports(accountInfo.lamports);
      },
      'confirmed'
    );

    // Refresh every 10 seconds as backup
    const intervalId = setInterval(fetchBalance, 10000);

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
      clearInterval(intervalId);
    };
  }, [connection, publicKey, connected, fetchBalance]);

  const balance = balanceLamports > 0 ? balanceLamports / LAMPORTS_PER_SOL : null;

  return {
    balance,
    balanceLamports,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}

/**
 * Format balance for display
 */
export function formatBalance(balance: number | null, decimals = 4): string {
  if (balance === null || balance === undefined) return '0.00';
  return balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

/**
 * Check if wallet has sufficient balance
 */
export function hasSufficientBalance(
  balanceLamports: number,
  requiredAmount: number
): boolean {
  const requiredLamports = requiredAmount * LAMPORTS_PER_SOL;
  // Add 0.01 SOL buffer for transaction fees
  const bufferLamports = 0.01 * LAMPORTS_PER_SOL;
  return balanceLamports >= (requiredLamports + bufferLamports);
}
