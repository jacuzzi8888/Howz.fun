import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { bets, players, games, gameSessions } from "~/server/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const gameRouter = createTRPCRouter({
  // Get all active games
  getGames: publicProcedure.query(async ({ ctx }) => {
    const gamesList = await ctx.db.query.games.findMany({
      where: eq(games.isActive, true),
      orderBy: desc(games.totalVolume),
    });
    return gamesList;
  }),

  // Get specific game by type
  getGameByType: publicProcedure
    .input(z.object({ type: z.enum(["FLIP_IT", "FIGHT_CLUB", "DEGEN_DERBY", "SHADOW_POKER"]) }))
    .query(async ({ ctx, input }) => {
      const game = await ctx.db.query.games.findFirst({
        where: eq(games.type, input.type),
      });
      return game;
    }),

  // Get recent bets for a game
  getRecentBets: publicProcedure
    .input(z.object({ 
      gameType: z.enum(["FLIP_IT", "FIGHT_CLUB", "DEGEN_DERBY", "SHADOW_POKER"]),
      limit: z.number().default(10),
    }))
    .query(async ({ ctx, input }) => {
      const recentBets = await ctx.db.query.bets.findMany({
        where: and(
          eq(bets.status, "RESOLVED"),
          sql`${bets.gameId} IN (SELECT id FROM ${games} WHERE type = ${input.gameType})`
        ),
        orderBy: desc(bets.resolvedAt),
        limit: input.limit,
        with: {
          player: true,
        },
      });
      return recentBets;
    }),

  // Get player's bet history
  getPlayerBets: protectedProcedure
    .input(z.object({ 
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const walletAddress = ctx.session?.user?.walletAddress;
      if (!walletAddress) return [];

      const player = await ctx.db.query.players.findFirst({
        where: eq(players.walletAddress, walletAddress),
      });

      if (!player) return [];

      const playerBets = await ctx.db.query.bets.findMany({
        where: eq(bets.playerId, player.id),
        orderBy: desc(bets.placedAt),
        limit: input.limit,
        offset: input.offset,
        with: {
          game: true,
        },
      });
      return playerBets;
    }),

  // Record a new bet (called after on-chain transaction)
  recordBet: protectedProcedure
    .input(z.object({
      gameType: z.enum(["FLIP_IT", "FIGHT_CLUB", "DEGEN_DERBY", "SHADOW_POKER"]),
      betPda: z.string(),
      transactionSignature: z.string(),
      amount: z.number(),
      playerChoice: z.number().optional(),
      commitmentHash: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const walletAddress = ctx.session?.user?.walletAddress;
      if (!walletAddress) throw new Error("Wallet not connected");

      // Get or create player
      let player = await ctx.db.query.players.findFirst({
        where: eq(players.walletAddress, walletAddress),
      });

      if (!player) {
        const [newPlayer] = await ctx.db.insert(players).values({
          walletAddress,
          totalBets: 0,
          totalWagered: 0,
          totalWon: 0,
          totalLost: 0,
          netProfit: 0,
        }).returning();
        if (!newPlayer) throw new Error("Failed to create player");
        player = newPlayer;
      }

      // Get game
      const game = await ctx.db.query.games.findFirst({
        where: eq(games.type, input.gameType),
      });

      if (!game) throw new Error("Game not found");

      // Create bet record
      const [bet] = await ctx.db.insert(bets).values({
        betPda: input.betPda,
        transactionSignature: input.transactionSignature,
        playerId: player.id,
        gameId: game.id,
        amount: input.amount,
        status: "COMMITTED",
        playerChoice: input.playerChoice,
        commitmentHash: input.commitmentHash,
      }).returning();

      // Update player stats
      await ctx.db.update(players).set({
        totalBets: sql`${players.totalBets} + 1`,
        totalWagered: sql`${players.totalWagered} + ${input.amount}`,
      }).where(eq(players.id, player.id));

      // Update game stats
      await ctx.db.update(games).set({
        totalBets: sql`${games.totalBets} + 1`,
        totalVolume: sql`${games.totalVolume} + ${input.amount}`,
      }).where(eq(games.id, game.id));

      return bet;
    }),

  // Update bet after resolution
  resolveBet: protectedProcedure
    .input(z.object({
      betPda: z.string(),
      outcome: z.enum(["HEADS", "TAILS", "PLAYER_WIN", "HOUSE_WIN", "DRAW"]),
      playerWon: z.boolean(),
      payoutAmount: z.number(),
      houseFee: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.db.query.bets.findFirst({
        where: eq(bets.betPda, input.betPda),
        with: {
          player: true,
          game: true,
        },
      });

      if (!bet) throw new Error("Bet not found");

      // Update bet
      await ctx.db.update(bets).set({
        status: "RESOLVED",
        outcome: input.outcome,
        playerWon: input.playerWon,
        payoutAmount: input.payoutAmount,
        houseFee: input.houseFee,
        resolvedAt: new Date(),
      }).where(eq(bets.id, bet.id));

      // Update player stats
      const netProfit = input.playerWon 
        ? input.payoutAmount - bet.amount 
        : -bet.amount;

      if (bet.playerId) {
        await ctx.db.update(players).set({
          totalWon: input.playerWon 
            ? sql`${players.totalWon} + ${input.payoutAmount}` 
            : sql`${players.totalWon}`,
          totalLost: input.playerWon 
            ? sql`${players.totalLost}` 
            : sql`${players.totalLost} + ${bet.amount}`,
          netProfit: sql`${players.netProfit} + ${netProfit}`,
          favoriteGame: bet.game?.type || null,
        }).where(eq(players.id, bet.playerId));
      }

      // Update game house profit
      if (bet.gameId) {
        await ctx.db.update(games).set({
          totalHouseProfit: sql`${games.totalHouseProfit} + ${input.houseFee}`,
        }).where(eq(games.id, bet.gameId));
      }

      return { success: true };
    }),

  // Get player statistics
  getPlayerStats: protectedProcedure.query(async ({ ctx }) => {
    const walletAddress = ctx.session?.user?.walletAddress;
    if (!walletAddress) return null;

    const player = await ctx.db.query.players.findFirst({
      where: eq(players.walletAddress, walletAddress),
    });

    if (!player) {
      return {
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        netProfit: 0,
        winRate: 0,
      };
    }

    const totalBets = player.totalBets || 0;
    const totalLost = player.totalLost || 0;
    const totalWagered = player.totalWagered || 0;
    
    const winRate = totalBets > 0 
      ? (totalBets - Math.floor(totalLost / (totalWagered / totalBets))) / totalBets * 100 
      : 0;

    return {
      ...player,
      winRate: Math.round(winRate * 100) / 100,
    };
  }),

  // Get leaderboard
  getLeaderboard: publicProcedure
    .input(z.object({ 
      type: z.enum(["profit", "wagered", "bets"]).default("profit"),
      limit: z.number().default(10),
    }))
    .query(async ({ ctx, input }) => {
      let orderBy;
      switch (input.type) {
        case "profit":
          orderBy = desc(players.netProfit);
          break;
        case "wagered":
          orderBy = desc(players.totalWagered);
          break;
        case "bets":
          orderBy = desc(players.totalBets);
          break;
      }

      const topPlayers = await ctx.db.query.players.findMany({
        orderBy,
        limit: input.limit,
      });

      return topPlayers.map((player, index) => ({
        rank: index + 1,
        ...player,
      }));
    }),
});
