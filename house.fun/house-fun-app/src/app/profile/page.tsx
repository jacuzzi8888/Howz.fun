'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePlayerStats, usePlayerBets } from '~/hooks/useGameData';
import { shortenAddress, formatSol } from '~/lib/utils';
import { FullPageLoader } from '~/components/loading';
import { GameErrorBoundary } from '~/components/error-boundaries';
import { useDemoMode } from '~/context/DemoModeContext';

export default function ProfilePage() {
  return (
    <GameErrorBoundary>
      <ProfileContent />
    </GameErrorBoundary>
  );
}

function ProfileContent() {
  const { publicKey, connected } = useWallet();
  const { isDemoMode } = useDemoMode();
  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats } = usePlayerStats();
  const { data: bets, isLoading: isLoadingBets, isError: isErrorBets } = usePlayerBets(20, 0);

  if (!isDemoMode && !connected) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-md">
          <span className="material-symbols-outlined text-6xl text-gray-500 mb-4">account_circle</span>
          <h2 className="text-2xl font-black text-white mb-2">Connect Wallet</h2>
          <p className="text-gray-400 mb-6">Connect your wallet to view your profile and betting history</p>
        </div>
      </div>
    );
  }

  if (isErrorStats || isErrorBets) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-md border border-danger/20">
          <span className="material-symbols-outlined text-6xl text-danger mb-4">sync_problem</span>
          <h2 className="text-2xl font-black text-white mb-2">Profile Unavailable</h2>
          <p className="text-gray-400 mb-6">We're having trouble retrieving your player record data from Supabase.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-colors border border-white/10"
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingStats || isLoadingBets) {
    return <FullPageLoader />;
  }

  const winRate = stats?.winRate || 0;
  const totalProfit = stats?.netProfit || 0;
  const isProfitPositive = totalProfit >= 0;

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="glass-panel rounded-3xl p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="size-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-primary">account_circle</span>
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-black text-white mb-1">Player Profile</h1>
              <p className="text-gray-400 font-mono text-sm">{shortenAddress(publicKey?.toString() || '', 8)}</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center px-6 py-3 bg-white/5 rounded-xl">
                <p className="text-3xl font-black text-white">{stats?.totalBets || 0}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Bets</p>
              </div>
              <div className="text-center px-6 py-3 bg-white/5 rounded-xl">
                <p className={`text-3xl font-black ${isProfitPositive ? 'text-primary' : 'text-danger'}`}>
                  {isProfitPositive ? '+' : ''}{formatSol(totalProfit)}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Net Profit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            icon="emoji_events"
            color={winRate > 50 ? 'text-primary' : 'text-white'}
          />
          <StatCard
            label="Total Wagered"
            value={`${formatSol(stats?.totalWagered || 0)} SOL`}
            icon="payments"
          />
          <StatCard
            label="Total Won"
            value={`${formatSol(stats?.totalWon || 0)} SOL`}
            icon="trending_up"
            color="text-primary"
          />
          <StatCard
            label="Total Lost"
            value={`${formatSol(stats?.totalLost || 0)} SOL`}
            icon="trending_down"
            color="text-danger"
          />
        </div>

        {/* Bet History */}
        <div className="glass-panel rounded-3xl p-6">
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400">history</span>
            Bet History
          </h2>

          {bets && bets.length > 0 ? (
            <div className="space-y-3">
              {bets.map((bet) => (
                <div key={bet.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-lg flex items-center justify-center ${bet.playerWon ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'
                      }`}>
                      <span className="material-symbols-outlined text-sm">
                        {bet.playerWon ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-bold">{bet.game?.name || 'Unknown Game'}</p>
                      <p className="text-gray-500 text-xs">{new Date(bet.placedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${bet.playerWon ? 'text-primary' : 'text-white'}`}>
                      {bet.playerWon ? '+' : ''}{formatSol(bet.payoutAmount || bet.amount)} SOL
                    </p>
                    <p className="text-gray-500 text-xs">{bet.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <span className="material-symbols-outlined text-4xl mb-2">casino</span>
              <p>No bets yet</p>
              <p className="text-sm mt-1">Start playing to see your history!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'text-white' }: {
  label: string;
  value: string;
  icon: string;
  color?: string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-4 text-center">
      <span className="material-symbols-outlined text-2xl text-gray-500 mb-2">{icon}</span>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}