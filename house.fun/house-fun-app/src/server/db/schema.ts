// Database schema for house.fun - Solana Casino
// https://orm.drizzle.team/docs/sql-schema-declaration

import { index, pgTableCreator, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Multi-project schema feature of Drizzle ORM
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `house-fun-app_${name}`);

// Enums
export const gameTypeEnum = pgEnum("game_type", [
  "FLIP_IT",
  "FIGHT_CLUB", 
  "DEGEN_DERBY",
  "SHADOW_POKER",
]);

export const betStatusEnum = pgEnum("bet_status", [
  "PENDING",      // Bet placed, waiting for commitment
  "COMMITTED",    // Player committed to choice
  "RESOLVED",     // Game resolved
  "CLAIMED",      // Winnings claimed
  "TIMEOUT",      // Player timeout, house wins
  "CANCELLED",    // Bet cancelled
]);

export const outcomeEnum = pgEnum("outcome", [
  "HEADS",
  "TAILS",
  "PLAYER_WIN",
  "HOUSE_WIN",
  "DRAW",
]);

// Tables

/**
 * Players table - tracks user statistics and preferences
 */
export const players = createTable(
  "player",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    walletAddress: d.varchar({ length: 44 }).notNull().unique(), // Solana pubkey
    username: d.varchar({ length: 32 }),
    totalBets: d.integer().default(0),
    totalWagered: d.bigint({ mode: "number" }).default(0), // in lamports
    totalWon: d.bigint({ mode: "number" }).default(0),
    totalLost: d.bigint({ mode: "number" }).default(0),
    netProfit: d.bigint({ mode: "number" }).default(0),
    favoriteGame: gameTypeEnum(),
    createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
    lastLoginAt: d.timestamp({ withTimezone: true }),
  }),
  (t) => [
    index("wallet_address_idx").on(t.walletAddress),
    index("username_idx").on(t.username),
  ],
);

/**
 * Games table - tracks game configuration and statistics
 */
export const games = createTable(
  "game",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    type: gameTypeEnum().notNull(),
    name: d.varchar({ length: 64 }).notNull(),
    description: d.text(),
    minBet: d.bigint({ mode: "number" }).default(1000000), // 0.001 SOL
    maxBet: d.bigint({ mode: "number" }).default(100000000000), // 100 SOL
    houseEdgeBps: d.integer().default(100), // 1% = 100 basis points
    isActive: d.boolean().default(true),
    totalBets: d.bigint({ mode: "number" }).default(0),
    totalVolume: d.bigint({ mode: "number" }).default(0),
    totalHouseProfit: d.bigint({ mode: "number" }).default(0),
    programId: d.varchar({ length: 44 }), // Solana program address
    createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("game_type_idx").on(t.type),
    index("game_active_idx").on(t.isActive),
  ],
);

/**
 * Bets table - tracks all bets placed on-chain
 */
export const bets = createTable(
  "bet",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    
    // On-chain references
    betPda: d.varchar({ length: 44 }).notNull().unique(), // Solana PDA address
    transactionSignature: d.varchar({ length: 88 }), // First transaction
    
    // Relations
    playerId: d.integer().references(() => players.id),
    gameId: d.integer().references(() => games.id),
    
    // Bet details
    amount: d.bigint({ mode: "number" }).notNull(), // in lamports
    status: betStatusEnum().default("PENDING").notNull(),
    
    // Commit-reveal scheme
    playerChoice: d.integer(), // 0 = HEADS, 1 = TAILS (encrypted until reveal)
    commitmentHash: d.varchar({ length: 64 }), // SHA-256 hash
    nonce: d.bigint({ mode: "number" }), // Secret nonce
    
    // Resolution
    outcome: outcomeEnum(),
    playerWon: d.boolean(),
    payoutAmount: d.bigint({ mode: "number" }), // Amount paid to player
    houseFee: d.bigint({ mode: "number" }), // Fee collected
    
    // Timestamps
    placedAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
    committedAt: d.timestamp({ withTimezone: true }),
    resolvedAt: d.timestamp({ withTimezone: true }),
    claimedAt: d.timestamp({ withTimezone: true }),
    
    // Block references for verification
    commitSlot: d.bigint({ mode: "number" }),
    resolveSlot: d.bigint({ mode: "number" }),
  }),
  (t) => [
    index("bet_pda_idx").on(t.betPda),
    index("bet_player_idx").on(t.playerId),
    index("bet_game_idx").on(t.gameId),
    index("bet_status_idx").on(t.status),
    index("bet_placed_at_idx").on(t.placedAt),
    index("bet_tx_idx").on(t.transactionSignature),
  ],
);

