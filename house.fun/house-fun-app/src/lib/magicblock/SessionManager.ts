import { Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import * as bs58 from 'bs58';

/**
 * SessionManager handles the lifecycle of ephemeral session keys.
 * In the 2026 house.fun architecture, this allows players to sign once 
 * and play multiple hands/rounds without wallet popups.
 */
export class SessionManager {
    private static SESSION_KEY_STORAGE_KEY = 'house_fun_session_key';
    private static SESSION_EXPIRY_KEY = 'house_fun_session_expiry';

    /**
     * Generates a new ephemeral keypair for the session.
     */
    static createEphemeralKeypair(): Keypair {
        const keypair = Keypair.generate();
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.SESSION_KEY_STORAGE_KEY, bs58.encode(keypair.secretKey));
            // Set expiry for 1 hour from now
            const expiry = Date.now() + 3600 * 1000;
            localStorage.setItem(this.SESSION_EXPIRY_KEY, expiry.toString());
        }
        return keypair;
    }

    /**
     * Retrieves the current ephemeral keypair from storage if it exists and is not expired.
     */
    static getStoredSessionKey(): Keypair | null {
        if (typeof window === 'undefined') return null;

        const storedKey = localStorage.getItem(this.SESSION_KEY_STORAGE_KEY);
        const expiry = localStorage.getItem(this.SESSION_EXPIRY_KEY);

        if (!storedKey || !expiry) return null;

        if (Date.now() > parseInt(expiry)) {
            this.clearSession();
            return null;
        }

        try {
            return Keypair.fromSecretKey(bs58.decode(storedKey));
        } catch (e) {
            console.error('Failed to decode stored session key', e);
            return null;
        }
    }

    /**
     * Clears the current session.
     */
    static clearSession() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.SESSION_KEY_STORAGE_KEY);
            localStorage.removeItem(this.SESSION_EXPIRY_KEY);
        }
    }

    /**
     * Helper to check if a session is currently active.
     */
    static isSessionActive(): boolean {
        return this.getStoredSessionKey() !== null;
    }

    /**
     * Formats the remaining session time as a string.
     */
    static getRemainingTime(): string {
        if (typeof window === 'undefined') return '00:00';
        const expiry = localStorage.getItem(this.SESSION_EXPIRY_KEY);
        if (!expiry) return '00:00';

        const remaining = parseInt(expiry) - Date.now();
        if (remaining <= 0) return '00:00';

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
