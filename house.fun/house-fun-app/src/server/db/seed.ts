import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Seed the games table with the 4 game types.
 * 
 * Usage: npx tsx src/server/db/seed.ts
 * 
 * Requires DATABASE_URL environment variable.
 * Uses onConflictDoNothing to be idempotent (safe to run multiple times).
 */
async function seed() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("❌ DATABASE_URL environment variable is required");
        console.error("   Set it in your .env file or pass it inline:");
        console.error("   DATABASE_URL=postgresql://... npx tsx src/server/db/seed.ts");
        process.exit(1);
    }

    console.log("🌱 Seeding house.fun database...\n");

    const conn = postgres(databaseUrl, { prepare: false });
    const db = drizzle(conn, { schema });

    // Seed games
    const gameData = [
        {
            type: "FLIP_IT" as const,
            name: "Flip It",
            description: "Classic coin flip — pick HEADS or TAILS, double your SOL. 50/50 odds, 2x payout, 2% house edge. The simplest bet in the house.",
            minBet: 10_000_000,        // 0.01 SOL
            maxBet: 100_000_000_000,   // 100 SOL
            houseEdgeBps: 200,         // 2% = 200 basis points
            isActive: true,
            programId: process.env.NEXT_PUBLIC_FLIP_IT_PROGRAM_ID ?? "BWGSySnUGc9GRW4KdesmNAzp9Y2KoCioUfrz1Q5cdcqu",
        },
        {
            type: "FIGHT_CLUB" as const,
            name: "Fight Club",
            description: "Pick your fighter, stake your SOL. The first rule of Fight Club: the house always gets 1%.",
            minBet: 10_000_000,
            maxBet: 50_000_000_000,
            houseEdgeBps: 100,         // 1%
            isActive: true,
            programId: null,
        },
        {
            type: "DEGEN_DERBY" as const,
            name: "Degen Derby",
            description: "Place your bets on the next meme-fueled race. 4 runners, 1 winner, infinite degen energy.",
            minBet: 10_000_000,
            maxBet: 50_000_000_000,
            houseEdgeBps: 100,
            isActive: true,
            programId: null,
        },
        {
            type: "SHADOW_POKER" as const,
            name: "Shadow Poker",
            description: "Encrypted poker on Solana. Your cards are hidden by Arcium confidential computing — not even the house can see them.",
            minBet: 50_000_000,        // 0.05 SOL
            maxBet: 200_000_000_000,   // 200 SOL
            houseEdgeBps: 50,          // 0.5%
            isActive: true,
            programId: null,
        },
    ];

    for (const game of gameData) {
        try {
            await db
                .insert(schema.games)
                .values(game)
                .onConflictDoNothing();
            console.log(`  ✅ ${game.name} (${game.type})`);
        } catch (error) {
            // If onConflictDoNothing doesn't work (e.g., no unique constraint on type),
            // check if the game already exists
            const existing = await db.query.games.findFirst({
                where: (games, { eq }) => eq(games.type, game.type),
            });
            if (existing) {
                console.log(`  ⏭️  ${game.name} already exists (id: ${existing.id})`);
            } else {
                console.error(`  ❌ Failed to seed ${game.name}:`, error);
            }
        }
    }

    console.log("\n🎰 Seeding complete! The house is ready.\n");

    // Close connection
    await conn.end();
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
