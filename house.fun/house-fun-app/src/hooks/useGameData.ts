import { api } from "~/trpc/react";
import { useDemoMode } from "~/context/DemoModeContext";

/**
 * Hook to fetch all active games
 */
export function useGames() {
  const { isDemoMode } = useDemoMode();
  const query = api.game.getGames.useQuery();

  if (isDemoMode) {
    return {
      ...query,
      data: query.data || [
        { id: '1', name: 'Flip It', type: 'FLIP_IT', houseEdge: 0.025 },
        { id: '2', name: 'Shadow Poker', type: 'SHADOW_POKER', houseEdge: 0.01 },
        { id: '3', name: 'Degen Derby', type: 'DEGEN_DERBY', houseEdge: 0.03 },
        { id: '4', name: 'Meme Fight Club', type: 'FIGHT_CLUB', houseEdge: 0.02 },
      ],
      isLoading: false,
    };
  }
  return query;
}

/**
 * Hook to fetch a specific game by type
 */
export function useGame(type: "FLIP_IT" | "FIGHT_CLUB" | "DEGEN_DERBY" | "SHADOW_POKER") {
  return api.game.getGameByType.useQuery({ type });
}

/**
 * Hook to fetch recent bets for a game
 */
export function useRecentBets(
  gameType: "FLIP_IT" | "FIGHT_CLUB" | "DEGEN_DERBY" | "SHADOW_POKER",
  limit = 10
) {
  const { isDemoMode } = useDemoMode();
  const query = api.game.getRecentBets.useQuery(
    { gameType, limit },
    { refetchInterval: isDemoMode ? false : 5000, enabled: !isDemoMode }
  );

  if (isDemoMode) {
    const sides = ['HEADS', 'TAILS'];
    const games = { FLIP_IT: 'Flip It', FIGHT_CLUB: 'Fight Club', DEGEN_DERBY: 'Degen Derby', SHADOW_POKER: 'Shadow Poker' };
    // Use a seeded approach so data is stable across renders
    // Realistic Base58 characters for wallet addresses
    const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const mockAddresses = [
      '7EgaR2Kp9vXbDfL4kWn8qJmYcNtHs5BzPx3uA1rVLgrX',
      '4FqJhN5cDvPmK8wAe3Tz2rYR7xGbCsLg9nUWjSd6XkVp',
      'Bx8YnKj3mQ6wRvCf2hN5sLpD4gWr7ATz9JEcXuM1VkSd',
      '9PvLmN2kRfJ7sW5cXqYb8dHz3gAer6TKwU4xn1CjStGh',
      'Dh3TqF9c5XkW2vNr8jBm6sPy4gAeK7LxR1nJwUzCbYst',
      '6KwGjN8cVr2mPf5xLqD3hBs4tAeY7RnZb9JXuWk1CpSv',
      'H5dWnJ3rK8cFv2xQmTs6gLp4bAeY9Rz7Bk1jNuXwSCfG',
      '3RvXkM7cNf9wJ2sLqBh5gPd4tAeY8Kz6Wn1jTuCbSpGx',
      'FnJ8cK5wRv3mXq2hBs6gLp4dAeY9Tz7Wk1rNuCbSpGjD',
      '2TsXkN7cWf9vJ3mLqBh5gPd4rAeY8Kz6Rn1wJuCbSpFx',
    ];
    // Variable time intervals (not all exactly 1 minute apart)
    const timeOffsets = [0, 47, 123, 198, 256, 341, 412, 489, 567, 630];
    const mockBets = Array.from({ length: limit }, (_, i) => {
      const won = i % 3 !== 0; // 67% win rate pattern
      const betAmount = Math.floor(((i * 1.3 + 0.5) % 5 + 0.1) * 1_000_000_000);
      const sideIdx = i % 2;
      const offsetSec = (timeOffsets[i] || i * 60) * 1000;
      return {
        id: `mock-bet-${gameType}-${i}`,
        player: {
          walletAddress: mockAddresses[i % mockAddresses.length],
        },
        amount: betAmount,
        payout: won ? Math.floor(betAmount * 1.95) : 0,
        gameType,
        prediction: sides[sideIdx],
        outcome: sides[won ? sideIdx : 1 - sideIdx],
        status: "Resolved",
        playerWon: won,
        payoutAmount: won ? Math.floor(betAmount * 1.95) : 0,
        transactionSignature: `5${mockAddresses[i % mockAddresses.length].slice(1, 44)}`,
        createdAt: new Date(Date.now() - offsetSec).toISOString(),
        resolvedAt: new Date(Date.now() - offsetSec + 5000).toISOString(),
      };
    });

    return {
      ...query,
      data: mockBets,
      isLoading: false,
      isError: false,
    };
  }

  return query;
}

