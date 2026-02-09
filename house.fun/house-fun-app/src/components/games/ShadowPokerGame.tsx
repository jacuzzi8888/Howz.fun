'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '~/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { web3 } from '@coral-xyz/anchor';
import { useGameState } from '~/hooks/useGameState';
import { GameErrorBoundary } from '~/components/error-boundaries';
import { ButtonLoader, TransactionLoader } from '~/components/loading';
import { useRecentBets, useRecordBet, useResolveBet } from '~/hooks/useGameData';
import { shortenAddress } from '~/lib/utils';
import { useMagicBlock } from '~/lib/magicblock/MagicBlockContext';
import {
  useShadowPokerProgram,
  type TableAccount,
  type PlayerStateAccount,
  type JoinTableResult,
  type PlayerActionResult
} from '~/lib/anchor/shadow-poker-client';
import {
  type PlayerAction,
  type TableStatus,
  getTablePDA,
  getPlayerStatePDA,
  formatTableStatus,
  formatPlayerAction,
  cardToDisplay,
  type CardDisplay
} from '~/lib/anchor/shadow-poker-utils';
import { useShadowPokerArcium } from '~/hooks/useShadowPokerArcium';
import type { EncryptedCard, EncryptedDeck } from '~/lib/arcium/client';
import type { EncryptedCardData } from '~/lib/anchor/shadow-poker-client';

// Constants
const MIN_BUY_IN = 0.5; // SOL
const MAX_BUY_IN = 50; // SOL
const DEFAULT_TABLE_INDEX = 0;

// Mock player data for opponents until we have real data
interface OpponentPlayer {
  id: string;
  name: string;
  avatar: string;
  stack: number;
  currentBet: number;
  isActive: boolean;
  position: number;
  lastAction?: string;
}

export const ShadowPokerGame: React.FC = () => {
  return (
    <GameErrorBoundary>
      <ShadowPokerGameContent />
    </GameErrorBoundary>
  );
};

