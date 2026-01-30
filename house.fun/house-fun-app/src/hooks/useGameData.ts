import { api } from "~/trpc/react";

/**
 * Hook to fetch all active games
 */
export function useGames() {
  return api.game.getGames.useQuery();
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
  return api.game.getRecentBets.useQuery(
    { gameType, limit },
    { refetchInterval: 5000 } // Refetch every 5 seconds for live updates
  );
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
  return api.game.getPlayerStats.useQuery(
    undefined,
    { enabled: typeof window !== "undefined" }
  );
}

/**
 * Hook to fetch leaderboard
 */
export function useLeaderboard(
  type: "profit" | "wagered" | "bets" = "profit",
  limit = 10
) {
  return api.game.getLeaderboard.useQuery(
    { type, limit },
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );
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
