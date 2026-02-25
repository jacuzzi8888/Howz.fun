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
    // Generate high-quality mock bets for the feed
    const mockBets = Array.from({ length: limit }, (_, i) => ({
      id: `mock-bet-${i}`,
      player: `Whale${Math.floor(Math.random() * 999)}...${Math.random().toString(36).slice(2, 6)}`,
      amount: (Math.random() * 5 + 0.1) * 1_000_000_000,
      payout: Math.random() > 0.5 ? (Math.random() * 10 + 0.5) * 1_000_000_000 : 0,
      gameType,
      prediction: "Demo Prediction",
      status: "Resolved",
      createdAt: new Date(Date.now() - i * 60000).toISOString(),
    }));

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
  return api.game.getPlayerBets.useQuery(
    { limit, offset },
    { enabled: typeof window !== "undefined" }
  );
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
        totalWagered: 156.5 * 1_000_000_000,
        totalProfit: 88.2 * 1_000_000_000,
        winRate: 0.58,
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
    const mockLeaderboard = Array.from({ length: limit }, (_, i) => ({
      wallet: `Player${i + 1}...${Math.random().toString(36).slice(2, 6)}`,
      value: (100 - i * 5 + Math.random() * 5) * 1_000_000_000,
    }));

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
