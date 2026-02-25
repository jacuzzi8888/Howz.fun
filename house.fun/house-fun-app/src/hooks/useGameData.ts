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
    { refetchInterval: 5000 } // Refetch every 5 seconds for live updates
  );

  if (isDemoMode) {
    const sides = ['HEADS', 'TAILS'];
    const mockBets = Array.from({ length: limit }, (_, i) => {
      const won = Math.random() > 0.4;
      const betAmount = Math.floor((Math.random() * 5 + 0.1) * 1_000_000_000);
      return {
        id: `mock-bet-${i}`,
        player: {
          walletAddress: `Howz${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}xxxxxxxxxxxx`,
        },
        amount: betAmount,
        payout: won ? Math.floor(betAmount * 1.95) : 0,
        gameType,
        prediction: sides[Math.floor(Math.random() * 2)],
        outcome: sides[Math.floor(Math.random() * 2)],
        status: "Resolved",
        playerWon: won,
        payoutAmount: won ? Math.floor(betAmount * 1.95) : 0,
        transactionSignature: `${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`,
        createdAt: new Date(Date.now() - i * 60000).toISOString(),
        resolvedAt: new Date(Date.now() - i * 60000 + 5000).toISOString(),
      };
    });

    return {
      ...query,
      data: query.data || mockBets,
      isLoading: false,
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
