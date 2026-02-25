'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '~/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMagicBlock } from '~/lib/magicblock/MagicBlockContext';
import { useGameState } from '~/hooks/useGameState';
import { GameErrorBoundary } from '~/components/error-boundaries';
import { ButtonLoader, TransactionLoader } from '~/components/loading';
import { useDegenDerbyProgram, type RaceAccount, type Horse } from '~/lib/anchor/degen-derby-client';
import { useRecentBets, useRecordBet, useResolveBet } from '~/hooks/useGameData';
import { shortenAddress, formatSol } from '~/lib/utils';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getRacePDA, getDegenDerbyHousePDA } from '~/lib/anchor/degen-derby-utils';
import { DerbyTrack } from './_components/DerbyTrack';
import { useDegenDerbyArcium } from '~/hooks/useDegenDerbyArcium';

const MIN_BET = 0.001;
const MAX_BET = 100;

const MOCK_HORSES: Horse[] = [
  { name: "Pepe Pride", oddsNumerator: 32, oddsDenominator: 10 }, // 3.2x
  { name: "Doge Dust", oddsNumerator: 55, oddsDenominator: 10 },
  { name: "Diamond Hands", oddsNumerator: 48, oddsDenominator: 10 },
  { name: "Bonk Blazer", oddsNumerator: 85, oddsDenominator: 10 },
  { name: "Solana Speed", oddsNumerator: 70, oddsDenominator: 10 },
  { name: "Hodl Horse", oddsNumerator: 150, oddsDenominator: 10 },
  { name: "Wif Hat", oddsNumerator: 120, oddsDenominator: 10 },
  { name: "Moon Shot", oddsNumerator: 250, oddsDenominator: 10 },
];

export const DegenDerbyGame: React.FC = () => {
  return (
    <GameErrorBoundary>
      <DegenDerbyGameContent />
    </GameErrorBoundary>
  );
};