/**
 * Game Sessions table - for multiplayer games (poker, derby)
 */
export const gameSessions = createTable(
  "game_session",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    gameId: d.integer().references(() => games.id).notNull(),
    
    // Session details
    sessionPda: d.varchar({ length: 44 }).unique(), // On-chain session PDA
    status: d.varchar({ length: 20 }).default("WAITING"), // WAITING, ACTIVE, COMPLETED
    
    // Configuration
    minPlayers: d.integer().default(2),
    maxPlayers: d.integer().default(6),
    entryFee: d.bigint({ mode: "number" }), // in lamports
    prizePool: d.bigint({ mode: "number" }).default(0),
    
    // Participants (JSON array of player IDs)
    playerIds: d.json().$type<number[]>(),
    winnerId: d.integer().references(() => players.id),
    
    // Timestamps
    createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
    startedAt: d.timestamp({ withTimezone: true }),
    endedAt: d.timestamp({ withTimezone: true }),
  }),
  (t) => [
    index("session_game_idx").on(t.gameId),
    index("session_status_idx").on(t.status),
    index("session_pda_idx").on(t.sessionPda),
  ],
);

/**
 * House Treasury table - tracks house profits and withdrawals
 */
export const houseTreasury = createTable(
  "house_treasury",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    
    // On-chain reference
    housePda: d.varchar({ length: 44 }).notNull().unique(),
    
    // Balances
    totalFeesCollected: d.bigint({ mode: "number" }).default(0),
    totalWithdrawn: d.bigint({ mode: "number" }).default(0),
    currentBalance: d.bigint({ mode: "number" }).default(0),
    
    // Statistics
    totalBetsProcessed: d.bigint({ mode: "number" }).default(0),
    totalVolume: d.bigint({ mode: "number" }).default(0),
    
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
);

/**
 * Treasury Transactions - audit log for all treasury movements
 */
export const treasuryTransactions = createTable(
  "treasury_transaction",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    treasuryId: d.integer().references(() => houseTreasury.id).notNull(),
    
    // Transaction details
    type: d.varchar({ length: 20 }).notNull(), // FEE, WITHDRAWAL, DEPOSIT
    amount: d.bigint({ mode: "number" }).notNull(),
    transactionSignature: d.varchar({ length: 88 }),
    
    // Reference to related bet (for fees)
    betId: d.integer().references(() => bets.id),
    
    // Metadata
    description: d.text(),
    createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()).notNull(),
  }),
  (t) => [
    index("treasury_tx_treasury_idx").on(t.treasuryId),
    index("treasury_tx_type_idx").on(t.type),
    index("treasury_tx_signature_idx").on(t.transactionSignature),
  ],
);

/**
 * Leaderboard - cached leaderboard data for performance
 */
export const leaderboard = createTable(
  "leaderboard",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    playerId: d.integer().references(() => players.id).notNull().unique(),
    
    // Rankings
    totalProfitRank: d.integer(),
    totalWageredRank: d.integer(),
    winStreakRank: d.integer(),
    
    // Game-specific stats (JSON)
    gameStats: d.json(),
    
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
);

// Relations
export const playersRelations = relations(players, ({ many }) => ({
  bets: many(bets),
  sessions: many(gameSessions),
  leaderboard: many(leaderboard),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  bets: many(bets),
  sessions: many(gameSessions),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  player: one(players, {
    fields: [bets.playerId],
    references: [players.id],
  }),
  game: one(games, {
    fields: [bets.gameId],
    references: [games.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  game: one(games, {
    fields: [gameSessions.gameId],
    references: [games.id],
  }),
  winner: one(players, {
    fields: [gameSessions.winnerId],
    references: [players.id],
  }),
  bets: many(bets),
}));

// Legacy table (keeping for compatibility)
export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);
