import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import {
    generateServerSeed,
    generateClientSeed,
    hashServerSeed,
    generateCoinFlip,
    verifyCoinFlip,
} from "~/lib/provably-fair";

/**
 * In-memory seed storage for the MVP.
 * 
 * In production, this would be stored in the database with proper
 * encryption at rest. For the hackathon, in-memory is sufficient
 * to demonstrate the provably fair flow.
 * 
 * Key: walletAddress, Value: { serverSeed, hashedSeed, clientSeed, nonce }
 */
const activeSeedPairs = new Map<
    string,
    {
        serverSeed: string;
        hashedSeed: string;
        clientSeed: string;
        nonce: number;
    }
>();

/**
 * Revealed seeds for verification (kept for 1 hour)
 * Key: `${walletAddress}:${nonce}`, Value: serverSeed
 */
const revealedSeeds = new Map<string, { serverSeed: string; expiresAt: number }>();

export const fairnessRouter = createTRPCRouter({
    /**
     * Get or create an active server seed for the player.
     * Returns the SHA256 hash (commitment) — NOT the seed itself.
     * Also returns or generates a default client seed.
     */
    getActiveSeed: protectedProcedure.query(async ({ ctx }) => {
        const walletAddress = ctx.session.user.walletAddress;

        let seedPair = activeSeedPairs.get(walletAddress);

        if (!seedPair) {
            const serverSeed = generateServerSeed();
            seedPair = {
                serverSeed,
                hashedSeed: hashServerSeed(serverSeed),
                clientSeed: generateClientSeed(),
                nonce: 0,
            };
            activeSeedPairs.set(walletAddress, seedPair);
        }

        return {
            hashedServerSeed: seedPair.hashedSeed,
            clientSeed: seedPair.clientSeed,
            nonce: seedPair.nonce,
        };
    }),

    /**
     * Update the player's client seed.
     * Players should be able to set their own client seed for maximum trust.
     */
    setClientSeed: protectedProcedure
        .input(z.object({ clientSeed: z.string().min(1).max(64) }))
        .mutation(async ({ ctx, input }) => {
            const walletAddress = ctx.session.user.walletAddress;
            const seedPair = activeSeedPairs.get(walletAddress);

            if (!seedPair) {
                throw new Error("No active seed pair. Place a bet first.");
            }

            seedPair.clientSeed = input.clientSeed;
            return { success: true };
        }),

    /**
     * Generate the next game result and increment the nonce.
     * Called internally during the flip flow.
     * Returns the outcome and the data needed for later verification.
     */
    generateResult: protectedProcedure
        .input(z.object({
            gameType: z.enum(["COIN_FLIP"]),
        }))
        .mutation(async ({ ctx, input }) => {
            const walletAddress = ctx.session.user.walletAddress;

            let seedPair = activeSeedPairs.get(walletAddress);
            if (!seedPair) {
                const serverSeed = generateServerSeed();
                seedPair = {
                    serverSeed,
                    hashedSeed: hashServerSeed(serverSeed),
                    clientSeed: generateClientSeed(),
                    nonce: 0,
                };
                activeSeedPairs.set(walletAddress, seedPair);
            }

            const currentNonce = seedPair.nonce;
            const result = generateCoinFlip(
                seedPair.serverSeed,
                seedPair.clientSeed,
                currentNonce
            );

            // Store the server seed for later reveal
            const revealKey = `${walletAddress}:${currentNonce}`;
            revealedSeeds.set(revealKey, {
                serverSeed: seedPair.serverSeed,
                expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
            });

            // Increment nonce for next bet
            seedPair.nonce += 1;

            return {
                outcome: result,
                nonce: currentNonce,
                clientSeed: seedPair.clientSeed,
                hashedServerSeed: seedPair.hashedSeed,
            };
        }),

    /**
     * Reveal the server seed for a specific bet (by nonce).
     * Only available after the bet has been resolved.
     */
    revealSeed: protectedProcedure
        .input(z.object({ nonce: z.number() }))
        .query(async ({ ctx, input }) => {
            const walletAddress = ctx.session.user.walletAddress;
            const revealKey = `${walletAddress}:${input.nonce}`;
            const revealed = revealedSeeds.get(revealKey);

            if (!revealed) {
                throw new Error(
                    "Server seed not available. It may have expired or the bet hasn't been placed yet."
                );
            }

            return {
                serverSeed: revealed.serverSeed,
            };
        }),

    /**
     * Rotate to a completely new server seed.
     * This reveals the current seed and generates a fresh one.
     * Players can do this anytime for extra trust.
     */
    rotateSeed: protectedProcedure.mutation(async ({ ctx }) => {
        const walletAddress = ctx.session.user.walletAddress;
        const oldSeedPair = activeSeedPairs.get(walletAddress);

        // Generate new seed pair
        const newServerSeed = generateServerSeed();
        const newSeedPair = {
            serverSeed: newServerSeed,
            hashedSeed: hashServerSeed(newServerSeed),
            clientSeed: oldSeedPair?.clientSeed ?? generateClientSeed(),
            nonce: 0,
        };

        activeSeedPairs.set(walletAddress, newSeedPair);

        return {
            previousServerSeed: oldSeedPair?.serverSeed ?? null,
            newHashedServerSeed: newSeedPair.hashedSeed,
            clientSeed: newSeedPair.clientSeed,
            nonce: 0,
        };
    }),

    /**
     * Public verification endpoint.
     * Anyone can verify a bet result without being authenticated.
     */
    verify: publicProcedure
        .input(
            z.object({
                serverSeed: z.string(),
                clientSeed: z.string(),
                nonce: z.number(),
                expectedResult: z.enum(["HEADS", "TAILS"]),
            })
        )
        .query(async ({ input }) => {
            return verifyCoinFlip(
                input.serverSeed,
                input.clientSeed,
                input.nonce,
                input.expectedResult
            );
        }),
});
