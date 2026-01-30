'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '~/lib/utils';
import { useMagicBlock } from '~/lib/magicblock/MagicBlockContext';
import { useGameState } from '~/hooks/useGameState';
import { GameErrorBoundary } from '~/components/error-boundaries';
import { ButtonLoader, TransactionLoader } from '~/components/loading';
import { useFlipItProgram, type BetResult, type RevealResult } from '~/lib/anchor/flip-it-client';
import { useWallet } from '@solana/wallet-adapter-react';

const MIN_BET = 0.001; // 0.001 SOL
const MAX_BET = 100;   // 100 SOL

export const FlipItGame: React.FC = () => {
    return (
        <GameErrorBoundary>
            <FlipItGameContent />
        </GameErrorBoundary>
    );
};

const FlipItGameContent: React.FC = () => {
    const [side, setSide] = useState<'HEADS' | 'TAILS'>('HEADS');
    const [amount, setAmount] = useState<number>(1.5);
    const [betResult, setBetResult] = useState<BetResult | null>(null);
    const [gameResult, setGameResult] = useState<RevealResult | null>(null);
    const [showResult, setShowResult] = useState(false);
    
    const { setIsUsingRollup } = useMagicBlock();
    const { connected } = useWallet();
    const { 
        isLoading, 
        error, 
        txStatus, 
        setTxStatus, 
        reset,
        executeGameAction 
    } = useGameState();
    
    const { isReady, placeBet, reveal } = useFlipItProgram();

    // Reset game state when component mounts
    useEffect(() => {
        setBetResult(null);
        setGameResult(null);
        setShowResult(false);
    }, []);

    const handleFlip = async () => {
        // Validate bet amount
        if (amount < MIN_BET || amount > MAX_BET) {
            return;
        }

        // Validate wallet connection
        if (!connected || !isReady) {
            return;
        }

        setTxStatus('pending');
        setIsUsingRollup(true);
        setShowResult(false);

        try {
            // Step 1: Place bet
            const bet = await executeGameAction(async () => {
                return await placeBet(amount, side);
            });

            if (!bet) {
                throw new Error('Failed to place bet');
            }

            setBetResult(bet);
            setTxStatus('confirming');

            // Step 2: Wait a moment for commitment to be mined
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 3: Reveal and resolve
            const result = await executeGameAction(async () => {
                return await reveal(bet.betPDA, side, bet.nonce);
            });

            if (!result) {
                throw new Error('Failed to reveal bet');
            }

            setGameResult(result);
            setTxStatus('confirmed');
            setShowResult(true);

        } catch (err) {
            setTxStatus('failed');
            console.error('Flip failed:', err);
        } finally {
            setIsUsingRollup(false);
        }
    };

    const handleReset = () => {
        reset();
        setBetResult(null);
        setGameResult(null);
        setShowResult(false);
    };

    const isFlipping = isLoading || txStatus === 'pending' || txStatus === 'confirming';
    const canFlip = connected && isReady && !isFlipping && amount >= MIN_BET && amount <= MAX_BET;

    return (
        <div className="flex flex-1 relative overflow-hidden">
            {/* Game Area (Center) */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-10 relative z-10 overflow-y-auto">
                <div className="w-full max-w-lg flex flex-col items-center gap-8">

                    {/* Wallet Not Connected Warning */}
                    {!connected && (
                        <div className="w-full p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-yellow-500 text-sm">wallet</span>
                                <p className="text-yellow-400 text-sm">Connect your wallet to play</p>
                            </div>
                        </div>
                    )}

                    {/* Transaction Status */}
                    {txStatus !== 'idle' && (
                        <div className="w-full">
                            <TransactionLoader 
                                status={txStatus} 
                                message={txStatus === 'pending' ? 'Waiting for wallet approval...' : undefined}
                            />
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                            <button 
                                onClick={handleReset}
                                className="mt-2 text-xs text-red-400/60 hover:text-red-400 underline"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Game Result Display */}
                    {showResult && gameResult && (
                        <div className={cn(
                            "w-full p-6 rounded-2xl border-2 text-center",
                            gameResult.playerWon 
                                ? "bg-primary/10 border-primary/30" 
                                : "bg-danger/10 border-danger/30"
                        )}>
                            <div className={cn(
                                "size-16 rounded-full flex items-center justify-center mx-auto mb-4",
                                gameResult.playerWon ? "bg-primary/20" : "bg-danger/20"
                            )}>
                                <span className={cn(
                                    "material-symbols-outlined text-3xl",
                                    gameResult.playerWon ? "text-primary" : "text-danger"
                                )}>
                                    {gameResult.playerWon ? 'celebration' : 'sentiment_dissatisfied'}
                                </span>
                            </div>
                            <h3 className={cn(
                                "text-2xl font-black uppercase tracking-tight mb-2",
                                gameResult.playerWon ? "text-primary" : "text-danger"
                            )}>
                                {gameResult.playerWon ? 'You Won!' : 'House Wins'}
                            </h3>
                            <p className="text-white/60 text-sm mb-4">
                                Outcome: <span className="text-white font-bold">{gameResult.outcome}</span>
                            </p>
                            {gameResult.playerWon && (
                                <p className="text-3xl font-black text-primary">
                                    +{gameResult.payout.toFixed(4)} SOL
                                </p>
                            )}
                            <button
                                onClick={handleReset}
                                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors"
                            >
                                Play Again
                            </button>
                        </div>
                    )}

                    {/* 3D Coin Display */}
                    {!showResult && (
                        <div className="relative group cursor-pointer perspective-1000">
                            {/* Glow Effect behind coin */}
                            <div className="absolute inset-0 rounded-full bg-accentGold blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>

                            {/* Coin Graphic */}
                            <div className={cn(
                                "relative size-[200px] rounded-full bg-gradient-to-br from-[#FFD700] via-[#F59E0B] to-[#B45309] shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] flex items-center justify-center border-4 border-[#FCD34D] transform transition-all duration-500",
                                isFlipping ? "animate-spin" : "group-hover:scale-105 group-hover:rotate-y-12"
                            )}>
                                <div className="absolute inset-2 rounded-full border-2 border-[#B45309]/50 border-dashed"></div>
                                <span className="text-8xl font-black text-[#92400E] drop-shadow-[0_2px_2px_rgba(255,255,255,0.4)]">
                                    {side === 'HEADS' ? 'H' : 'T'}
                                </span>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-50"></div>
                            </div>
                        </div>
                    )}

                    {/* Betting Controls Container */}
                    {!showResult && (
                        <div className="w-full glass-panel rounded-3xl p-8 flex flex-col gap-8 shadow-2xl">
                            {/* Heads / Tails Toggle */}
                            <div className="grid grid-cols-2 gap-4 p-1.5 bg-black/40 rounded-2xl">
                                <button
                                    onClick={() => !isFlipping && setSide('HEADS')}
                                    disabled={isFlipping}
                                    className={cn(
                                        "h-14 flex items-center justify-center rounded-xl border-2 transition-all duration-300 font-bold tracking-wider disabled:opacity-50",
                                        side === 'HEADS'
                                            ? "bg-primary border-primary/50 text-black shadow-[0_0_20px_-5px_rgba(7,204,0,0.5)]"
                                            : "border-transparent text-white/50 hover:text-white"
                                    )}
                                >
                                    HEADS
                                </button>
                                <button
                                    onClick={() => !isFlipping && setSide('TAILS')}
                                    disabled={isFlipping}
                                    className={cn(
                                        "h-14 flex items-center justify-center rounded-xl border-2 transition-all duration-300 font-bold tracking-wider disabled:opacity-50",
                                        side === 'TAILS'
                                            ? "bg-danger border-danger/50 text-white shadow-[0_0_20px_-5px_rgba(255,63,51,0.5)]"
                                            : "border-transparent text-white/50 hover:text-white"
                                    )}
                                >
                                    TAILS
                                </button>
                            </div>

                            {/* Bet Amount Input */}
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-400 px-1 tracking-widest uppercase">
                                    <span>Wager Amount</span>
                                    <span>Min: {MIN_BET} SOL | Max: {MAX_BET} SOL</span>
                                </div>
                                <div className="flex items-stretch gap-3">
                                    <button
                                        onClick={() => setAmount(Math.max(MIN_BET, amount - 0.5))}
                                        disabled={isFlipping}
                                        className="size-14 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-2xl font-bold text-gray-400 hover:text-white transition-all disabled:opacity-50"
                                    >-</button>
                                    <div className="flex-1 relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val) && val >= 0) {
                                                    setAmount(Math.min(MAX_BET, Math.max(MIN_BET, val)));
                                                }
                                            }}
                                            min={MIN_BET}
                                            max={MAX_BET}
                                            step={0.1}
                                            disabled={isFlipping}
                                            className="w-full h-14 bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 text-white font-mono text-xl font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-center disabled:opacity-50"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-500 pointer-events-none tracking-tighter">SOL</div>
                                    </div>
                                    <button
                                        onClick={() => setAmount(Math.min(MAX_BET, amount + 0.5))}
                                        disabled={isFlipping}
                                        className="size-14 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-2xl font-bold text-gray-400 hover:text-white transition-all disabled:opacity-50"
                                    >+</button>
                                </div>
                                {amount < MIN_BET && (
                                    <p className="text-red-400 text-xs">Minimum bet is {MIN_BET} SOL</p>
                                )}
                                {amount > MAX_BET && (
                                    <p className="text-red-400 text-xs">Maximum bet is {MAX_BET} SOL</p>
                                )}
                            </div>

                            {/* Action Button */}
                            <button
                                disabled={!canFlip}
                                onClick={handleFlip}
                                className={cn(
                                    "w-full h-16 text-xl font-black tracking-[0.1em] uppercase rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 group shadow-[0_0_30px_rgba(7,204,0,0.3)] disabled:shadow-none",
                                    isFlipping 
                                        ? "bg-gray-700 cursor-not-allowed text-gray-400" 
                                        : canFlip
                                            ? "bg-primary hover:bg-primaryHover text-[#0A0A0F] hover:shadow-[0_0_40px_rgba(7,204,0,0.5)]"
                                            : "bg-gray-700 cursor-not-allowed text-gray-500"
                                )}
                            >
                                {isFlipping ? (
                                    <ButtonLoader text="FLIPPING..." />
                                ) : !connected ? (
                                    <span>CONNECT WALLET</span>
                                ) : (
                                    <>
                                        <span>FLIP NOW</span>
                                        <span className="material-symbols-outlined transition-transform duration-700 group-hover:rotate-180">sync</span>
                                    </>
                                )}
                            </button>

                            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] px-1">
                                <span>Multiplier: <span className="text-white">2.0x</span></span>
                                <span>Win Chance: <span className="text-white">50%</span></span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Background Decorative Glows */}
                <div className="absolute top-1/4 left-1/4 size-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 size-96 bg-danger/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse delay-700"></div>
            </div>

            {/* Sidebar (Recent Flips) */}
            <aside className="w-80 border-l border-white/5 bg-[#0A0A0F]/50 backdrop-blur-xl hidden xl:flex flex-col z-20">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-white tracking-tighter flex items-center gap-2 uppercase text-sm">
                        <span className="material-symbols-outlined text-gray-400 text-lg">history</span>
                        Recent Flips
                    </h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Live</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Mock Recent Items */}
                    {[
                        { id: 1, type: 'win', amount: '+2.00', side: 'HEADS', user: '0x8a...4f2', time: 'Just now' },
                        { id: 2, type: 'loss', amount: '-0.50', side: 'TAILS', user: '0xb2...9c1', time: '4s ago' },
                        { id: 3, type: 'win', amount: '+10.5', side: 'HEADS', user: '0x33...a11', time: '12s ago' },
                    ].map(item => (
                        <div key={item.id} className="glass-panel rounded-xl p-4 flex items-center justify-between group hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "size-10 rounded-lg flex items-center justify-center border",
                                    item.type === 'win' ? "bg-primary/10 text-primary border-primary/20" : "bg-danger/10 text-danger border-danger/20"
                                )}>
                                    <span className="material-symbols-outlined text-sm">
                                        {item.type === 'win' ? 'check_circle' : 'cancel'}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono text-gray-500">{item.user}</span>
                                    <span className="text-[11px] font-black text-white uppercase tracking-tighter">{item.side}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={cn("text-sm font-black tracking-tighter", item.type === 'win' ? "text-primary" : "text-gray-500")}>
                                    {item.amount} SOL
                                </div>
                                <div className="text-[9px] font-bold text-gray-500 uppercase">{item.time}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5">
                    <button className="w-full py-3 rounded-xl border border-white/5 hover:border-white/20 text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest bg-white/5">
                        View All History
                    </button>
                </div>
            </aside>
        </div>
    );
};
