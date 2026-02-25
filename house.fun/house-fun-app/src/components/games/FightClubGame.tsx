'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '~/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameState } from '~/hooks/useGameState';
import { GameErrorBoundary } from '~/components/error-boundaries';
import { ButtonLoader, TransactionLoader } from '~/components/loading';
import { useFightClubProgram } from '~/lib/anchor/fight-club-client';

import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { type FightMatchAccount } from '~/lib/anchor/fight-club-client';
import { getMatchPDA } from '~/lib/anchor/fight-club-utils';

// Pyth Feed IDs for mock/hackathon use
const PYTH_FEEDS = {
    'BONK': '0x72a59c19d4d9d473a21ca701655099309062325ba0126a10df768e7af558bb94',
    'WIF': '0xa2e8316dfc6e3b56345d1796120c15904bc04ed8e31780006733c393798cf85d',
};

const MIN_BET = 0.001;
const MAX_BET = 100;

export const FightClubGame: React.FC = () => {
    return (
        <GameErrorBoundary>
            <FightClubGameContent />
        </GameErrorBoundary>
    );
};

const FightClubGameContent: React.FC = () => {
    const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(null);
    const [wager, setWager] = useState(1.5);
    const [currentMatch, setCurrentMatch] = useState<FightMatchAccount | null>(null);
    const [userBet, setUserBet] = useState<{ side: 'A' | 'B'; amount: number } | null>(null);
    const [houseExists, setHouseExists] = useState<boolean | null>(null);
    const [isInitializingHouse, setIsInitializingHouse] = useState(false);

    // Live price tracking (simulated for HUD, in prod comes from Pyth Pull)
    const [livePerfA, setLivePerfA] = useState(0);
    const [livePerfB, setLivePerfB] = useState(0);

    const { connected } = useWallet();
    const {
        isLoading,
        error,
        txStatus,
        setTxStatus,
        reset,
        executeGameAction
    } = useGameState();

    const {
        isReady,
        placeBet,
        claimWinnings,
        fetchMatch,
        fetchHouse,
        initializeHouse,
        calculatePotentialWinnings
    } = useFightClubProgram();

    // Fetch match from chain
    const fetchCurrentMatch = useCallback(async () => {
        if (!isReady || !fetchHouse || !fetchMatch) return;

        try {
            const house = await fetchHouse();
            if (house && house.totalMatches > 0) {
                const lastIndex = house.totalMatches - 1;
                const [matchPDA] = getMatchPDA(lastIndex);
                const match = await fetchMatch(matchPDA);
                if (match) {
                    setCurrentMatch(match);
                }
            } else {
                // Mock Fallback for Hackathon UI if no matches exist on-chain
                setCurrentMatch({
                    index: 0,
                    tokenA: 'PEPE',
                    tokenB: 'DOGE',
                    totalBetA: 15 * LAMPORTS_PER_SOL,
                    totalBetB: 12 * LAMPORTS_PER_SOL,
                    playerCountA: 5,
                    playerCountB: 3,
                    status: 'Open',
                    winner: null,
                    startTime: BigInt(Date.now() / 1000),
                    endTime: BigInt(Date.now() / 1000 + 3600),
                    pda: new PublicKey("11111111111111111111111111111111")
                });
            }
        } catch (err) {
            console.error('Failed to fetch match:', err);
        }
    }, [isReady, fetchHouse, fetchMatch]);

    useEffect(() => {
        fetchCurrentMatch();

        // Polling for updates (can be replaced by websocket later)
        const interval = setInterval(fetchCurrentMatch, 5000);
        return () => clearInterval(interval);
    }, [fetchCurrentMatch]);

    // Simulate live price updates (HUD only)
    useEffect(() => {
        const interval = setInterval(() => {
            setLivePerfA(prev => prev + (Math.random() - 0.49) * 0.1);
            setLivePerfB(prev => prev + (Math.random() - 0.50) * 0.1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Check if house exists
    useEffect(() => {
        const checkHouse = async () => {
            if (!isReady || !fetchHouse) return;
            const house = await fetchHouse();
            setHouseExists(!!house);
        };
        checkHouse();
    }, [isReady]); // Removed fetchHouse to prevent infinite render loops

    const handleInitializeHouse = async () => {
        if (!initializeHouse) return;

        setIsInitializingHouse(true);
        setTxStatus('pending');

        try {
            const tx = await initializeHouse();
            console.log('House initialized:', tx);
            setHouseExists(true);
            setTxStatus('confirmed');
        } catch (err) {
            console.error('Failed to initialize house:', err);
            setTxStatus('failed');
        } finally {
            setIsInitializingHouse(false);
        }
    };

    // Auto-initialize house if it doesn't exist
    useEffect(() => {
        if (connected && isReady && houseExists === false && !isInitializingHouse && txStatus === 'idle') {
            handleInitializeHouse();
        }
    }, [connected, isReady, houseExists, isInitializingHouse, txStatus]);

    const handlePlaceBet = async () => {
        if (!selectedSide || !connected || !isReady || !currentMatch) return;
        if (wager < MIN_BET || wager > MAX_BET) return;

        setTxStatus('pending');

        try {
            // Retrieve PDAs
            const [matchPDA] = getMatchPDA(currentMatch.index);

            await executeGameAction(async () => {
                // In production:
                // const result = await placeBet(matchPDA, currentMatch.index, wager, selectedSide);

                // Mocking for Hackathon UI since Match 0 is never created on-chain
                await new Promise(resolve => setTimeout(resolve, 2000));

                setUserBet({
                    side: selectedSide,
                    amount: wager
                });

                return { success: true };
            }, {
                onSuccess: () => {
                    setTxStatus('confirmed');
                    console.log('Bet placed successfully!');
                },
                onError: (err) => {
                    setTxStatus('failed');
                    console.error('Bet failed:', err);
                }
            });
        } catch (err) {
            setTxStatus('failed');
        }
    };

    const handleResolve = async () => {
        if (!connected || !isReady || !currentMatch) return;

        setTxStatus('pending');
        try {
            const [matchPDA] = getMatchPDA(currentMatch.index);
            // In a real app, these are fetched from the registry or known Pyth addresses
            // Using placeholder Pyth accounts for hackathon build
            const priceUpdateA = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLSRTSndpeCPy");
            const priceUpdateB = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLSRTSndpeCPy");

            await executeGameAction(async () => {
                // In production:
                // return await resolveWithPyth(matchPDA, priceUpdateA, priceUpdateB);

                // Mocking for Hackathon UI
                await new Promise(resolve => setTimeout(resolve, 3000));
                return { success: true, matchPDA, winner: 'A' as const };
            }, {
                onSuccess: (result) => {
                    setTxStatus('confirmed');
                    console.log('Match resolved via Pyth:', result);
                }
            });
        } catch (err) {
            setTxStatus('failed');
        }
    };

    const handleClaim = async () => {
        if (!userBet || !connected || !isReady) return;

        setTxStatus('pending');

        try {
            await executeGameAction(async () => {
                // In production: await claimWinnings(matchPDA);
                await new Promise(resolve => setTimeout(resolve, 1500));
                return { success: true };
            }, {
                onSuccess: () => {
                    setTxStatus('confirmed');
                    setUserBet(null);
                    setSelectedSide(null);
                },
                onError: () => {
                    setTxStatus('failed');
                }
            });
        } catch (err) {
            setTxStatus('failed');
        }
    };

    const isBetting = isLoading || txStatus === 'pending' || txStatus === 'confirming';
    const canBet = connected && isReady && !isBetting && selectedSide && wager >= MIN_BET && wager <= MAX_BET && !userBet;

    // Calculate odds dynamically based on pool
    const getOdds = (side: 'A' | 'B') => {
        if (!currentMatch) return 2.0;
        const totalPool = currentMatch.totalBetA + currentMatch.totalBetB;
        const sidePool = side === 'A' ? currentMatch.totalBetB : currentMatch.totalBetA;
        if (sidePool === 0) return 2.0;
        return (totalPool / (side === 'A' ? currentMatch.totalBetA : currentMatch.totalBetB)) * 0.99; // 1% house fee
    };

    const potentialWinnings = selectedSide ? wager * getOdds(selectedSide) : 0;

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative z-10 w-full max-w-[1400px] mx-auto">
            {/* Ambient Background Lighting */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF3F33] opacity-[0.08] blur-[150px] pointer-events-none z-0"></div>
            <div className="fixed top-[10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-[#08CB00] opacity-[0.06] blur-[150px] pointer-events-none z-0"></div>

            {/* Wallet Not Connected */}
            {!connected && (
                <div className="w-full max-w-[960px] mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-500 text-sm">wallet</span>
                        <p className="text-yellow-400 text-sm">Connect your wallet to place bets</p>
                    </div>
                </div>
            )}

            {/* Transaction Status */}
            {txStatus !== 'idle' && (
                <div className="w-full max-w-[960px] mb-6">
                    <TransactionLoader
                        status={txStatus}
                        message={txStatus === 'pending' ? 'Confirm in wallet...' : undefined}
                    />
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="w-full max-w-[960px] mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                    <button
                        onClick={reset}
                        className="mt-2 text-xs text-red-400/60 hover:text-red-400 underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* User Bet Status */}
            {userBet && currentMatch?.status === 'Resolved' && (
                <div className="w-full max-w-[960px] mb-6 p-6 bg-primary/10 border border-primary/30 rounded-2xl text-center">
                    <h3 className="text-xl font-black text-white mb-2">Match Resolved!</h3>
                    <p className="text-white/60 mb-4">
                        You bet {userBet.amount.toFixed(2)} SOL on {userBet.side === 'A' ? currentMatch.tokenA : currentMatch.tokenB}
                    </p>
                    <button
                        onClick={handleClaim}
                        disabled={isBetting}
                        className="px-8 py-3 bg-primary hover:bg-primaryHover text-black font-black rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isBetting ? <ButtonLoader text="Claiming..." /> : 'Claim Winnings'}
                    </button>
                </div>
            )}

            {/* Page Heading */}
            <div className="w-full max-w-[960px] flex flex-col md:flex-row justify-between items-center gap-4 mb-8 md:mb-12">
                <div className="flex flex-col gap-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-accentGold mb-1">
                        <span className="material-symbols-outlined text-sm">stars</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Memecoin Battle Arena</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-[-0.04em] italic uppercase">
                        {currentMatch ? (
                            <>
                                <span className="text-danger">{currentMatch.tokenA}</span>
                                <span className="text-white/20 px-2 not-italic font-sans">vs</span>
                                <span className="text-primary">{currentMatch.tokenB}</span>
                            </>
                        ) : (
                            'Loading...'
                        )}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                        <span className="material-symbols-outlined text-gray-400 text-sm">info</span>
                        <span className="text-gray-300 text-[10px] font-bold uppercase tracking-wider">
                            Status: {currentMatch?.status || 'Loading'}
                        </span>
                    </div>
                    {currentMatch?.status === 'Open' && houseExists && (
                        <button
                            onClick={handleResolve}
                            disabled={isBetting}
                            className="bg-accentGold/10 hover:bg-accentGold/20 border border-accentGold/30 text-accentGold text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all"
                        >
                            {isBetting ? 'Processing...' : 'Resolve (Admin/Debug)'}
                        </button>
                    )}
                </div>
            </div>

            {/* Fight Card Layout */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-12 items-center mb-10">

                {/* RED CORNER (Token A) */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-b from-danger to-transparent rounded-2xl opacity-30 blur-md group-hover:opacity-60 transition duration-500"></div>
                    <div className="glass-panel bg-gradient-to-b from-danger/5 to-black/60 rounded-2xl p-8 border-t-2 border-t-danger relative flex flex-col items-center text-center h-full">
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/40 border border-danger/30 px-2.5 py-1 rounded-md">
                            <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
                            <span className="text-[10px] font-bold text-danger uppercase tracking-widest">Token A</span>
                        </div>
                        <div className="relative mb-6 mt-4">
                            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-danger to-black/50 shadow-[0_0_30px_rgba(255,63,51,0.2)]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                                    <span className="text-4xl font-black text-danger">{currentMatch?.tokenA?.[0] || '?'}</span>
                                </div>
                            </div>
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tighter mb-1 text-white group-hover:text-danger transition-colors uppercase">
                            {currentMatch?.tokenA || 'Loading'}
                        </h2>
                        <div className="flex flex-col items-center gap-1 mb-8">
                            <span className="text-2xl font-black text-white/90 tracking-tighter">
                                {(currentMatch?.totalBetA || 0) / LAMPORTS_PER_SOL} SOL
                            </span>
                            <div className="flex items-center gap-1 text-danger bg-danger/10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                                <span className="material-symbols-outlined text-xs">group</span>
                                <span>{currentMatch?.playerCountA || 0} bettors</span>
                            </div>
                        </div>
                        {/* Price Performance */}
                        <div className="w-full mt-4 p-3 bg-black/40 rounded-xl border border-danger/20 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Growth</span>
                            <span className={cn(
                                "text-lg font-mono font-black",
                                livePerfA >= 0 ? "text-primary" : "text-danger"
                            )}>
                                {livePerfA >= 0 ? '+' : ''}{livePerfA.toFixed(2)}%
                            </span>
                        </div>

                        {/* Odds */}
                        <div className="w-full mt-6 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                <span>Crowd Odds</span>
                                <span className="text-white">{getOdds('A').toFixed(2)}x</span>
                            </div>
                            <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                                <div className="h-full bg-gradient-to-r from-danger/60 to-danger shadow-[0_0_15px_rgba(255,63,51,0.4)] relative"
                                    style={{ width: `${(currentMatch?.totalBetA || 0) / ((currentMatch?.totalBetA || 0) + (currentMatch?.totalBetB || 1)) * 100}%` }}>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VS CENTER */}
                <div className="flex flex-col items-center justify-center gap-8 py-4 relative z-20">
                    <div className="relative">
                        <h2 className="text-7xl md:text-9xl font-black italic text-white vs-glow-text leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(180,229,13,0.3)]">VS</h2>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-accentGold opacity-20 blur-[60px] -z-10 animate-pulse"></div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-accentGold font-bold tracking-[0.3em] text-[10px] uppercase">Total Pool</span>
                        <div className="text-4xl font-mono font-bold text-white tabular-nums bg-black/60 border border-white/10 px-6 py-3 rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                            {((currentMatch?.totalBetA || 0) + (currentMatch?.totalBetB || 0)) / LAMPORTS_PER_SOL} SOL
                        </div>
                    </div>
                    {userBet && (
                        <div className="flex flex-col items-center p-4 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-gray-500 text-[9px] uppercase font-bold tracking-[0.3em] mb-1">Your Bet</span>
                            <span className="text-white font-black text-xl">{userBet.amount.toFixed(2)} SOL</span>
                            <span className="text-primary text-sm">on {userBet.side === 'A' ? currentMatch?.tokenA : currentMatch?.tokenB}</span>
                        </div>
                    )}
                </div>

                {/* GREEN CORNER (Token B) */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-b from-primary to-transparent rounded-2xl opacity-30 blur-md group-hover:opacity-60 transition duration-500"></div>
                    <div className="glass-panel bg-gradient-to-b from-primary/5 to-black/60 rounded-2xl p-8 border-t-2 border-t-primary relative flex flex-col items-center text-center h-full">
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 border border-primary/30 px-2.5 py-1 rounded-md">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Token B</span>
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        </div>
                        <div className="relative mb-6 mt-4">
                            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-primary to-black/50 shadow-[0_0_30px_rgba(7,204,0,0.2)]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                                    <span className="text-4xl font-black text-primary">{currentMatch?.tokenB?.[0] || '?'}</span>
                                </div>
                            </div>
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tighter mb-1 text-white group-hover:text-primary transition-colors uppercase">
                            {currentMatch?.tokenB || 'Loading'}
                        </h2>
                        <div className="flex flex-col items-center gap-1 mb-8">
                            <span className="text-2xl font-black text-white/90 tracking-tighter">
                                {(currentMatch?.totalBetB || 0) / LAMPORTS_PER_SOL} SOL
                            </span>
                            <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                                <span className="material-symbols-outlined text-xs">group</span>
                                <span>{currentMatch?.playerCountB || 0} bettors</span>
                            </div>
                        </div>
                        {/* Price Performance */}
                        <div className="w-full mt-4 p-3 bg-black/40 rounded-xl border border-primary/20 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Growth</span>
                            <span className={cn(
                                "text-lg font-mono font-black",
                                livePerfB >= 0 ? "text-primary" : "text-danger"
                            )}>
                                {livePerfB >= 0 ? '+' : ''}{livePerfB.toFixed(2)}%
                            </span>
                        </div>

                        {/* Odds */}
                        <div className="w-full mt-6 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                <span>Crowd Odds</span>
                                <span className="text-white">{getOdds('B').toFixed(2)}x</span>
                            </div>
                            <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                                <div className="h-full bg-gradient-to-r from-primary/60 to-primary shadow-[0_0_15px_rgba(7,204,0,0.4)] relative"
                                    style={{ width: `${(currentMatch?.totalBetB || 0) / ((currentMatch?.totalBetA || 0) + (currentMatch?.totalBetB || 1)) * 100}%` }}>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Betting Console (Bottom) */}
            {!userBet && currentMatch?.status === 'Open' && (
                <div className="w-full max-w-[960px] glass-panel rounded-3xl p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <div className="flex flex-col gap-8">
                        {/* Betting Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Bet Token A */}
                            <button
                                onClick={() => !isBetting && setSelectedSide('A')}
                                disabled={isBetting}
                                className={cn(
                                    "relative overflow-hidden rounded-2xl p-6 flex items-center justify-between group transition-all duration-300 border-2 active:scale-[0.98] disabled:opacity-50",
                                    selectedSide === 'A'
                                        ? "bg-danger/20 border-danger shadow-[0_0_30px_rgba(255,63,51,0.2)]"
                                        : "bg-danger/5 border-transparent hover:bg-danger/10 text-white/80"
                                )}>
                                <div className="flex flex-col items-start gap-1 z-10">
                                    <span className="text-gray-500 text-[9px] font-black uppercase tracking-[0.3em]">Bet on {currentMatch?.tokenA}</span>
                                    <span className={cn(
                                        "font-black text-3xl tracking-tighter italic transition-transform group-hover:scale-105",
                                        selectedSide === 'A' ? "text-danger" : "text-white/40"
                                    )}>BET {currentMatch?.tokenA}</span>
                                </div>
                                <div className="flex flex-col items-end z-10">
                                    <span className={cn(
                                        "text-sm font-black px-4 py-1.5 rounded-lg shadow-xl",
                                        selectedSide === 'A' ? "bg-danger text-white shadow-danger/40" : "bg-neutral-800 text-gray-400"
                                    )}>{getOdds('A').toFixed(2)}x</span>
                                    <span className="text-[9px] text-gray-500 mt-2 font-black uppercase tracking-widest italic opacity-60">
                                        Potential: {potentialWinnings.toFixed(2)} SOL
                                    </span>
                                </div>
                            </button>

                            {/* Bet Token B */}
                            <button
                                onClick={() => !isBetting && setSelectedSide('B')}
                                disabled={isBetting}
                                className={cn(
                                    "relative overflow-hidden rounded-2xl p-6 flex items-center justify-between group transition-all duration-300 border-2 active:scale-[0.98] disabled:opacity-50",
                                    selectedSide === 'B'
                                        ? "bg-primary/20 border-primary shadow-[0_0_30px_rgba(7,204,0,0.2)]"
                                        : "bg-primary/5 border-transparent hover:bg-primary/10 text-white/80"
                                )}>
                                <div className="flex flex-col items-start gap-1 z-10">
                                    <span className="text-gray-500 text-[9px] font-black uppercase tracking-[0.3em]">Bet on {currentMatch?.tokenB}</span>
                                    <span className={cn(
                                        "font-black text-3xl tracking-tighter italic transition-transform group-hover:scale-105",
                                        selectedSide === 'B' ? "text-primary" : "text-white/40"
                                    )}>BET {currentMatch?.tokenB}</span>
                                </div>
                                <div className="flex flex-col items-end z-10">
                                    <span className={cn(
                                        "text-sm font-black px-4 py-1.5 rounded-lg shadow-xl",
                                        selectedSide === 'B' ? "bg-primary text-black shadow-primary/40" : "bg-neutral-800 text-gray-400"
                                    )}>{getOdds('B').toFixed(2)}x</span>
                                    <span className="text-[9px] text-gray-500 mt-2 font-black uppercase tracking-widest italic opacity-60">
                                        Potential: {potentialWinnings.toFixed(2)} SOL
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Input & Action */}
                        <div className="flex flex-col lg:flex-row gap-8 items-center pt-8 border-t border-white/5">
                            <div className="flex-1 w-full space-y-6">
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Bet Amount</label>
                                    <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-1.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                                        <input
                                            type="number"
                                            value={wager}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) {
                                                    setWager(Math.min(MAX_BET, Math.max(MIN_BET, val)));
                                                }
                                            }}
                                            min={MIN_BET}
                                            max={MAX_BET}
                                            step={0.1}
                                            disabled={isBetting}
                                            className="bg-transparent text-white font-mono font-bold text-lg w-24 text-right outline-none disabled:opacity-50"
                                        />
                                        <span className="text-[10px] text-gray-500 font-bold tracking-widest">SOL</span>
                                    </div>
                                </div>
                                <div className="relative group/slider">
                                    <input
                                        type="range"
                                        min={MIN_BET}
                                        max={MAX_BET}
                                        step="0.1"
                                        value={wager}
                                        onChange={(e) => setWager(parseFloat(e.target.value))}
                                        disabled={isBetting}
                                        className="w-full h-2 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-primary group-hover/slider:accent-primaryHover transition-all disabled:opacity-50"
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] text-gray-600 font-mono font-black uppercase tracking-[0.3em]">
                                    <span>{MIN_BET} SOL</span>
                                    <span>{MAX_BET / 2} SOL</span>
                                    <span>{MAX_BET} SOL</span>
                                </div>
                                {wager < MIN_BET && (
                                    <p className="text-red-400 text-xs">Minimum bet is {MIN_BET} SOL</p>
                                )}
                                {wager > MAX_BET && (
                                    <p className="text-red-400 text-xs">Maximum bet is {MAX_BET} SOL</p>
                                )}
                            </div>
                            <div className="w-full lg:w-auto flex flex-col gap-3 min-w-[280px]">
                                <button
                                    onClick={handlePlaceBet}
                                    disabled={!canBet}
                                    className={cn(
                                        "h-16 rounded-2xl shadow-xl transition-all transform active:translate-y-0.5 flex items-center justify-center gap-3 group border-b-4 disabled:shadow-none",
                                        canBet
                                            ? "bg-primary border-[#058a00] hover:bg-primaryHover text-[#0A0A0F] shadow-[0_10px_30px_rgba(7,204,0,0.4)]"
                                            : "bg-neutral-800 border-neutral-900 text-gray-500 cursor-not-allowed opacity-50"
                                    )}>
                                    {isBetting ? (
                                        <ButtonLoader text="Placing Bet..." />
                                    ) : (
                                        <>
                                            <span className="text-lg font-black tracking-widest uppercase">PLACE BET</span>
                                            <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                                <div className="text-center">
                                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest italic opacity-60">
                                        {selectedSide ? `Win ${potentialWinnings.toFixed(2)} SOL` : 'Select a side to bet'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
