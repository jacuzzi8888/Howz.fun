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
                if (!active && prev !== null) return null;
                if (active && prev === null) return SessionManager.getStoredSessionKey();
                return prev; // Return exact same reference to prevent re-renders
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

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
