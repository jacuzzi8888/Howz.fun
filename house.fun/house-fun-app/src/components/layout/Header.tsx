'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useMagicBlock } from '~/lib/magicblock/MagicBlockContext';
import { CashierModal } from '~/components/wallet/CashierModal';
import { SessionManager } from '~/lib/magicblock/SessionManager';

export const Header: React.FC = () => {
    const [isCashierOpen, setIsCashierOpen] = useState(false);
    const { publicKey, connected } = useWallet();
    const { isUsingRollup, setIsUsingRollup, isSessionActive, sessionRemainingTime, refreshSession } = useMagicBlock();
    const { connection } = useConnection();
    const [balance, setBalance] = useState<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!publicKey) {
            setBalance(null);
            return;
        }

        const fetchBalance = async () => {
            try {
                const bal = await connection.getBalance(publicKey);
                setBalance(bal / LAMPORTS_PER_SOL);
            } catch (err) {
                console.error("Failed to fetch balance:", err);
            }
        };

        void fetchBalance();
        const id = connection.onAccountChange(publicKey, (info) => {
            setBalance(info.lamports / LAMPORTS_PER_SOL);
        });

        return () => {
            void connection.removeAccountChangeListener(id);
        };
    }, [publicKey, connection]);

    // Auto-start session when connected
    useEffect(() => {
        if (connected && !isSessionActive && isMounted) {
            console.log('[Header] Auto-starting session...');
            SessionManager.createEphemeralKeypair();
            refreshSession();
        }
    }, [connected, isSessionActive, isMounted, refreshSession]);

    const formattedBalance = balance !== null ? balance.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "0.00";

    if (!isMounted) return <div className="h-20 w-full bg-[#0A0A0F]/80 border-b border-white/5" />;

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Left Section: Logo + Navigation */}
                        <div className="flex items-center gap-6">
                            <Link href="/" className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
                                <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 group-hover:border-primary/50 transition-colors">
                                    <span className="material-symbols-outlined text-primary text-2xl">house</span>
                                </div>
                                <span className="text-2xl font-black tracking-tighter text-white group-hover:text-glow transition-all">house.fun</span>
                            </Link>

                            {/* Navigation */}
                            <nav className="hidden md:flex items-center gap-4">
                                <Link href="/profile" className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">account_circle</span>
                                    Profile
                                </Link>
                                <Link href="/leaderboard" className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">emoji_events</span>
                                    Leaderboard
                                </Link>
                            </nav>
                        </div>

                        {/* Center: Network Status */}
                        <div className="hidden lg:flex items-center gap-6">
                            <button
                                onClick={() => setIsUsingRollup(!isUsingRollup)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-pointer"
                            >
                                <span className={`size-1.5 rounded-full ${isUsingRollup
                                    ? 'bg-primary animate-pulse shadow-[0_0_8px_rgba(7,204,0,0.8)]'
                                    : (process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' ? 'bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]')
                                    }`}></span>
                                <span className="text-xs font-bold text-white/70 uppercase tracking-widest group-hover:text-white transition-colors">
                                    {isUsingRollup ? 'Ephemeral Rollup Active' : `Solana L1 ${process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}`}
                                </span>
                            </button>
                            {isUsingRollup && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                                    <span className="material-symbols-outlined text-[14px] text-primary">speed</span>
                                    <span className="text-xs font-black text-primary uppercase tracking-tighter">0-Latency Mode</span>
                                </div>
                            )}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            {connected && (
                                <>
                                    {/* Session Key Status */}
                                    <div className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-2">
                                            <span className={`size-1.5 rounded-full ${isSessionActive ? 'bg-primary animate-pulse shadow-[0_0_5px_#BBFF00]' : 'bg-gray-500'}`}></span>
                                            <span className="text-xs font-black text-white/40 uppercase tracking-widest">
                                                {isSessionActive ? 'Session Active' : 'Initializing...'}
                                            </span>
                                        </div>
                                        {isSessionActive && (
                                            <span className="text-xs font-mono font-bold text-primary">{sessionRemainingTime} left</span>
                                        )}
                                    </div>

                                    <div
                                        onClick={() => setIsCashierOpen(true)}
                                        className="flex flex-col items-end mr-4 cursor-pointer group"
                                    >
                                        <span className="text-xs text-gray-400 font-bold tracking-[0.2em] group-hover:text-primary transition-colors">BALANCE</span>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-lg text-white group-hover:text-glow transition-all">{formattedBalance}</span>
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">SOL</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="custom-wallet-button">
                                <WalletMultiButton />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <CashierModal isOpen={isCashierOpen} onClose={() => setIsCashierOpen(false)} />
        </>
    );
};
