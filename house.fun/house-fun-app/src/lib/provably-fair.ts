/**
 * Server-side Provably Fair System (HMAC_SHA256)
 * 
 * Same model as Stake.com / Shuffle.com:
 * 1. Server generates a random server seed
 * 2. SHA256 hash of the seed is shown to the player BEFORE the bet
 * 3. Player provides their own client seed (or uses a default)
 * 4. Result = HMAC_SHA256(serverSeed, clientSeed:nonce) → parse to outcome
 * 5. After bet resolves, the unhashed server seed is revealed
 * 6. Player can independently verify the result
 * 
 * Neither side can cheat:
 * - Server committed to the seed via the hash (can't change it post-bet)
 * - Client chooses their own seed (server can't pre-compute a losing result)
 */

import { createHmac, createHash, randomBytes } from "crypto";

// ============================================================
// Core Functions (used by both server and client verification)
// ============================================================

/**
 * Generate a cryptographically random server seed (64 hex chars)
 */
export function generateServerSeed(): string {
    return randomBytes(32).toString("hex");
}

/**
 * Generate a default client seed (32 hex chars)
 * Players can also set their own custom client seed
 */
export function generateClientSeed(): string {
    return randomBytes(16).toString("hex");
}

/**
 * Hash a server seed with SHA256 (shown to player as commitment)
 */
export function hashServerSeed(serverSeed: string): string {
    return createHash("sha256").update(serverSeed).digest("hex");
}

/**
 * Derive a game result from the seed pair using HMAC_SHA256
 * 
 * @param serverSeed - The server's secret seed
 * @param clientSeed - The player's seed
 * @param nonce - Incrementing bet number for this seed pair
 * @returns A float between 0 and 1 (exclusive)
 */
export function generateFloat(
    serverSeed: string,
    clientSeed: string,
    nonce: number
): number {
    const message = `${clientSeed}:${nonce}`;
    const hmac = createHmac("sha256", serverSeed).update(message).digest("hex");

    // Take the first 8 hex characters (32 bits) and convert to a float [0, 1)
    const intValue = parseInt(hmac.substring(0, 8), 16);
    return intValue / 0x100000000; // Divide by 2^32
}

/**
 * Generate a coin flip result (HEADS or TAILS)
 * 
 * HEADS if float < 0.5, TAILS if float >= 0.5
 * This gives exactly 50/50 odds
 */
export function generateCoinFlip(
    serverSeed: string,
    clientSeed: string,
    nonce: number
): "HEADS" | "TAILS" {
    const float = generateFloat(serverSeed, clientSeed, nonce);
    return float < 0.5 ? "HEADS" : "TAILS";
}

/**
 * Verify a coin flip result
 * Used by the /verify page for player verification
 */
export function verifyCoinFlip(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    expectedResult: "HEADS" | "TAILS"
): { verified: boolean; result: "HEADS" | "TAILS"; float: number; hmac: string } {
    const message = `${clientSeed}:${nonce}`;
    const hmac = createHmac("sha256", serverSeed).update(message).digest("hex");
    const float = generateFloat(serverSeed, clientSeed, nonce);
    const result = float < 0.5 ? "HEADS" : "TAILS";

    return {
        verified: result === expectedResult,
        result,
        float,
        hmac,
    };
}