/**
 * Hook to fetch player's bet history
 */
export function usePlayerBets(limit = 20, offset = 0) {
  const { isDemoMode } = useDemoMode();
  const query = api.game.getPlayerBets.useQuery(
    { limit, offset },
    { enabled: typeof window !== "undefined" }
  );

  if (isDemoMode) {
    const gameTypes = ['FLIP_IT', 'DEGEN_DERBY', 'FIGHT_CLUB', 'SHADOW_POKER'];
    const gameNames = ['Flip It', 'Degen Derby', 'Fight Club', 'Shadow Poker'];
    const mockBets = Array.from({ length: limit }, (_, i) => {
      const won = Math.random() > 0.4;
      const gameIdx = Math.floor(Math.random() * 4);
      const betAmt = Math.floor((Math.random() * 5 + 0.1) * 1_000_000_000);
      return {
        id: `mock-history-${i}`,
        gameType: gameTypes[gameIdx],
        game: { name: gameNames[gameIdx] },
        amount: betAmt,
        playerWon: won,
        payoutAmount: won ? Math.floor(betAmt * 1.95) : 0,
        status: 'Resolved',
        placedAt: new Date(Date.now() - i * 3600000).toISOString(),
        resolvedAt: new Date(Date.now() - i * 3600000 + 5000).toISOString(),
        transactionSignature: `${Math.random().toString(36).substring(2, 12)}`,
      };
    });

    return {
      ...query,
      data: query.data || mockBets,
      isLoading: false,
      isError: false,
    };
  }

  return query;
}

/**
 * Hook to fetch player statistics
 */
export function usePlayerStats() {
  const { isDemoMode } = useDemoMode();
  const query = api.game.getPlayerStats.useQuery(
    undefined,
    { enabled: typeof window !== "undefined" }
  );

  if (isDemoMode) {
    return {
      ...query,
      data: query.data || {
        totalBets: 42,
        totalWagered: Math.floor(156.5 * 1_000_000_000),
        netProfit: Math.floor(88.2 * 1_000_000_000),
        winRate: 58.2,
        totalWon: 24,
        totalLost: 18,
      },
      isLoading: false,
    };
  }

  return query;
}

/**
 * Hook to fetch leaderboard
 */
export function useLeaderboard(
  type: "profit" | "wagered" | "bets" = "profit",
  limit = 10
) {
  const { isDemoMode } = useDemoMode();
  const query = api.game.getLeaderboard.useQuery(
    { type, limit },
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  if (isDemoMode) {
    const mockLeaderboard = Array.from({ length: limit }, (_, i) => {
      const totalBets = Math.floor(100 - i * 2 + Math.random() * 10);
      const totalWon = Math.floor(totalBets * (0.6 - i * 0.01));
      return {
        id: `whale-${i}`,
        walletAddress: `Whale${i + 1}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
        username: `HighRoller_${i + 1}`,
        netProfit: Math.floor((500 - i * 20 + Math.random() * 50) * 1_000_000_000),
        totalWagered: Math.floor((2000 - i * 100 + Math.random() * 200) * 1_000_000_000),
        totalBets,
        totalWon,
        totalLost: totalBets - totalWon,
      };
    });

    return {
      ...query,
      data: query.data || mockLeaderboard,
      isLoading: false,
    };
  }

  return query;
}

/**
 * Hook to record a new bet (after on-chain transaction)
 */
export function useRecordBet() {
  const utils = api.useUtils();

  return api.game.recordBet.useMutation({
    onSuccess: () => {
      // Invalidate relevant queries
      utils.game.getRecentBets.invalidate();
      utils.game.getPlayerBets.invalidate();
      utils.game.getPlayerStats.invalidate();
    },
  });
}

/**
 * Hook to resolve a bet (after on-chain resolution)
 */
export function useResolveBet() {
  const utils = api.useUtils();

  return api.game.resolveBet.useMutation({
    onSuccess: () => {
      // Invalidate relevant queries
      utils.game.getRecentBets.invalidate();
      utils.game.getPlayerBets.invalidate();
      utils.game.getPlayerStats.invalidate();
      utils.game.getLeaderboard.invalidate();
    },
  });
}
