'use client';

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Connection, Keypair } from '@solana/web3.js';
import { SessionManager } from './SessionManager';

interface MagicBlockContextState {
    standardConnection: Connection;
    rollupConnection: Connection;
    activeConnection: Connection;
    isUsingRollup: boolean;
    setIsUsingRollup: (val: boolean) => void;
    // Session Keys
    sessionKey: Keypair | null;
    isSessionActive: boolean;
    sessionRemainingTime: string;
    refreshSession: () => void;
    clearSession: () => void;
}

const MagicBlockContext = createContext<MagicBlockContextState | null>(null);

export const MagicBlockProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const [isUsingRollup, setIsUsingRollup] = useState(false);
    const [sessionKey, setSessionKey] = useState<Keypair | null>(null);
    const [sessionRemainingTime, setSessionRemainingTime] = useState('00:00');

    // Standard Mainnet/Devnet Connection
    const standardConnection = useMemo(() => {
        const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC ?? 'https://api.devnet.solana.com';
        console.log('[MagicBlock] Initializing Standard Connection with RPC:', rpc);
        return new Connection(rpc, 'confirmed');
    }, []);

    // MagicBlock Ephemeral Rollup Connection
    const rollupConnection = useMemo(() =>
        new Connection('https://devnet.magicblock.app', 'confirmed'),
        []);

    const refreshSession = () => {
        setSessionKey(SessionManager.getStoredSessionKey());
    };

    const clearSession = () => {
        SessionManager.clearSession();
        setSessionKey(null);
    };

    // Session Timer & Refresh Logic
    useEffect(() => {
        // Initial check on mount
        setSessionKey(SessionManager.getStoredSessionKey());

        const interval = setInterval(() => {
            const active = SessionManager.isSessionActive();
            setSessionRemainingTime(SessionManager.getRemainingTime());

            setSessionKey(prev => {
                const current = SessionManager.getStoredSessionKey();
                if (!active && prev !== null) return null;
                if (active && prev === null) return current;
                // If the stored key changed (e.g. new session started), update it
                if (active && prev !== null && current !== null && current.publicKey.toBase58() !== prev.publicKey.toBase58()) {
                    return current;
                }
                return prev;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Automatic Airdrop for new session keys on Devnet
    useEffect(() => {
        if (sessionKey && process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet') {
            const checkAndAirdrop = async () => {
                try {
                    const balance = await standardConnection.getBalance(sessionKey.publicKey);
                    if (balance < 0.05 * 1e9) { // If less than 0.05 SOL
                        console.log('[MagicBlock] Low balance on session key, requesting airdrop...');
                        const signature = await standardConnection.requestAirdrop(sessionKey.publicKey, 1 * 1e9);
                        await standardConnection.confirmTransaction(signature);
                        console.log('[MagicBlock] Airdrop successful for session key:', sessionKey.publicKey.toBase58());
                    }
                } catch (err) {
                    console.error('[MagicBlock] Airdrop failed (rate limited?):', err);
                }
            };
            void checkAndAirdrop();
        }
    }, [sessionKey, standardConnection]);

    const value = useMemo(() => ({
        standardConnection,
        rollupConnection,
        activeConnection: isUsingRollup ? rollupConnection : standardConnection,
        isUsingRollup,
        setIsUsingRollup,
        sessionKey,
        isSessionActive: sessionKey !== null,
        sessionRemainingTime,
        refreshSession,
        clearSession
    }), [standardConnection, rollupConnection, isUsingRollup, sessionKey, sessionRemainingTime]);

    return (
        <MagicBlockContext.Provider value={value}>
            {children}
        </MagicBlockContext.Provider>
    );
};

export const useMagicBlock = () => {
    const context = useContext(MagicBlockContext);
    if (!context) {
        throw new Error('useMagicBlock must be used within a MagicBlockProvider');
    }
    return context;
};