const DegenDerbyGameContent: React.FC = () => {
  const [gameState, setGameState] = useState<'BETTING' | 'RACING' | 'RESULTS'>('BETTING');
  const [selectedHorseId, setSelectedHorseId] = useState<number | null>(null);
  const [stake, setStake] = useState(0.5);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [currentRace, setCurrentRace] = useState<RaceAccount | null>(null);
  const [userBet, setUserBet] = useState<{ horseIndex: number; amount: number } | null>(null);
  const [houseExists, setHouseExists] = useState<boolean | null>(null);
  const [isInitializingHouse, setIsInitializingHouse] = useState(false);

  const { setIsUsingRollup } = useMagicBlock();
  const { connected, publicKey } = useWallet();
  const { isLoading, error, txStatus, setTxStatus, reset, executeGameAction, isDemoMode } = useGameState();
  const { isReady, placeBet, claimWinnings, fetchRace, getCurrentOdds, fetchHouse, initializeHouse, resolveRace } = useDegenDerbyProgram();
  const { generateProvablyFairWinner } = useDegenDerbyArcium();

  const { data: recentBets, isLoading: isLoadingBets, isError: isErrorBets } = useRecentBets('DEGEN_DERBY', 10);
  const recordBet = useRecordBet();
  const resolveBet = useResolveBet();

  // Mock race data - in production fetch from database
  useEffect(() => {
    setCurrentRace({
      index: 1,
      horses: MOCK_HORSES,
      totalBets: [500, 300, 400, 200, 350, 100, 150, 50].map(v => v * LAMPORTS_PER_SOL),
      playerCounts: [12, 8, 10, 5, 9, 3, 4, 2],
      status: 'Open',
      winner: null,
      houseFee: 0.01,
      createdAt: Date.now(),
      startedAt: null,
      resolvedAt: null,
    });
  }, []);

  // Check if house exists — SKIP in demo mode
  useEffect(() => {
    if (isDemoMode) {
      setHouseExists(true);
      return;
    }
    const checkHouse = async () => {
      if (!isReady || !fetchHouse) return;
      const house = await fetchHouse();
      setHouseExists(!!house);
    };
    checkHouse();
  }, [isReady, isDemoMode]);

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
    if (isDemoMode) return;
    if (connected && isReady && houseExists === false && !isInitializingHouse && txStatus === 'idle') {
      handleInitializeHouse();
    }
  }, [connected, isReady, houseExists, isInitializingHouse, txStatus, isDemoMode]);

  const handlePlaceBet = async () => {
    if (selectedHorseId === null || !currentRace) return;
    if (!isDemoMode && (!connected || !isReady)) return;
    if (stake < MIN_BET || stake > MAX_BET) return;

    setTxStatus('pending');
    setIsUsingRollup(true);

    if (isDemoMode) {
      setTxStatus('pending');
      await new Promise(r => setTimeout(r, 800));
      setUserBet({
        horseIndex: selectedHorseId,
        amount: stake,
      });
      setTxStatus('confirmed');

      // Transition to RACING after brief confirmation
      await new Promise(r => setTimeout(r, 600));
      setGameState('RACING');

      // Simulate race duration (let DerbyTrack animation play)
      await new Promise(r => setTimeout(r, 6000));

      // Pick winner — bias toward user's horse 60% of the time
      const winnerIndex = Math.random() > 0.4
        ? selectedHorseId
        : Math.floor(Math.random() * MOCK_HORSES.length);
      setWinnerId(winnerIndex);
      setGameState('RESULTS');
      return;
    }

    try {
      const bet = await executeGameAction(async () => {
        // In production: const [racePDA] = getRacePDA(currentRace.index);
        // return await placeBet(racePDA, currentRace.index, stake, selectedHorseId);

        // Mocking for Hackathon UI since Race 1 is never created on-chain
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true, signature: 'mock-sig-' + Date.now() };
      });

      if (!bet) throw new Error('Failed to place bet');

      // Record bet in TRPC database
      try {
        const racePDA = currentRace.pda;
        if (racePDA && publicKey) {
          await recordBet.mutateAsync({
            gameType: 'DEGEN_DERBY',
            amount: stake * LAMPORTS_PER_SOL,
            housePDA: getDegenDerbyHousePDA()[0].toBase58(),
            gamePDA: racePDA.toBase58(),
            playerPDA: publicKey.toBase58(),
            signature: bet.signature,
            prediction: `Horse ${selectedHorseId + 1}`,
          });
        }
      } catch (dbError) {
        console.error('Failed to record bet in database:', dbError);
      }
      setUserBet({ horseIndex: selectedHorseId, amount: stake });
      setTxStatus('confirmed');
      setGameState('RACING');
    } catch (err) {
      setTxStatus('failed');
    } finally {
      setIsUsingRollup(false);
    }
  };

  const handleRaceResolve = async () => {
    if (!connected || !isReady || !currentRace) return;

    if (isDemoMode) {
      setTxStatus('pending');
      await new Promise(r => setTimeout(r, 2000));
      const winnerIndex = Math.floor(Math.random() * MOCK_HORSES.length);
      handleRaceEnd(winnerIndex);
      setTxStatus('confirmed');
      return;
    }

    setTxStatus('pending');
    try {
      await executeGameAction(async () => {
        // Step 1: Trigger Arcium computation (Mocked in client.ts)
        console.log('[DegenDerby] Triggering Arcium race resolution...');
        const horsesList = MOCK_HORSES.map((h, i) => ({ id: i.toString(), odds: 2.0 }));
        const arciumResult = await generateProvablyFairWinner(currentRace.index.toString(), horsesList);

        if (!arciumResult.success || !arciumResult.proof) {
          throw new Error(arciumResult.error || 'Arcium resolution failed');
        }

        // Step 2: Trigger on-chain resolution
        const [racePDA] = getRacePDA(currentRace.index);
        const result = await resolveRace(racePDA);
        return { success: true, winnerIndex: result.winnerHorseIndex };
      }, {
        onSuccess: (data: any) => {
          handleRaceEnd(data.winnerIndex);
          setTxStatus('confirmed');
        },
        onError: () => setTxStatus('failed'),
      });
    } catch (err) {
      setTxStatus('failed');
    }
  };

  const handleRaceEnd = async (winningHorseId: number) => {
    setWinnerId(winningHorseId);
    setIsUsingRollup(false);
    setGameState('RESULTS');

    // Resolve bet in database
    if (userBet) {
      const won = userBet.horseIndex === winningHorseId;
      try {
        await resolveBet.mutateAsync({
          betPda: currentRace?.pda.toBase58() || 'mock-pda',
          outcome: 'PLAYER_WIN',
          playerWon: won,
          payoutAmount: won ? userBet.amount * 2 * LAMPORTS_PER_SOL : 0,
          houseFee: userBet.amount * 0.01 * LAMPORTS_PER_SOL,
        });
      } catch (dbError) {
        console.error('DB error:', dbError);
      }
    }
  };

  const handleClaim = async () => {
    if (!userBet || !connected || !isReady) return;

    setTxStatus('pending');
    try {
      await executeGameAction(async () => {
        // In production: await claimWinnings(racePDA);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { success: true };
      }, {
        onSuccess: () => {
          setTxStatus('confirmed');
          handleReset();
        },
        onError: () => setTxStatus('failed'),
      });
    } catch (err) {
      setTxStatus('failed');
    }
  };

  const handleReset = () => {
    reset();
    setGameState('BETTING');
    setSelectedHorseId(null);
    setWinnerId(null);
    setUserBet(null);
  };

  const isBetting = isLoading || txStatus === 'pending' || txStatus === 'confirming';
  const canBet = isDemoMode
    ? (!isBetting && selectedHorseId !== null && stake >= MIN_BET && stake <= MAX_BET && gameState === 'BETTING')
    : (connected && isReady && !isBetting && selectedHorseId !== null && stake >= MIN_BET && stake <= MAX_BET && gameState === 'BETTING');

  // Calculate dynamic odds based on pool
  const getOdds = (horseIndex: number) => {
    if (!currentRace) return 2.0;
    const totalPool = currentRace.totalBets.reduce((a, b) => a + b, 0);
    const horsePool = currentRace.totalBets[horseIndex];
    if (!horsePool || horsePool === 0) return 5.0; // Default for unbet horses
    return (totalPool / horsePool) * 0.99; // 1% house fee
  };

  const selectedHorse = selectedHorseId !== null ? MOCK_HORSES[selectedHorseId] : null;
  const estPayout = selectedHorse ? (stake * getOdds(selectedHorseId!)).toFixed(2) : "0.00";
  const isWinner = winnerId !== null && userBet?.horseIndex === winnerId;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1600px] mx-auto p-4">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-accentGold mb-1">
              <span className="material-symbols-outlined text-sm">stars</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">The Grand Championship</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase">
              Degen <span className="text-primary">Derby</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <span className="material-symbols-outlined text-gray-400 text-sm">info</span>
            <span className="text-gray-300 text-[10px] font-bold uppercase tracking-wider">
              Status: {currentRace?.status || 'Loading'}
            </span>
          </div>
        </div>

        {/* Wallet Warning */}
        {!isDemoMode && !connected && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-500 text-sm">wallet</span>
              <p className="text-yellow-400 text-sm">Connect your wallet to place bets</p>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {txStatus !== 'idle' && (
          <TransactionLoader
            status={txStatus}
            message={txStatus === 'pending' ? 'Confirm in wallet...' : undefined}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-sm">error</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <button onClick={reset} className="mt-2 text-xs text-red-400/60 hover:text-red-400 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Race Results */}
        {gameState === 'RESULTS' && (
          <div className={cn(
            "p-6 rounded-2xl border-2 text-center",
            isWinner ? "bg-primary/10 border-primary/30" : "bg-danger/10 border-danger/30"
          )}>
            <h3 className={cn("text-2xl font-black mb-2", isWinner ? "text-primary" : "text-danger")}>
              {isWinner ? '🎉 You Won!' : '😔 Better Luck Next Time'}
            </h3>
            <p className="text-white/60 mb-4">
              Winner: {MOCK_HORSES[winnerId!]?.name}
            </p>
            {isWinner && userBet && (
              <p className="text-3xl font-black text-primary mb-4">
                +{(userBet.amount * getOdds(userBet.horseIndex)).toFixed(2)} SOL
              </p>
            )}
            <div className="flex gap-3 justify-center">
              {isWinner && (
                <button
                  onClick={handleClaim}
                  disabled={isBetting}
                  className="px-6 py-3 bg-primary hover:bg-primaryHover text-black font-black rounded-xl transition-colors disabled:opacity-50"
                >
                  {isBetting ? <ButtonLoader text="Claiming..." /> : 'Claim Winnings'}
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
              >
                Race Again
              </button>
            </div>
          </div>
        )}

        {/* Race Track */}
        {gameState === 'RACING' && (
          <DerbyTrack
            horses={MOCK_HORSES.map((h, i) => ({ id: i, name: h.name, image: '' }))}
            onRaceEnd={isDemoMode ? () => { } : handleRaceEnd}
          />
        )}

        {/* Betting Interface */}
        {gameState === 'BETTING' && (
          <>
            {/* Horse Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {MOCK_HORSES.map((horse, index) => {
                const odds = getOdds(index);
                const isSelected = selectedHorseId === index;
                const totalBet = currentRace?.totalBets[index] || 0;
                const playerCount = currentRace?.playerCounts[index] || 0;

                return (
                  <button
                    key={index}
                    onClick={() => !isBetting && setSelectedHorseId(index)}
                    disabled={isBetting}
                    className={cn(
                      "relative overflow-hidden rounded-2xl p-4 text-left transition-all border-2",
                      isSelected
                        ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(7,204,0,0.2)]"
                        : "bg-white/5 border-transparent hover:bg-white/10"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Lane {index + 1}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-black",
                        isSelected ? "bg-primary text-black" : "bg-white/10 text-white"
                      )}>
                        {odds.toFixed(2)}x
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white mb-1">{horse.name}</h3>
                    <div className="text-xs text-gray-500">
                      <p>{(totalBet / LAMPORTS_PER_SOL).toFixed(2)} SOL bet</p>
                      <p>{playerCount} bettors</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bet Controls */}
            <div className="glass-panel rounded-3xl p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bet Amount</label>
                    <span className="text-xs text-gray-500">Min: {MIN_BET} SOL | Max: {MAX_BET} SOL</span>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => setStake(Math.max(MIN_BET, stake - 0.5))}
                      disabled={isBetting}
                      className="size-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={stake}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setStake(Math.min(MAX_BET, Math.max(MIN_BET, val)));
                      }}
                      disabled={isBetting}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-center text-white font-mono font-bold disabled:opacity-50"
                    />
                    <button
                      onClick={() => setStake(Math.min(MAX_BET, stake + 0.5))}
                      disabled={isBetting}
                      className="size-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <input
                    type="range"
                    min={MIN_BET}
                    max={MAX_BET}
                    step="0.1"
                    value={stake}
                    onChange={(e) => setStake(parseFloat(e.target.value))}
                    disabled={isBetting}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="w-full md:w-auto min-w-[200px] text-center">
                  {selectedHorse ? (
                    <>
                      <p className="text-sm text-gray-500 mb-1">Potential Payout</p>
                      <p className="text-3xl font-black text-primary">{estPayout} SOL</p>
                      <p className="text-xs text-gray-500 mt-1">on {selectedHorse.name}</p>
                    </>
                  ) : (
                    <p className="text-gray-500">Select a horse to bet</p>
                  )}
                </div>

                <button
                  onClick={handlePlaceBet}
                  disabled={!canBet}
                  className={cn(
                    "w-full md:w-auto px-8 py-4 rounded-xl font-black uppercase tracking-wider transition-all",
                    canBet
                      ? "bg-primary hover:bg-primaryHover text-black shadow-[0_0_30px_rgba(7,204,0,0.3)]"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  )}
                >
                  {isBetting ? <ButtonLoader text="Placing Bet..." /> : 'Place Bet'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sidebar - Recent Bets */}
      <aside className="w-full lg:w-80 shrink-0">
        <div className="glass-panel rounded-2xl p-4 sticky top-4">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400">history</span>
            Recent Races
          </h3>

          {isLoadingBets ? (
            <div className="flex justify-center py-8">
              <div className="size-6 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
            </div>
          ) : isErrorBets ? (
            <div className="text-center py-8 text-danger/60 italic text-xs">
              <span className="material-symbols-outlined text-xl mb-1 block">warning</span>
              Failed to load recent races
            </div>
          ) : recentBets && recentBets.length > 0 ? (
            <div className="space-y-3">
              {recentBets.map((bet) => (
                <div key={bet.id} className="p-3 bg-white/5 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">
                      {shortenAddress(bet.player?.walletAddress || 'Unknown', 4)}
                    </span>
                    <span className={cn(
                      "text-xs font-bold",
                      bet.playerWon ? "text-primary" : "text-gray-500"
                    )}>
                      {bet.playerWon ? 'Won' : 'Lost'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white font-bold">
                      Horse #{bet.playerChoice}
                    </span>
                    <span className={cn(
                      "text-sm font-black",
                      bet.playerWon ? "text-primary" : "text-white"
                    )}>
                      {bet.playerWon ? '+' : ''}{formatSol(bet.payoutAmount || bet.amount)} SOL
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="material-symbols-outlined text-4xl mb-2">sports_score</span>
              <p className="text-sm">No races yet</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
