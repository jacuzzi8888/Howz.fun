'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { cn } from '~/lib/utils';
import { useFlipItProgram } from '~/lib/anchor/flip-it-client';
import { useFightClubProgram } from '~/lib/anchor/fight-club-client';
import { useDegenDerbyProgram } from '~/lib/anchor/degen-derby-client';
import { useShadowPokerProgram } from '~/lib/anchor/shadow-poker-client';
import { GameErrorBoundary } from '~/components/error-boundaries';
import { ButtonLoader } from '~/components/loading';

export default function AdminPage() {
  return (
    <GameErrorBoundary>
      <AdminContent />
    </GameErrorBoundary>
  );
}

function AdminContent() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'treasury'>('overview');

  // Check if user is admin (in production, check against authorized wallet list)
  const isAdmin = connected; // Simplified for demo

  if (!connected) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-md">
          <span className="material-symbols-outlined text-6xl text-gray-500 mb-4">admin_panel_settings</span>
          <h2 className="text-2xl font-black text-white mb-2">Admin Access</h2>
          <p className="text-gray-400">Connect admin wallet to access house controls</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-md">
          <span className="material-symbols-outlined text-6xl text-danger mb-4">block</span>
          <h2 className="text-2xl font-black text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">This wallet is not authorized for admin access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">House Admin</h1>
            <p className="text-gray-400 text-sm">Manage games, treasury, and house settings</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <span className="size-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-bold text-primary uppercase">Admin Connected</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'games', label: 'Games', icon: 'sports_esports' },
            { id: 'treasury', label: 'Treasury', icon: 'account_balance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                activeTab === tab.id
                  ? "bg-primary text-black"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'games' && <GamesTab />}
        {activeTab === 'treasury' && <TreasuryTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  const stats = [
    { label: 'Total Volume', value: '12,450 SOL', change: '+23%', positive: true },
    { label: 'House Profit', value: '124.5 SOL', change: '+18%', positive: true },
    { label: 'Active Players', value: '1,234', change: '+45%', positive: true },
    { label: 'Total Bets', value: '45,678', change: '+12%', positive: true },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel rounded-2xl p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className={cn("text-xs font-bold", stat.positive ? "text-primary" : "text-danger")}>
              {stat.change} this week
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-black text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'Race Resolved', game: 'Degen Derby', amount: '450 SOL', time: '2 min ago' },
            { action: 'Hand Completed', game: 'Shadow Poker', amount: '125 SOL', time: '5 min ago' },
            { action: 'Match Resolved', game: 'Fight Club', amount: '890 SOL', time: '12 min ago' },
            { action: 'Flip Resolved', game: 'Flip It', amount: '23 SOL', time: '15 min ago' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{item.action}</p>
                  <p className="text-gray-500 text-xs">{item.game}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-sm">{item.amount}</p>
                <p className="text-gray-500 text-xs">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GamesTab() {
  const games = [
    { name: 'Flip It', status: 'Active', bets: '12,345', volume: '2,450 SOL', fee: '1%' },
    { name: 'Fight Club', status: 'Active', bets: '8,234', volume: '4,120 SOL', fee: '1%' },
    { name: 'Degen Derby', status: 'Active', bets: '5,678', volume: '3,890 SOL', fee: '1%' },
    { name: 'Shadow Poker', status: 'Beta', bets: '1,234', volume: '1,990 SOL', fee: '0.5%' },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-white">Game Management</h3>
        <button className="px-4 py-2 bg-primary hover:bg-primaryHover text-black font-bold rounded-lg transition-colors text-sm">
          Create New Game
        </button>
      </div>

      <div className="space-y-3">
        {games.map((game) => (
          <div key={game.name} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-white">sports_esports</span>
              </div>
              <div>
                <p className="text-white font-bold">{game.name}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={cn(
                    "px-2 py-0.5 rounded font-bold",
                    game.status === 'Active' ? "bg-primary/20 text-primary" : "bg-yellow-500/20 text-yellow-500"
                  )}>
                    {game.status}
                  </span>
                  <span className="text-gray-500">House Fee: {game.fee}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-white font-bold text-sm">{game.bets}</p>
                <p className="text-gray-500 text-xs">Total Bets</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-sm">{game.volume}</p>
                <p className="text-gray-500 text-xs">Volume</p>
              </div>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-gray-400">settings</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TreasuryTab() {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    // In production: call withdraw_treasury from smart contract
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsWithdrawing(false);
    setWithdrawAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Treasury Balance */}
      <div className="glass-panel rounded-2xl p-8 text-center">
        <p className="text-gray-400 text-sm mb-2">House Treasury Balance</p>
        <p className="text-5xl font-black text-primary mb-4">245.8 SOL</p>
        <p className="text-gray-500 text-sm">≈ $24,580 USD</p>
      </div>

      {/* Withdraw */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-black text-white mb-4">Withdraw Funds</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount in SOL"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
            />
          </div>
          <button
            onClick={handleWithdraw}
            disabled={!withdrawAmount || isWithdrawing}
            className={cn(
              "px-6 py-3 rounded-xl font-black transition-all",
              withdrawAmount && !isWithdrawing
                ? "bg-danger hover:bg-danger/80 text-white"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            )}
          >
            {isWithdrawing ? <ButtonLoader text="Withdrawing..." /> : 'Withdraw'}
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">
          Withdrawals require multi-sig approval in production
        </p>
      </div>

      {/* Treasury History */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-black text-white mb-4">Treasury History</h3>
        <div className="space-y-3">
          {[
            { type: 'Fee', amount: '+12.5 SOL', game: 'Flip It', time: '2 hours ago' },
            { type: 'Fee', amount: '+45.2 SOL', game: 'Fight Club', time: '5 hours ago' },
            { type: 'Fee', amount: '+23.8 SOL', game: 'Degen Derby', time: '8 hours ago' },
            { type: 'Withdrawal', amount: '-100 SOL', game: '-', time: '2 days ago' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "size-8 rounded-full flex items-center justify-center",
                  item.type === 'Fee' ? "bg-primary/20" : "bg-danger/20"
                )}>
                  <span className={cn(
                    "material-symbols-outlined text-sm",
                    item.type === 'Fee' ? "text-primary" : "text-danger"
                  )}>
                    {item.type === 'Fee' ? 'add' : 'remove'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{item.type}</p>
                  <p className="text-gray-500 text-xs">{item.game}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-bold",
                  item.type === 'Fee' ? "text-primary" : "text-danger"
                )}>
                  {item.amount}
                </p>
                <p className="text-gray-500 text-xs">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
