'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { Connection } from '@solana/web3.js';

interface MagicBlockContextState {
    standardConnection: Connection;
    rollupConnection: Connection;
    activeConnection: Connection;
    isUsingRollup: boolean;
}

const MagicBlockContext = createContext<MagicBlockContextState | null>(null);

export const MagicBlockProvider: React.FC<{
    children: React.ReactNode;
    useRollup?: boolean;
}> = ({ children, useRollup = false }) => {
    // Standard Mainnet/Devnet Connection
    const standardConnection = useMemo(() =>
        new Connection('https://api.mainnet-beta.solana.com', 'confirmed'),
        []);

    // MagicBlock Ephemeral Rollup Connection
    // In a real hackathon setup, this would be the URL provided by MagicBlock Labs
    const rollupConnection = useMemo(() =>
        new Connection('https://mainnet.magicblock.app', 'confirmed'),
        []);

    const value = useMemo(() => ({
        standardConnection,
        rollupConnection,
        activeConnection: useRollup ? rollupConnection : standardConnection,
        isUsingRollup: useRollup
    }), [standardConnection, rollupConnection, useRollup]);

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
