'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '~/lib/utils';
import { useMagicBlock } from '~/lib/magicblock/MagicBlockContext';
import { useGameState } from '~/hooks/useGameState';
import { GameErrorBoundary } from '~/components/error-boundaries';
import { ButtonLoader, TransactionLoader } from '~/components/loading';
import { useFlipItProgram, type BetResult, type RevealResult } from '~/lib/anchor/flip-it-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRecentBets, useRecordBet, useResolveBet } from '~/hooks/useGameData';
import { useWalletBalance, formatBalance } from '~/hooks/useWalletBalance';
import { shortenAddress } from '~/lib/utils';
import { useGameSounds } from '~/hooks/useGameSounds';
import Link from 'next/link';

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
    const [useArciumMode, setUseArciumMode] = useState(false); // Arcium integration pending

    const { isUsingRollup, setIsUsingRollup, sessionKey, isSessionActive } = useMagicBlock();
    const { connected, publicKey } = useWallet();
    const {
        isLoading,
        error,
        setError,
        txStatus,
        setTxStatus,
        reset,
        executeGameAction
    } = useGameState();

    const { program, isReady, placeBet, requestFlip, reveal, initializeHouse, fetchHouse, fetchBet } = useFlipItProgram(sessionKey);
    const { play, isMuted, toggleMute } = useGameSounds();
    const [houseExists, setHouseExists] = useState<boolean | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [playTimeMinutes, setPlayTimeMinutes] = useState(0);

    // Session timer for responsible gambling
    useEffect(() => {
        const timer = setInterval(() => {
            setPlayTimeMinutes(prev => prev + 1);
        }, 60000);
        return () => clearInterval(timer);
    }, []);
    const [houseData, setHouseData] = useState<any>(null);
    const [isInitializingHouse, setIsInitializingHouse] = useState(false);

    // Arcium integration status
    const isArciumReady = true; // Arcium deployed successfully!

    // Fetch real recent bets from database
    const { data: recentBets, isLoading: isLoadingBets } = useRecentBets('FLIP_IT', 10);

    // Mutations for recording bets
    const recordBet = useRecordBet();
    const resolveBet = useResolveBet();

    // Wallet balance for real-time SOL display
    const { balance: walletBalance, isLoading: balanceLoading, refetch: refetchBalance } = useWalletBalance();

    // Reset game state when component mounts
    useEffect(() => {
        setBetResult(null);
        setGameResult(null);
        setShowResult(false);
    }, []);

    // Check if house exists
    useEffect(() => {
        if (isReady) {
            console.log('[FlipIt] Checking house account status...');
            setHouseExists(null); // Reset to loading when program becomes ready

            fetchHouse().then(house => {
                console.log('[FlipIt] House status:', !!house);
                setHouseExists(!!house);
                setHouseData(house);
            }).catch((err) => {
                console.error('[FlipIt] Fetch house failed:', err);
                setHouseExists(false);
            });
        }
    }, [isReady]);

    // Auto-initialize house if it doesn't exist and wallet is connected
    useEffect(() => {
        if (connected && isReady && houseExists === false && !isInitializingHouse && txStatus === 'idle') {
            console.log('[FlipIt] Auto-initializing house account...');
            handleInitializeHouse();
        }
    }, [connected, isReady, houseExists, isInitializingHouse, txStatus]);


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

    const handleFlip = async () => {
        // Validate bet amount
        if (amount < MIN_BET || amount > MAX_BET) {
            return;
        }

        // Validate wallet connection
        if (!connected || !isReady || !publicKey) {
            return;
        }

        setTxStatus('pending');
        // Only use rollup if session is genuinely active (not just key present)
        const usingRollup = isSessionActive && !!sessionKey;
        setIsUsingRollup(usingRollup);
        setShowResult(false);
        play('flip');

        try {
            console.log('[FlipIt] Starting flip sequence...', { amount, side, usingRollup });
            const betIndex = houseData?.totalBets;

            // Step 1: Place bet on-chain
            const bet = await executeGameAction(async () => {
                const result = await placeBet(amount, side, betIndex);
                console.log('[FlipIt] Place bet result:', result);
                return result;
            });

            if (!bet) {
                throw new Error('Failed to place bet');
            }

            setBetResult(bet);
            setTxStatus('confirming');

            // Step 2: Record bet in database
            try {
                await recordBet.mutateAsync({
                    gameType: 'FLIP_IT',
                    betPda: bet.betPDA.toString(),
                    transactionSignature: bet.signature,
                    amount: amount * 1_000_000_000, // Convert to lamports
                    playerChoice: side === 'HEADS' ? 0 : 1,
                    commitmentHash: Buffer.from(bet.commitment).toString('hex'),
                });
            } catch (dbError) {
                console.error('Failed to record bet in database:', dbError);
            }

            // Step 3: Wait for Resolution via Websocket (Resilient)
            setTxStatus('confirming');

            const resolvedAccount = await new Promise<any>((resolve, reject) => {
                const { activeConnection } = useMagicBlock.getState?.() || (window as any).magicBlockState || {};
                const connection = activeConnection || (program as any).provider.connection;

                console.log('[FlipIt] Subscribing to bet resolution...', bet.betPDA.toString());

                const subId = connection.onAccountChange(
                    bet.betPDA,
                    (accountInfo: any) => {
                        try {
                            const accountGate = (program?.account as any).bet || (program?.account as any).Bet;
                            const decoded = accountGate.coder.accounts.decode('Bet', accountInfo.data);
                            console.log('[FlipIt] Account change detected:', decoded.status);

                            if (Object.keys(decoded.status)[0] === 'Resolved') {
                                connection.removeAccountChangeListener(subId);
                                resolve({
                                    ...decoded,
                                    status: 'Resolved',
                                    playerWins: decoded.playerWins,
                                    payout: decoded.payout.toNumber() / 1_000_000_000
                                });
                            }
                        } catch (err) {
                            console.error('[FlipIt] Decode failed during websocket update:', err);
                        }
                    },
                    'confirmed'
                );

                // Fallback polling (much slower) in case websocket fails
                const interval = setInterval(async () => {
                    const fetched: any = await fetchBet(bet.betPDA);
                    if (fetched && fetched.status === 'Resolved') {
                        connection.removeAccountChangeListener(subId);
                        clearInterval(interval);
                        resolve(fetched);
                    }
                }, 10000);

                // Timeout after 30s
                setTimeout(() => {
                    connection.removeAccountChangeListener(subId);
                    clearInterval(interval);
                    reject(new Error('Timeout waiting for flip resolution.'));
                }, 30000);
            });

            if (!resolvedAccount) {
                throw new Error('Failed to resolve bet.');
            }

            const result: RevealResult = {
                signature: bet.signature, // Use original sig or find resolution sig
                outcome: resolvedAccount.playerWins ? side : (side === 'HEADS' ? 'TAILS' : 'HEADS'),
                playerWon: resolvedAccount.playerWins || false,
                payout: resolvedAccount.payout,
            };

            // Step 5: Update bet in database with result
            try {
                await resolveBet.mutateAsync({
                    betPda: bet.betPDA.toString(),
                    outcome: result.outcome,
                    playerWon: result.playerWon,
                    payoutAmount: result.playerWon ? result.payout * 1_000_000_000 : 0,
                    houseFee: amount * 1_000_000_000 * 0.01,
                });
            } catch (dbError) {
                console.error('Failed to update bet in database:', dbError);
            }

            setGameResult(result);
            setTxStatus('confirmed');
            setShowResult(true);
            play(result.playerWon ? 'win' : 'loss');

            // Step 6: Force refresh balance
            setTimeout(() => refetchBalance(), 1000);
            setTimeout(() => refetchBalance(), 3000); // Second refresh for confirmation

        } catch (err: any) {
            setTxStatus('failed');
            console.error('[FlipIt] Flip failed:', err);
            setError(err.message || 'Transaction failed. Check console for details.');
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
    const canFlip = connected && isReady && houseExists && !isFlipping && amount >= MIN_BET && amount <= MAX_BET;

    // Keyboard shortcuts: Space/Enter to flip, H/T for side, R to reset, M to mute
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'enter':
                    e.preventDefault();
                    if (canFlip) handleFlip();
                    break;
                case 'h':
                    setSide('HEADS');
                    play('click');
                    break;
                case 't':
                    setSide('TAILS');
                    play('click');
                    break;
                case 'r':
                    handleReset();
                    break;
                case 'm':
                    toggleMute();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canFlip, play, toggleMute]);

    // Debug why button is disabled
    const getDisabledReason = () => {
        if (!connected) return 'Connect wallet to play';
        if (!isReady) return 'Wallet not ready - check provider';
        if (houseExists === null) return 'Checking house account status...';
        if (houseExists === false) return 'Game house needs initialization';
        if (isFlipping) return 'Transaction in progress...';
        if (amount < MIN_BET) return `Minimum bet is ${MIN_BET} SOL`;
        if (amount > MAX_BET) return `Maximum bet is ${MAX_BET} SOL`;
        return null;
    };
    const disabledReason = getDisabledReason();

    // Log why button is disabled when it changes
    useEffect(() => {
        if (disabledReason && connected) {
            console.log('[FlipIt] Button disabled:', disabledReason);
        }
    }, [disabledReason, connected]);

    return (
        <div className="flex flex-1 relative overflow-y-auto overflow-x-hidden">
            {/* Game Area (Center) */}
            <div className="flex-1 flex flex-col items-center justify-start py-4 px-3 sm:px-4 lg:px-6 lg:justify-center relative z-10 min-w-0 min-h-[500px]">
                <div className="w-full max-w-lg flex flex-col items-center gap-4 bg-black/5 rounded-3xl p-2 sm:p-4">

                    {/* Wallet Not Connected Warning */}
                    {!connected && (
                        <div className="w-full p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-yellow-500 text-sm">wallet</span>
                                <p className="text-yellow-400 text-sm">Connect your wallet to play</p>
                            </div>
                        </div>
                    )}

                    {/* Loading State Fallback (Full Page) */}
                    {(connected && (isReady === false || houseExists === null)) && (
                        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0A0F] gap-6 rounded-3xl">
                            <div className="size-16 border-4 border-white/5 border-t-primary rounded-full animate-spin shadow-[0_0_15px_rgba(187,255,0,0.2)]"></div>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-white/40 font-black uppercase tracking-[0.3em] text-xs">Initializing Table</span>
                                <span className="text-[10px] text-primary/40 font-bold uppercase tracking-widest animate-pulse">Connecting to Solana...</span>
                            </div>
                        </div>
                    )}

                    {/* House Not Initialized Warning */}
                    {connected && houseExists === false && (
                        <div className="w-full p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-orange-500 text-sm">house</span>
                                <p className="text-orange-400 text-sm font-bold">House Account Not Initialized</p>
                            </div>
                            {houseExists === false && (
                                <>
                                    <p className="text-orange-400/70 text-xs mb-3">
                                        This is a one-time setup step required after deployment.
                                    </p>
                                    <button
                                        onClick={handleInitializeHouse}
                                        disabled={isInitializingHouse}
                                        className="w-full py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold rounded-lg transition-colors text-sm"
                                    >
                                        {isInitializingHouse ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="size-4 size-4 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                                                Initializing...
                                            </span>
                                        ) : (
                                            'Initialize House Account'
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Session Advisory */}
                    {playTimeMinutes >= 30 && (
                        <div className="w-full p-2.5 bg-warning/10 border border-warning/20 rounded-xl flex items-center justify-center gap-3 text-warning/80 text-xs font-black uppercase tracking-widest mb-4 animate-pulse">
                            <span className="material-symbols-outlined text-sm">timer</span>
                            <span>Session Advisory: {playTimeMinutes}m active • Play Responsibly</span>
                        </div>
                    )}

                    {/* Provably Fair Indicator + Controls */}
                    <Link href="/verify" target="_blank" className="w-full group/pf">
                        <div className="w-full p-3 rounded-lg border bg-primary/10 border-primary/20 text-xs font-bold uppercase tracking-wider flex items-center justify-between group-hover/pf:bg-primary/20 transition-all">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-sm text-primary">verified</span>
                                <span className="text-primary">Provably Fair</span>
                                <span className="text-gray-500">·</span>
                                <span className="text-gray-400 normal-case tracking-normal">98% RTP</span>
                                <span className="material-symbols-outlined text-[10px] text-gray-500 group-hover/pf:text-primary transition-colors">open_in_new</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMute(); }}
                                    className="p-1 rounded hover:bg-white/10 transition-colors"
                                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                                >
                                    <span className="material-symbols-outlined text-sm text-gray-400">
                                        {isMuted ? 'volume_off' : 'volume_up'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </Link>

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
                        <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg overflow-hidden">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-red-500 text-sm shrink-0 mt-0.5">error</span>
                                <p className="text-red-400 text-sm break-all">{error}</p>
                            </div>
                            <div className="mt-2 flex gap-4">
                                <button
                                    onClick={handleReset}
                                    className="text-xs text-red-400/60 hover:text-red-400 underline"
                                >
                                    Try Again
                                </button>
                                {betResult && (
                                    <button
                                        onClick={() => {
                                            setTxStatus('confirming');
                                            // Trigger the polling logic again or a simplified version
                                            // For now, allow retry from existing betPDA
                                            setShowResult(false);
                                            // we reuse handleFlip but it might need adjustment if we want to "resume"
                                        }}
                                        className="text-xs text-primary/60 hover:text-primary underline"
                                    >
                                        Check Result Again
                                    </button>
                                )}
                            </div>
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
                                "relative size-[150px] rounded-full bg-gradient-to-br from-[#FFD700] via-[#F59E0B] to-[#B45309] shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] flex items-center justify-center border-4 border-[#FCD34D] transform transition-all duration-500",
                                isFlipping ? "animate-spin" : "group-hover:scale-105 group-hover:rotate-y-12"
                            )}>
                                <div className="absolute inset-2 rounded-full border-2 border-[#B45309]/50 border-dashed"></div>
                                <span className="text-7xl font-black text-[#92400E] drop-shadow-[0_2px_2px_rgba(255,255,255,0.4)]">
                                    {side === 'HEADS' ? 'H' : 'T'}
                                </span>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-50"></div>
                            </div>
                        </div>
                    )}

                    {/* Betting Controls Container */}
                    {!showResult && (
                        <div className="w-full glass-panel rounded-3xl p-6 flex flex-col gap-4 shadow-2xl">
                            {/* Heads / Tails Toggle */}
                            <div className="grid grid-cols-2 gap-4 p-1 bg-black/40 rounded-2xl">
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

                            {/* Wallet Balance Display */}
                            {connected && (
                                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-sm">account_balance_wallet</span>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Balance</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-mono font-bold text-white">
                                            {balanceLoading ? (
                                                <span className="inline-block w-12 h-4 bg-white/10 rounded animate-pulse"></span>
                                            ) : (
                                                formatBalance(walletBalance)
                                            )}
                                        </span>
                                        <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">SOL</span>
                                    </div>
                                </div>
                            )}

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
                                        className="size-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-2xl font-bold text-gray-400 hover:text-white transition-all disabled:opacity-50"
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
                                            className="w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 text-white font-mono text-xl font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-center disabled:opacity-50"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-500 pointer-events-none tracking-tighter">SOL</div>
                                    </div>
                                    <button
                                        onClick={() => setAmount(Math.min(MAX_BET, amount + 0.5))}
                                        disabled={isFlipping}
                                        className="size-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-2xl font-bold text-gray-400 hover:text-white transition-all disabled:opacity-50"
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
                                    "w-full h-14 text-xl font-black tracking-[0.1em] uppercase rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 group shadow-[0_0_30px_rgba(7,204,0,0.3)] disabled:shadow-none",
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

                            {/* Disabled Reason Helper */}
                            {disabledReason && (
                                <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
                                    <span className="material-symbols-outlined text-sm">info</span>
                                    <span>{disabledReason}</span>
                                </div>
                            )}

                            {/* Debug Info (Dev Only) */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="p-3 bg-black/60 rounded-xl border border-white/10 text-xs font-mono space-y-1">
                                    <p className="text-gray-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">Debug Status</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Wallet:</span>
                                            <span className={connected ? "text-green-400" : "text-red-400"}>{connected ? "Connected" : "Not Connected"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Ready:</span>
                                            <span className={isReady ? "text-green-400" : "text-red-400"}>{isReady ? "Yes" : "No"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">House:</span>
                                            <span className={houseExists ? "text-green-400" : "text-red-400"}>{houseExists === null ? "Loading..." : (houseExists ? "Active" : "Not Found")}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Status:</span>
                                            <span className={isFlipping ? "text-yellow-400" : "text-blue-400"}>{isFlipping ? "Flipping" : "Idle"}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Amount:</span>
                                            <span className={(amount >= MIN_BET && amount <= MAX_BET) ? "text-green-400" : "text-red-400"}>{amount} SOL</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                console.log('[FlipIt] Manual refresh triggered');
                                                fetchHouse().then(house => setHouseExists(!!house));
                                            }}
                                            className="col-span-2 mt-2 py-1 px-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-white text-xs font-black uppercase tracking-tighter transition-all"
                                        >
                                            Force Refresh Status
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-[0.2em] px-1">
                                <span>Multiplier: <span className="text-white">2.0x</span></span>
                                <span>Win Chance: <span className="text-white">50%</span></span>
                                <span>House Edge: <span className="text-white">2%</span></span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Background Decorative Glows */}
                <div className="absolute top-1/4 left-1/4 size-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 size-96 bg-danger/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse delay-700"></div>
            </div>

            {/* Mobile History Toggle */}
            <button
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 size-14 rounded-full bg-primary text-black shadow-[0_0_20px_rgba(7,204,0,0.5)] flex items-center justify-center active:scale-95 transition-transform"
            >
                <span className="material-symbols-outlined">{isHistoryOpen ? 'close' : 'history'}</span>
            </button>

            {/* Mobile History Backdrop */}
            {isHistoryOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-30"
                    onClick={() => setIsHistoryOpen(false)}
                />
            )}

            {/* Sidebar (Recent Flips) */}
            <aside className={cn(
                "w-80 border-l border-white/5 bg-[#0A0A0F] lg:bg-[#0A0A0F]/50 backdrop-blur-xl flex flex-col transition-transform duration-300 z-40 lg:z-20",
                "fixed inset-y-0 right-0 translate-x-full lg:translate-x-0 lg:static",
                isHistoryOpen && "translate-x-0"
            )}>
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-white tracking-tighter flex items-center gap-2 uppercase text-sm">
                        <span className="material-symbols-outlined text-gray-400 text-lg">history</span>
                        Recent Flips
                    </h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-xs font-black text-primary uppercase tracking-widest">Live</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Real Recent Bets from Database */}
                    {isLoadingBets ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="size-6 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : recentBets && recentBets.length > 0 ? (
                        recentBets.map((bet) => (
                            <div key={bet.id} className="glass-panel rounded-xl p-4 flex items-center justify-between group hover:bg-white/5 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "size-10 rounded-lg flex items-center justify-center border",
                                        bet.playerWon ? "bg-primary/10 text-primary border-primary/20" : "bg-danger/10 text-danger border-danger/20"
                                    )}>
                                        <span className="material-symbols-outlined text-sm">
                                            {bet.playerWon ? 'check_circle' : 'cancel'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-mono text-gray-500">
                                            {shortenAddress(bet.player?.walletAddress || 'Unknown', 4)}
                                        </span>
                                        <span className="text-xs font-black text-white uppercase tracking-tighter">
                                            {bet.outcome}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={cn("text-sm font-black tracking-tighter", bet.playerWon ? "text-primary" : "text-gray-500")}>
                                        {bet.playerWon ? '+' : '-'}{((bet.payoutAmount || bet.amount) / 1_000_000_000).toFixed(2)} SOL
                                    </div>
                                    <div className="flex items-center gap-1 justify-end">
                                        <span className="text-xs font-bold text-gray-500 uppercase">
                                            {bet.resolvedAt ? new Date(bet.resolvedAt).toLocaleTimeString() : 'Pending'}
                                        </span>
                                        {bet.transactionSignature && (
                                            <a
                                                href={`https://solscan.io/tx/${bet.transactionSignature}?cluster=devnet`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-gray-600 hover:text-primary transition-colors"
                                                title="View on Solscan"
                                            >
                                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <span className="material-symbols-outlined text-4xl mb-2">casino</span>
                            <p className="text-sm">No recent flips</p>
                            <p className="text-xs mt-1">Be the first to play!</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-white/5">
                    <button className="w-full py-3 rounded-xl border border-white/5 hover:border-white/20 text-xs font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest bg-white/5">
                        View All History
                    </button>
                </div>
            </aside>
        </div>
    );
};