const ShadowPokerGameContent: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { isUsingRollup, isSessionActive, sessionKey } = useMagicBlock();

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
    joinTable,
    leaveTable,
    playerAction,
    fetchTable,
    fetchPlayerState,
    isPlayerTurn,
    getAvailableActions,
    delegateAccount,
    undelegateAccount,
  } = useShadowPokerProgram(sessionKey);

  // Fetch real recent bets from database
  const { data: recentBets, isLoading: isLoadingBets } = useRecentBets('SHADOW_POKER', 10);

  // Mutations for recording bets
  const recordBet = useRecordBet();
  const resolveBet = useResolveBet();

  // Game state
  const [tablePDA, setTablePDA] = useState<web3.PublicKey | null>(null);
  const [playerStatePDA, setPlayerStatePDA] = useState<web3.PublicKey | null>(null);
  const [table, setTable] = useState<TableAccount | null>(null);
  const [playerState, setPlayerState] = useState<PlayerStateAccount | null>(null);
  const [isAtTable, setIsAtTable] = useState(false);
  const [buyInAmount, setBuyInAmount] = useState(5);
  const [betAmount, setBetAmount] = useState(0);
  const [availableActions, setAvailableActions] = useState<PlayerAction[]>([]);
  const [isPlayerTurnState, setIsPlayerTurnState] = useState(false);
  const [opponents, setOpponents] = useState<OpponentPlayer[]>([]);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Arcium encrypted card state
  const {
    isGeneratingDeck,
    isDecryptingCards,
    encryptedDeck,
    decryptedHoleCards,
    arciumProof,
    error: arciumError,
    generateEncryptedDeck,
    decryptHoleCards,
    generateShowdownProof,
    reset: resetArcium,
    validateDeckIntegrity,
    isComputing,
  } = useShadowPokerArcium();

  const [encryptedHoleCards, setEncryptedHoleCards] = useState<EncryptedCardData[] | null>(null);
  const [showEncryptedCards, setShowEncryptedCards] = useState(false);

  // Initialize table PDA on mount
  useEffect(() => {
    const [pda] = getTablePDA(DEFAULT_TABLE_INDEX);
    setTablePDA(pda);
  }, []);

  // Fetch table data periodically
  useEffect(() => {
    if (!tablePDA || !isReady) return;

    const fetchTableData = async () => {
      try {
        const tableData = await fetchTable(tablePDA);
        if (tableData) {
          setTable(tableData);
        }
      } catch (err) {
        console.error('Failed to fetch table:', err);
      }
    };

    fetchTableData();
    const interval = setInterval(fetchTableData, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [tablePDA, isReady, fetchTable]);

  // Fetch player state when at table
  useEffect(() => {
    if (!playerStatePDA || !isReady || !isAtTable) return;

    const fetchPlayerData = async () => {
      try {
        const playerData = await fetchPlayerState(playerStatePDA);
        if (playerData) {
          setPlayerState(playerData);
        }
      } catch (err) {
        console.error('Failed to fetch player state:', err);
      }
    };

    fetchPlayerData();
    const interval = setInterval(fetchPlayerData, 2000);

    return () => clearInterval(interval);
  }, [playerStatePDA, isReady, isAtTable, fetchPlayerState]);

  // Check if it's player's turn and get available actions
  useEffect(() => {
    if (!tablePDA || !playerStatePDA || !isReady || !isAtTable) {
      setIsPlayerTurnState(false);
      setAvailableActions([]);
      return;
    }

    const checkTurn = async () => {
      try {
        const turn = await isPlayerTurn(tablePDA, playerStatePDA);
        setIsPlayerTurnState(turn);

        if (turn) {
          const actions = await getAvailableActions(tablePDA, playerStatePDA);
          setAvailableActions(actions);
        } else {
          setAvailableActions([]);
        }
      } catch (err) {
        console.error('Failed to check turn:', err);
      }
    };

    checkTurn();
    const interval = setInterval(checkTurn, 1000);

    return () => clearInterval(interval);
  }, [tablePDA, playerStatePDA, isReady, isAtTable, isPlayerTurn, getAvailableActions]);

  // Generate mock opponents based on table state
  useEffect(() => {
    if (!table || !publicKey) {
      setOpponents([]);
      return;
    }

    const mockOpponents: OpponentPlayer[] = table.players
      .filter((p, idx) => p.toBase58() !== publicKey.toBase58())
      .map((player, idx) => ({
        id: player.toBase58(),
        name: `Player${idx + 1}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.toBase58()}`,
        stack: table ? table.pot / (table.players.length + 1) : 1000,
        currentBet: table?.currentBet || 0,
        isActive: true,
        position: idx,
        lastAction: idx === 2 ? 'Check' : undefined,
      }));

    setOpponents(mockOpponents);
  }, [table, publicKey]);

  const handleJoinTable = async () => {
    if (!connected || !isReady || !tablePDA) return;
    if (buyInAmount < MIN_BUY_IN || buyInAmount > MAX_BUY_IN) return;

    setTxStatus('pending');

    try {
      const result = await executeGameAction(async () => {
        return await joinTable(tablePDA, buyInAmount);
      });

      if (result) {
        const joinResult = result as JoinTableResult;
        setPlayerStatePDA(joinResult.playerStatePDA);
        setIsAtTable(true);
        setTxStatus('confirmed');

        // Record in database
        try {
          await recordBet.mutateAsync({
            gameType: 'SHADOW_POKER',
            betPda: joinResult.playerStatePDA.toString(),
            transactionSignature: joinResult.signature,
            amount: buyInAmount * 1_000_000_000,
            playerChoice: 0,
            commitmentHash: '',
          });
        } catch (dbError) {
          console.error('Failed to record join in database:', dbError);
        }

        // Auto-delegate if in Rollup Mode
        if (isUsingRollup) {
          try {
            console.log('[MagicBlock] Auto-delegating table and player state...');
            await delegateAccount(tablePDA);
            await delegateAccount(joinResult.playerStatePDA);
            console.log('[MagicBlock] Accounts delegated to Ephemeral Rollup');
          } catch (delError) {
            console.error('Auto-delegation failed:', delError);
          }
        }
      } else {
        throw new Error('Failed to join table');
      }
    } catch (err) {
      setTxStatus('failed');
      console.error('Join table failed:', err);
    }
  };

  const handleLeaveTable = async () => {
    if (!connected || !isReady || !tablePDA || !playerStatePDA) return;

    setTxStatus('pending');

    try {
      await executeGameAction(async () => {
        return await leaveTable(tablePDA, playerStatePDA);
      });

      setTxStatus('confirmed');

      // Undelegate if in Rollup Mode
      if (isUsingRollup && playerStatePDA) {
        try {
          console.log('[MagicBlock] Undelegating accounts...');
          await undelegateAccount(playerStatePDA);
          await undelegateAccount(tablePDA);
          console.log('[MagicBlock] Accounts returned to L1');
        } catch (undelError) {
          console.error('Undelegation failed:', undelError);
        }
      }

      setIsAtTable(false);
      setPlayerStatePDA(null);
      setPlayerState(null);
    } catch (err) {
      setTxStatus('failed');
      console.error('Leave table failed:', err);
    }
  };

  const handlePlayerAction = async (action: PlayerAction) => {
    if (!connected || !isReady || !tablePDA || !playerStatePDA || !isPlayerTurnState) return;

    setTxStatus('pending');

    try {
      const result = await executeGameAction(async () => {
        return await playerAction(tablePDA, playerStatePDA, action, betAmount);
      });

      if (result) {
        const actionResult = result as PlayerActionResult;
        setLastAction(formatPlayerAction(actionResult.action));
        setTxStatus('confirmed');
        setBetAmount(0);

        // Record action in database
        try {
          await recordBet.mutateAsync({
            gameType: 'SHADOW_POKER',
            betPda: playerStatePDA.toString(),
            transactionSignature: actionResult.signature,
            amount: actionResult.amount * 1_000_000_000,
            playerChoice: ['Fold', 'Check', 'Call', 'Raise', 'AllIn'].indexOf(actionResult.action),
            commitmentHash: '',
          });
        } catch (dbError) {
          console.error('Failed to record action in database:', dbError);
        }
      }
    } catch (err) {
      setTxStatus('failed');
      console.error('Action failed:', err);
    }
  };

  const handleStartHand = async () => {
    if (!connected || !isReady || !tablePDA) return;

    setTxStatus('pending');

    try {
      // Step 1: Arcium generates encrypted deck (automatic on-chain init inside hook)
      console.log('[Game] Starting encrypted hand with Arcium...');
      const result = await generateEncryptedDeck(tablePDA, table?.players || []);

      if (result.success) {
        setTxStatus('confirmed');
        setLastAction('Hand Started (Encrypted)');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setTxStatus('failed');
      console.error('Start hand failed:', err);
    }
  };

  const handleShowdown = async () => {
    if (!connected || !isReady || !tablePDA) return;

    setTxStatus('pending');

    try {
      console.log('[Game] Triggering Arcium showdown revelation...');
      if (!encryptedDeck) throw new Error('No encrypted deck found for showdown');
      const result = await generateShowdownProof(tablePDA, encryptedDeck);

      if (result.success) {
        setTxStatus('confirmed');
        setLastAction('Showdown Complete');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setTxStatus('failed');
      console.error('Showdown failed:', err);
    }
  };

  const handleReset = () => {
    reset();
    setLastAction(null);
  };

  const isProcessing = isLoading || txStatus === 'pending' || txStatus === 'confirming';
  const canJoin = connected && isReady && !isProcessing && !isAtTable && buyInAmount >= MIN_BUY_IN && buyInAmount <= MAX_BUY_IN;
  const canLeave = connected && isReady && !isProcessing && isAtTable;
  const canAct = isPlayerTurnState && !isProcessing && isAtTable;

  // Debug helper to show why actions are disabled
  const getDisabledReason = () => {
    if (!connected) return 'Connect wallet';
    if (!isReady) return 'Wallet not ready - reconnect or try a different wallet';
    if (isProcessing) return 'Transaction in progress';
    if (!isAtTable) return 'Join table first';
    if (!isPlayerTurnState) return 'Waiting for your turn';
    return null;
  };
  const disabledReason = getDisabledReason();

  // Calculate call amount
  const callAmount = table && playerState
    ? Math.max(0, table.currentBet - playerState.currentBet)
    : 0;

  // Get suit color
  const getSuitColor = (suit: string) => {
    return suit === 'Hearts' || suit === 'Diamonds' ? 'text-danger' : 'text-black';
  };

  // Get suit icon
  const getSuitIcon = (suit: string) => {
    switch (suit) {
      case 'Hearts': return 'favorite';
      case 'Diamonds': return 'diamond';
      case 'Clubs': return 'playing_cards';
      case 'Spades': return 'playing_cards';
      default: return 'playing_cards';
    }
  };

  return (
    <div className="flex flex-1 relative overflow-hidden">
      {/* Game Area (Center) */}
      <div className="flex-1 flex items-center justify-center relative p-4 mt-6 perspective-[1000px] overflow-y-auto">

        {/* Wallet Not Connected */}
        {!connected && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-500 text-sm">wallet</span>
              <p className="text-yellow-400 text-sm">Connect your wallet to play</p>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {txStatus !== 'idle' && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
            <TransactionLoader
              status={txStatus}
              message={txStatus === 'pending' ? 'Confirm in wallet...' : undefined}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="absolute top-36 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-sm">error</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <button
              onClick={handleReset}
              className="mt-2 text-xs text-red-400/60 hover:text-red-400 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Arcium Status Indicators */}
        {(isGeneratingDeck || isDecryptingCards || arciumError) && (
          <div className="absolute top-52 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
            {isGeneratingDeck && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-primary text-sm font-medium">Generating encrypted deck with Arcium...</span>
                </div>
              </div>
            )}
            {isDecryptingCards && (
              <div className="p-4 bg-accentGold/10 border border-accentGold/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-accentGold/30 border-t-accentGold rounded-full animate-spin" />
                  <span className="text-accentGold text-sm font-medium">Decrypting hole cards...</span>
                </div>
              </div>
            )}
            {arciumError && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-yellow-500 text-sm">warning</span>
                  <p className="text-yellow-400 text-sm">{arciumError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Join Table Modal */}
        {!isAtTable && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Join Table</h2>
              <p className="text-gray-400 text-sm mb-6">
                Table #{DEFAULT_TABLE_INDEX + 1} • Min: {MIN_BUY_IN} SOL • Max: {MAX_BUY_IN} SOL
              </p>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2 block">
                    Buy-in Amount
                  </label>
                  <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-3">
                    <input
                      type="number"
                      value={buyInAmount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          setBuyInAmount(Math.min(MAX_BUY_IN, Math.max(MIN_BUY_IN, val)));
                        }
                      }}
                      min={MIN_BUY_IN}
                      max={MAX_BUY_IN}
                      step={0.5}
                      disabled={isProcessing}
                      className="bg-transparent text-white font-mono text-xl font-bold w-full outline-none disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-500 font-bold">SOL</span>
                  </div>
                  <input
                    type="range"
                    min={MIN_BUY_IN}
                    max={MAX_BUY_IN}
                    step="0.5"
                    value={buyInAmount}
                    onChange={(e) => setBuyInAmount(parseFloat(e.target.value))}
                    disabled={isProcessing}
                    className="w-full mt-3 h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <button
                  onClick={handleJoinTable}
                  disabled={!canJoin}
                  className={cn(
                    "w-full h-14 rounded-xl font-black uppercase tracking-widest transition-all transform active:scale-[0.98] shadow-xl",
                    canJoin
                      ? "bg-primary hover:bg-primaryHover text-black shadow-[0_0_30px_rgba(7,204,0,0.4)]"
                      : "bg-neutral-800 text-gray-500 cursor-not-allowed"
                  )}
                >
                  {isProcessing ? <ButtonLoader text="Joining..." /> : 'Join Table'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* The Poker Table */}
        <div className="relative w-full max-w-[1000px] aspect-[1.8/1] rounded-[200px] bg-[#3E2723] border-[16px] border-[#3E2723] shadow-[inset_0_0_50px_rgba(0,0,0,0.8),_0_20px_50px_rgba(0,0,0,0.5)] z-10">
          {/* Felt Surface */}
          <div className="absolute inset-2 rounded-[180px] bg-table-gradient felt-texture shadow-inner border border-black/30 overflow-hidden">
            {/* Center: Community Cards & Pot */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20">
              {/* Pot Display */}
              <div className="flex flex-col items-center gap-1">
                <div className="glass-panel px-6 py-2 rounded-full flex flex-col items-center bg-black/40 backdrop-blur-md border border-white/10">
                  <span className="text-primary text-[9px] tracking-[0.2em] font-black uppercase opacity-60 mb-1">Total Pot</span>
                  <div className="text-white text-2xl font-black tracking-tight drop-shadow-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-accentGold text-[20px]">monetization_on</span>
                    {table ? `${table.pot.toFixed(2)} USDC` : '0 USDC'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-primary/60 font-black tracking-[0.2em] mt-2 uppercase italic">
                  <span className="material-symbols-outlined text-[12px]">security</span>
                  Encrypted by Arcium
                </div>
              </div>

              {/* Table Status */}
              {table && (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                    {formatTableStatus(table.status)}
                  </div>

                  {/* Admin Controls (Mocking authority check) */}
                  <div className="flex gap-2">
                    {table.status === 'Waiting' && table.players.length >= 2 && (
                      <button
                        onClick={handleStartHand}
                        disabled={isProcessing || isGeneratingDeck}
                        className="bg-primary hover:bg-primaryHover text-black text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest transition-all"
                      >
                        {isGeneratingDeck ? 'Generating Deck...' : 'Start Hand'}
                      </button>
                    )}
                    {(table.status === 'Betting' || table.status === 'Dealing') && (
                      <button
                        onClick={handleShowdown}
                        disabled={isProcessing || isComputing}
                        className="bg-accentGold hover:bg-accentGold/80 text-black text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest transition-all"
                      >
                        {isComputing ? 'Revealing Cards...' : 'Showdown'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Community Cards */}
              <div className="flex items-center gap-3">
                {table?.communityCards && table.communityCards.length > 0 ? (
                  table.communityCards.map((card, idx) => (
                    <div key={idx} className="w-14 h-20 md:w-16 md:h-24 bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center relative border border-gray-300">
                      <span className={cn("font-black text-lg absolute top-1 left-2 leading-none", getSuitColor(card.suit))}>
                        {card.rank}
                      </span>
                      <span className={cn("material-symbols-outlined absolute top-1 right-1 text-[14px]", getSuitColor(card.suit))}>
                        {getSuitIcon(card.suit)}
                      </span>
                      <span className={cn("material-symbols-outlined text-3xl", getSuitColor(card.suit))}>
                        {getSuitIcon(card.suit)}
                      </span>
                    </div>
                  ))
                ) : (
                  // Placeholder cards when no community cards
                  <>
                    <div className="w-14 h-20 md:w-16 md:h-24 bg-[#111827] rounded-lg shadow-2xl flex items-center justify-center border border-white/5">
                      <span className="material-symbols-outlined text-white/20 text-2xl">lock</span>
                    </div>
                    <div className="w-14 h-20 md:w-16 md:h-24 bg-[#111827] rounded-lg shadow-2xl flex items-center justify-center border border-white/5">
                      <span className="material-symbols-outlined text-white/20 text-2xl">lock</span>
                    </div>
                    <div className="w-14 h-20 md:w-16 md:h-24 bg-[#111827] rounded-lg shadow-2xl flex items-center justify-center border border-white/5">
                      <span className="material-symbols-outlined text-white/20 text-2xl">lock</span>
                    </div>
                    <div className="w-14 h-20 md:w-16 md:h-24 bg-[#111827] rounded-lg shadow-2xl flex items-center justify-center border border-white/5">
                      <span className="material-symbols-outlined text-white/20 text-2xl">lock</span>
                    </div>
                    <div className="w-14 h-20 md:w-16 md:h-24 bg-[#111827] rounded-lg shadow-2xl flex items-center justify-center border border-white/5">
                      <span className="material-symbols-outlined text-white/20 text-2xl">lock</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Opponents */}
          {opponents.map((opponent, idx) => {
            // Position opponents around the table
            const positions = [
              { top: '-30px', left: '15%', transform: '-translate-x-1/2' },
              { top: '-30px', right: '15%', transform: 'translate-x-1/2' },
              { top: '50%', right: '-50px', transform: '-translate-y-1/2' },
              { top: '50%', left: '-50px', transform: '-translate-y-1/2' },
            ];
            const pos = positions[idx % positions.length];
            if (!pos) return null;

            return (
              <div
                key={opponent.id}
                className={cn(
                  "absolute flex flex-col items-center gap-3 z-30",
                  !opponent.isActive && "opacity-40 grayscale"
                )}
                style={{
                  top: pos.top,
                  left: pos.left,
                  right: pos.right,
                  transform: pos.transform,
                }}
              >
                <div className="relative group/player">
                  <div className="size-16 rounded-full bg-black/60 border-2 border-white/10 overflow-hidden shadow-2xl relative">
                    <img className="w-full h-full object-cover" src={opponent.avatar} alt={opponent.name} />
                  </div>
                  {opponent.lastAction && (
                    <div className="absolute -bottom-2 -right-2 bg-neutral-800 text-white text-[8px] font-black px-2.5 py-1 rounded-full border border-neutral-700 shadow-xl uppercase tracking-widest">
                      {opponent.lastAction}
                    </div>
                  )}
                </div>
                <div className="glass-panel px-4 py-1.5 rounded-xl text-center min-w-[110px] bg-black/40 backdrop-blur-md border border-white/5">
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{opponent.name}</p>
                  <p className="text-xs font-black text-white">${opponent.stack.toFixed(0)}</p>
                  {opponent.currentBet > 0 && (
                    <p className="text-[8px] text-accentGold font-bold">Bet: ${opponent.currentBet.toFixed(0)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* HERO HUD (Bottom) */}
        {isAtTable && playerState && (
          <div className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 flex flex-col items-center z-50 w-full max-w-3xl px-4">
            {/* Action Indicator */}
            <div className="relative mb-4">
              {isPlayerTurnState && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-24 rounded-full border-4 border-accentGold shadow-[0_0_20px_rgba(180,229,13,0.4)] opacity-80 animate-pulse"></div>
              )}
              <div className={cn(
                "size-20 rounded-full bg-black border-2 overflow-hidden shadow-2xl relative z-10",
                isPlayerTurnState ? "border-accentGold" : "border-white/10"
              )}>
                <img
                  className="w-full h-full object-cover"
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${publicKey?.toBase58() || 'hero'}`}
                  alt="Your Avatar"
                />
              </div>

              {/* Hole Cards - Arcium Encrypted or Plain Text */}
              {((playerState.holeCards && playerState.holeCards.length > 0) || (encryptedHoleCards && encryptedHoleCards.length > 0)) && (
                <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 flex gap-3 z-0">
                  {/* Show decrypted cards if available */}
                  {decryptedHoleCards && decryptedHoleCards.length > 0 ? (
                    decryptedHoleCards.map((card, idx) => (
                      <div
                        key={`decrypted-${idx}`}
                        className={cn(
                          "w-20 h-28 md:w-24 md:h-36 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center relative border border-gray-300 transform hover:translate-y-[-20px] transition-all duration-300",
                          idx === 0 ? "-rotate-6" : "rotate-6"
                        )}
                      >
                        <span className={cn("font-black text-2xl absolute top-1.5 left-2.5", getSuitColor(card.suit))}>
                          {card.rank}
                        </span>
                        <span className={cn("material-symbols-outlined absolute top-2 right-2 text-sm italic opacity-40", getSuitColor(card.suit))}>
                          {getSuitIcon(card.suit)}
                        </span>
                        <span className={cn("material-symbols-outlined text-5xl", getSuitColor(card.suit))}>
                          {getSuitIcon(card.suit)}
                        </span>
                        {/* Arcium decrypted badge */}
                        <div className="absolute -top-2 -right-2 bg-primary/20 border border-primary/30 rounded-full px-1.5 py-0.5">
                          <span className="material-symbols-outlined text-[10px] text-primary">lock_open</span>
                        </div>
                      </div>
                    ))
                  ) : encryptedHoleCards && encryptedHoleCards.length > 0 ? (
                    // Show encrypted/locked cards
                    encryptedHoleCards.map((_, idx) => (
                      <div
                        key={`encrypted-${idx}`}
                        className={cn(
                          "w-20 h-28 md:w-24 md:h-36 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-xl shadow-2xl flex flex-col items-center justify-center relative border-2 border-dashed border-primary/30 transform hover:translate-y-[-20px] transition-all duration-300",
                          idx === 0 ? "-rotate-6" : "rotate-6"
                        )}
                      >
                        <span className="material-symbols-outlined text-4xl text-primary/40">lock</span>
                        <span className="text-[8px] text-primary/60 uppercase tracking-widest mt-2 font-bold">Arcium</span>
                        <span className="text-[6px] text-white/40 uppercase tracking-widest">Encrypted</span>

                        {/* Lock overlay animation */}
                        <div className="absolute inset-0 bg-primary/5 rounded-xl animate-pulse opacity-50"></div>
                      </div>
                    ))
                  ) : playerState.holeCards && playerState.holeCards.length > 0 ? (
                    // Fallback: Show plain cards (legacy mode)
                    playerState.holeCards.map((card, idx) => (
                      <div
                        key={`plain-${idx}`}
                        className={cn(
                          "w-20 h-28 md:w-24 md:h-36 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center relative border border-gray-300 transform hover:translate-y-[-20px] transition-all duration-300",
                          idx === 0 ? "-rotate-6" : "rotate-6"
                        )}
                      >
                        <span className={cn("font-black text-2xl absolute top-1.5 left-2.5", getSuitColor(card.suit))}>
                          {card.rank}
                        </span>
                        <span className={cn("material-symbols-outlined absolute top-2 right-2 text-sm italic opacity-40", getSuitColor(card.suit))}>
                          {getSuitIcon(card.suit)}
                        </span>
                        <span className={cn("material-symbols-outlined text-5xl", getSuitColor(card.suit))}>
                          {getSuitIcon(card.suit)}
                        </span>
                      </div>
                    ))
                  ) : null}
                </div>
              )}
            </div>

            {/* Hero Stats HUD */}
            <div className="glass-panel w-full bg-[#050a05]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl mb-8 flex flex-col md:flex-row items-center gap-8 border-t-2 border-t-primary/30">
              <div className="flex-1 flex flex-col gap-1 text-center md:text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Active Player</h4>
                  {/* Arcium Encryption Status Badge */}
                  {(encryptedHoleCards || encryptedDeck) && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      <span className="material-symbols-outlined text-[10px] text-primary">security</span>
                      <span className="text-[8px] font-black text-primary uppercase tracking-wider">
                        {decryptedHoleCards ? 'Decrypted' : 'Encrypted'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <span className="text-lg font-black text-white uppercase italic tracking-tighter">
                    {shortenAddress(publicKey?.toBase58() || '', 6)}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(7,204,0,0.8)]"></span>
                </div>
                <div className="text-primary font-black text-xl tracking-tighter mt-1">
                  {playerState.stack.toFixed(2)} <span className="text-[10px] opacity-60">USDC</span>
                </div>
                {playerState.currentBet > 0 && (
                  <div className="text-accentGold text-sm font-bold">
                    Current Bet: {playerState.currentBet.toFixed(2)} USDC
                  </div>
                )}
                {lastAction && (
                  <div className="text-white/60 text-xs">
                    Last: {lastAction}
                  </div>
                )}
              </div>

              {/* Betting Controls */}
              {canAct && availableActions.includes('Raise') && (
                <div className="flex-1 w-full max-w-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">
                    <span>Min: {table?.bigBlind || 0.01}</span>
                    <span className="text-accentGold">Pot Limit</span>
                    <span>Max: {playerState.stack.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    className="w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-primary"
                    min={table?.bigBlind || 0.01}
                    max={playerState.stack}
                    step={0.01}
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseFloat(e.target.value))}
                  />
                  <div className="text-center text-white font-mono text-sm">
                    {betAmount.toFixed(2)} USDC
                  </div>
                </div>
              )}

              {/* Buttons Grid */}
              <div className="w-full md:w-auto grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => handlePlayerAction('Fold')}
                  disabled={!canAct || !availableActions.includes('Fold')}
                  className="h-14 min-w-[100px] bg-danger hover:bg-danger/80 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 shadow-xl border-b-4 border-black/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Fold
                </button>
                <button
                  onClick={() => handlePlayerAction('Check')}
                  disabled={!canAct || !availableActions.includes('Check')}
                  className="h-14 min-w-[100px] bg-neutral-800 hover:bg-neutral-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 shadow-xl border-b-4 border-black/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check
                </button>
                <button
                  onClick={() => handlePlayerAction('Call')}
                  disabled={!canAct || !availableActions.includes('Call')}
                  className="h-14 min-w-[100px] bg-white hover:bg-white/90 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 shadow-xl border-b-4 border-black/20 flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Call</span>
                  <span className="text-[8px] opacity-60">{callAmount.toFixed(2)}</span>
                </button>
                <button
                  onClick={() => handlePlayerAction('Raise')}
                  disabled={!canAct || !availableActions.includes('Raise')}
                  className="h-14 min-w-[100px] bg-primary hover:bg-primaryHover text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(7,204,0,0.4)] border-b-4 border-black/40 flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Raise</span>
                  <span className="text-[8px] opacity-60">{betAmount.toFixed(2)}</span>
                </button>
              </div>
            </div>

            {/* Leave Table Button */}
            <button
              onClick={handleLeaveTable}
              disabled={!canLeave}
              className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              Leave Table
            </button>

            {/* Debug: Why buttons are disabled */}
            {disabledReason && isAtTable && (
              <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 mt-2">
                <span className="material-symbols-outlined text-sm">info</span>
                <span>{disabledReason}</span>
              </div>
            )}
          </div>
        )}

        {/* Ambient Background Spotlights */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[70vh] bg-primary/5 blur-[150px] rounded-full"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#B4E50D]/5 blur-[150px] rounded-full"></div>
        </div>
      </div>

      {/* Sidebar (Recent Hands) */}
      <aside className="w-80 border-l border-white/5 bg-[#0A0A0F]/50 backdrop-blur-xl hidden xl:flex flex-col z-20">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold text-white tracking-tighter flex items-center gap-2 uppercase text-sm">
            <span className="material-symbols-outlined text-gray-400 text-lg">history</span>
            Recent Hands
          </h3>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Live</span>
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
                    bet.playerWon ? "bg-primary/10 text-primary border-primary/20" : "bg-white/5 text-gray-400 border-white/10"
                  )}>
                    <span className="material-symbols-outlined text-sm">playing_cards</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-gray-500">
                      {shortenAddress(bet.player?.walletAddress || 'Unknown', 4)}
                    </span>
                    <span className="text-[11px] font-black text-white uppercase tracking-tighter">
                      {bet.resolvedAt ? 'Completed' : 'Active'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn("text-sm font-black tracking-tighter", bet.playerWon ? "text-primary" : "text-gray-500")}>
                    {((bet.payoutAmount || bet.amount) / 1_000_000_000).toFixed(2)} SOL
                  </div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase">
                    {bet.resolvedAt ? new Date(bet.resolvedAt).toLocaleTimeString() : 'Pending'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="material-symbols-outlined text-4xl mb-2">casino</span>
              <p className="text-sm">No recent hands</p>
              <p className="text-xs mt-1">Be the first to play!</p>
            </div>
          )}
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
