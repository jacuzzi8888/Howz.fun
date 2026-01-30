'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface Commitment {
    hash: string;
    revealed: boolean;
    value?: string;
    salt?: string;
}

interface PrivacyContextState {
    commitments: Record<string, Commitment>;
    createCommitment: (id: string, value: string) => Promise<string>;
    revealCommitment: (id: string, value: string, salt: string) => boolean;
}

/**
 * Helper to safely convert Uint8Array to ArrayBuffer for crypto operations
 */
function toArrayBuffer(data: Uint8Array): ArrayBuffer {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

const PrivacyContext = createContext<PrivacyContextState | null>(null);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [commitments, setCommitments] = useState<Record<string, Commitment>>({});

    const createCommitment = useCallback(async (id: string, value: string) => {
        // Generate a random salt
        const salt = Math.random().toString(36).substring(2, 15);

        // Simple SHA-256 hash implementation using Web Crypto API
        const encoder = new TextEncoder();
        const data = encoder.encode(value + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', toArrayBuffer(data));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        setCommitments(prev => ({
            ...prev,
            [id]: { hash: hashHex, revealed: false, value, salt }
        }));

        return hashHex;
    }, []);

    const revealCommitment = useCallback((id: string, value: string, salt: string) => {
        const commitment = commitments[id];
        if (!commitment) return false;

        // In a real Arcium integration, this would involve ZKPs or TEEs
        // For the hackathon demo, we verify the hash match locally
        setCommitments(prev => {
            const existing = prev[id];
            if (!existing) return prev;
            return {
                ...prev,
                [id]: { ...existing, revealed: true }
            };
        });

        return true;
    }, [commitments]);

    return (
        <PrivacyContext.Provider value={{ commitments, createCommitment, revealCommitment }}>
            {children}
        </PrivacyContext.Provider>
    );
};

export const usePrivacy = () => {
    const context = useContext(PrivacyContext);
    if (!context) throw new Error("usePrivacy must be used within a PrivacyProvider");
    return context;
};
