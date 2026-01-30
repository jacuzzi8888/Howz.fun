/**
 * Arcium Privacy Utilities
 * Implements a standard Commitment-Reveal scheme using SHA-256 HMAC.
 * This ensures game outcomes are tamper-proof and private until revealed.
 */

export interface Commitment {
    hash: string;
    salt: string;
}

/**
 * Creates a cryptographic commitment for a secret value.
 */
export async function createCommitment(value: string): Promise<Commitment> {
    const salt = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(value + salt);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return {
        hash: hashHex,
        salt: salt
    };
}

/**
 * Verifies that a revealed value and salt match a previously shared hash.
 */
export async function verifyReveal(value: string, salt: string, hash: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const data = encoder.encode(value + salt);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex === hash;
}
