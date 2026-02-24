'use client';

import React, { useState } from 'react';
import { useLeaderboard } from '~/hooks/useGameData';
import { shortenAddress, formatSol } from '~/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { FullPageLoader } from '~/components/loading';
import { GameErrorBoundary } from '~/components/error-boundaries';
import { cn } from '~/lib/utils';

type LeaderboardType = 'profit' | 'wagered' | 'bets';

export default function LeaderboardPage() {
  return (
    <GameErrorBoundary>
      <LeaderboardContent />
    </GameErrorBoundary>
  );
}

function LeaderboardContent() {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('profit');
  const { data: players, isLoading } = useLeaderboard(activeTab, 20);

  const userRankIndex = players?.findIndex(p => p.walletAddress === publicKey?.toBase58());
  const hasRank = userRankIndex !== undefined && userRankIndex >= 0;

  const tabs = [
    { id: 'profit' as LeaderboardType, label: 'Top Profit', icon: 'trending_up' },
    { id: 'wagered' as LeaderboardType, label: 'Most Wagered', icon: 'payments' },
    { id: 'bets' as LeaderboardType, label: 'Most Bets', icon: 'casino' },
  ];

  if (isLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Leaderboard</h1>
          <p className="text-gray-400">Top players ranked by performance</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                activeTab === tab.id
                  ? "bg-primary text-black shadow-[0_0_20px_rgba(7,204,0,0.3)]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-3 text-right">
              {activeTab === 'profit' && 'Net Profit'}
              {activeTab === 'wagered' && 'Total Wagered'}
              {activeTab === 'bets' && 'Total Bets'}
            </div>
            <div className="col-span-3 text-right">Win Rate</div>
          </div>

          {/* Player Rows */}
          {players && players.length > 0 ? (
            <div className="divide-y divide-white/5">
              {players.map((player, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                const value = (activeTab === 'profit'
                  ? player.netProfit
                  : activeTab === 'wagered'
                    ? player.totalWagered
                    : player.totalBets) ?? 0;
                const isPositive = value >= 0;
                const totalGames = (player.totalWon ?? 0) + (player.totalLost ?? 0);
                const winRate = totalGames > 0 ? ((player.totalWon ?? 0) / totalGames) * 100 : 0;

                return (
                  <div
                    key={player.id}
                    className={cn(
                      "grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors",
                      isTop3 && "bg-white/5"
                    )}
                  >
                    {/* Rank */}
                    <div className="col-span-1 text-center">
                      {isTop3 ? (
                        <div className={cn(
                          "size-8 rounded-full flex items-center justify-center font-black text-sm mx-auto",
                          rank === 1 && "bg-yellow-500/20 text-yellow-500",
                          rank === 2 && "bg-gray-400/20 text-gray-400",
                          rank === 3 && "bg-orange-600/20 text-orange-600"
                        )}>
                          {rank}
                        </div>
                      ) : (
                        <span className="text-gray-500 font-bold">{rank}</span>
                      )}
                    </div>

                    {/* Player */}
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="size-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">account_circle</span>
                      </div>
                      <div>
                        <p className="text-white font-bold">
                          {player.username || shortenAddress(player.walletAddress, 6)}
                        </p>
                        <p className="text-gray-500 text-xs font-mono">
                          {shortenAddress(player.walletAddress, 4)}
                        </p>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="col-span-3 text-right">
                      <p className={cn(
                        "font-black",
                        activeTab === 'profit' && (isPositive ? 'text-primary' : 'text-danger'),
                        activeTab !== 'profit' && 'text-white'
                      )}>
                        {activeTab === 'profit' && isPositive && '+'}
                        {activeTab === 'profit' && formatSol(value) + ' SOL'}
                        {activeTab === 'wagered' && formatSol(value) + ' SOL'}
                        {activeTab === 'bets' && value}
                      </p>
                    </div>

                    {/* Win Rate */}
                    <div className="col-span-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, winRate)}%` }}
                          />
                        </div>
                        <span className="text-white font-bold text-sm">
                          {winRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <span className="material-symbols-outlined text-4xl mb-2">emoji_events</span>
              <p>No players yet</p>
              <p className="text-sm mt-1">Be the first to make the leaderboard!</p>
            </div>
          )}
        </div>

        {/* Your Rank Card */}
        <div className="mt-8 glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-black text-white mb-4">Your Ranking</h3>
          {connected ? (
            hasRank ? (
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center text-xl border border-primary/30">
                  #{userRankIndex! + 1}
                </div>
                <div>
                  <p className="text-white font-bold">You are ranked #{userRankIndex! + 1}</p>
                  <p className="text-gray-400 text-sm">Keep playing to reach the top!</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                You are not on the leaderboard yet. Play some games to get ranked!
              </p>
            )
          ) : (
            <p className="text-gray-400 text-sm">
              Connect your wallet and start playing to appear on the leaderboard!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}