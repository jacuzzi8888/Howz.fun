import { Program, web3, BN } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useMemo } from 'react';
import { type FightClub } from './fight-club-idl';
import {
  createFightClubProgram,
  createProvider,
  getFightClubHousePDA,
  getMatchPDA,
  getPlayerBetPDA,
  parseFightClubError,
  solToLamports,
  lamportsToSol,
  type MatchSide,
  type MatchStatus
} from './fight-club-utils';

export interface BetResult {
  signature: string;
  playerBetPDA: web3.PublicKey;
  matchPDA: web3.PublicKey;
  amount: number;
  side: MatchSide;
}

export interface ClaimResult {
  signature: string;
  winnings: number;
  playerBetPDA: web3.PublicKey;
}

export interface MatchResult {
  signature: string;
  matchPDA: web3.PublicKey;
  winner: MatchSide;
}

export interface CreateMatchResult {
  signature: string;
  matchPDA: web3.PublicKey;
  matchIndex: number;
}

export interface PlayerBetAccount {
  player: web3.PublicKey;
  matchIndex: number;
  amount: number;
  side: MatchSide;
  claimed: boolean;
  winnings: number;
}

export interface FightMatchAccount {
  index: number;
  tokenA: string;
  tokenB: string;
  feedIdA: number[];
  feedIdB: number[];
  startPriceA: number;
  startPriceB: number;
  endPriceA: number;
  endPriceB: number;
  totalBetA: number;
  totalBetB: number;
  totalPlayersA: number;
  totalPlayersB: number;
  status: MatchStatus;
  winner: MatchSide | null;
  houseFee: number;
  createdAt: number;
  resolvedAt: number | null;
}

export interface FightClubHouseAccount {
  authority: web3.PublicKey;
  treasury: number;
  totalMatches: number;
  totalVolume: number;
  houseFeeBps: number;
}

/**
 * Hook to interact with Fight Club smart contract
 */
export function useFightClubProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    const provider = createProvider(connection, wallet);
    return createFightClubProgram(provider);
  }, [connection, wallet]);

  /**
   * Initialize house (admin only)
   */
  const initializeHouse = useCallback(async (): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getFightClubHousePDA();

      const tx = await (program as any).methods
        .initializeHouse()
        .accounts({
          house: housePDA,
          authority: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseFightClubError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Create a new match between two tokens using Pyth feeds
   */
  const createMatchV2 = useCallback(async (
    tokenA: string,
    tokenB: string,
    feedIdA: number[],
    feedIdB: number[],
    priceUpdateA: web3.PublicKey,
    priceUpdateB: web3.PublicKey
  ): Promise<CreateMatchResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getFightClubHousePDA();
      const houseAccount = await (program.account as any).FightClubHouse.fetchNullable(housePDA);
      const matchIndex = houseAccount ? houseAccount.totalMatches.toNumber() : 0;
      const [matchPDA] = getMatchPDA(matchIndex);

      const tx = await (program as any).methods
        .createMatchV2(tokenA, tokenB, feedIdA, feedIdB)
        .accounts({
          fightMatch: matchPDA,
          house: housePDA,
          creator: wallet.publicKey,
          priceUpdateA,
          priceUpdateB,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        matchPDA,
        matchIndex,
      };
    } catch (error) {
      throw new Error(parseFightClubError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Place a bet on a match
   */
  const placeBet = useCallback(async (
    matchPDA: web3.PublicKey,
    matchIndex: number,
    amount: number,
    side: MatchSide
  ): Promise<BetResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getFightClubHousePDA();
      const [playerBetPDA] = getPlayerBetPDA(matchPDA, wallet.publicKey);

      const lamports = solToLamports(amount);
      const sideNum = side === 'A' ? 0 : 1;

      const tx = await (program as any).methods
        .placeBet(new BN(lamports), sideNum)
        .accounts({
          playerBet: playerBetPDA,
          match: matchPDA,
          house: housePDA,
          player: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        playerBetPDA,
        matchPDA,
        amount,
        side,
      };
    } catch (error) {
      throw new Error(parseFightClubError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Fetch player bet account data
   */
  const fetchPlayerBet = useCallback(async (
    playerBetPDA: web3.PublicKey
  ): Promise<PlayerBetAccount | null> => {
    if (!program) return null;

    try {
      const bet = await (program.account as any).PlayerBet.fetch(playerBetPDA);

      return {
        player: bet.player,
        matchIndex: bet.matchIndex.toNumber(),
        amount: lamportsToSol(bet.amount.toNumber()),
        side: bet.side === 0 ? 'A' : 'B',
        claimed: bet.claimed,
        winnings: lamportsToSol(bet.winnings.toNumber()),
      };
    } catch {
      return null;
    }
  }, [program]);

  /**
   * Fetch match account data
   */
  const fetchMatch = useCallback(async (
    matchPDA: web3.PublicKey
  ): Promise<FightMatchAccount | null> => {
    if (!program) return null;

    try {
      const match = await (program.account as any).FightMatch.fetch(matchPDA);

      return {
        index: match.index.toNumber(),
        tokenA: match.tokenA,
        tokenB: match.tokenB,
        feedIdA: match.feedIdA,
        feedIdB: match.feedIdB,
        startPriceA: match.startPriceA.toNumber(),
        startPriceB: match.startPriceB.toNumber(),
        endPriceA: match.endPriceA.toNumber(),
        endPriceB: match.endPriceB.toNumber(),
        totalBetA: lamportsToSol(match.totalBetA.toNumber()),
        totalBetB: lamportsToSol(match.totalBetB.toNumber()),
        totalPlayersA: match.playerCountA,
        totalPlayersB: match.playerCountB,
        status: Object.keys(match.status)[0] as MatchStatus,
        winner: match.winner !== null ? (match.winner === 0 ? 'A' : 'B') : null,
        houseFee: lamportsToSol(match.houseFee.toNumber()),
        createdAt: match.createdAtSlot.toNumber(),
        resolvedAt: match.resolvedAtSlot !== null ? match.resolvedAtSlot.toNumber() : null,
      };
    } catch {
      return null;
    }
  }, [program]);

  /**
   * Fetch house account data
   */
  const fetchHouse = useCallback(async (): Promise<FightClubHouseAccount | null> => {
    if (!program) return null;

    try {
      const [housePDA] = getFightClubHousePDA();
      const house = await (program.account as any).FightClubHouse.fetch(housePDA);

      return {
        authority: house.authority,
        treasury: lamportsToSol(house.treasury.toNumber()),
        totalMatches: house.totalMatches.toNumber(),
        totalVolume: lamportsToSol(house.totalVolume.toNumber()),
        houseFeeBps: house.houseFeeBps,
      };
    } catch {
      return null;
    }
  }, [program]);

  /**
   * Resolve a match using Pyth Price Feeds
   */
  const resolveWithPyth = useCallback(async (
    matchPDA: web3.PublicKey,
    priceUpdateA: web3.PublicKey,
    priceUpdateB: web3.PublicKey
  ): Promise<MatchResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getFightClubHousePDA();

      const tx = await (program as any).methods
        .resolveWithPyth()
        .accounts({
          fightMatch: matchPDA,
          house: housePDA,
          priceUpdateA,
          priceUpdateB,
          authority: wallet.publicKey,
        } as any)
        .rpc();

      const matchAccount = await fetchMatch(matchPDA);

      return {
        signature: tx,
        matchPDA,
        winner: matchAccount?.winner || 'A',
      };
    } catch (error) {
      throw new Error(parseFightClubError(error));
    }
  }, [program, wallet.publicKey, fetchMatch]);

  /**
   * Claim winnings from a resolved match
   */
  const claimWinnings = useCallback(async (
    matchPDA: web3.PublicKey,
    playerBetPDA: web3.PublicKey
  ): Promise<ClaimResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getFightClubHousePDA();

      const tx = await (program as any).methods
        .claimWinnings()
        .accounts({
          playerBet: playerBetPDA,
          match: matchPDA,
          house: housePDA,
          player: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      // Fetch updated bet to get winnings amount
      const betAccount = await (program.account as any).PlayerBet.fetch(playerBetPDA);

      return {
        signature: tx,
        winnings: lamportsToSol(betAccount.winnings.toNumber()),
        playerBetPDA,
      };
    } catch (error) {
      throw new Error(parseFightClubError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Cancel a match (admin only)
   */
  const cancelMatch = useCallback(async (
    matchPDA: web3.PublicKey
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getFightClubHousePDA();

      const tx = await (program as any).methods
        .cancelMatch()
        .accounts({
          match: matchPDA,
          house: housePDA,
          authority: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseFightClubError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Refund bet from a cancelled match
   */
  const refundBet = useCallback(async (
    matchPDA: web3.PublicKey,
    playerBetPDA: web3.PublicKey
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getFightClubHousePDA();

      const tx = await (program as any).methods
        .refundBet()
        .accounts({
          playerBet: playerBetPDA,
          match: matchPDA,
          house: housePDA,
          player: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseFightClubError(error));
    }
  }, [program, wallet.publicKey]);



  /**
   * Calculate potential winnings for a bet
   */
  const calculatePotentialWinnings = useCallback(async (
    matchPDA: web3.PublicKey,
    betAmount: number,
    side: MatchSide
  ): Promise<number> => {
    if (!program) return 0;

    try {
      const match = await fetchMatch(matchPDA);
      if (!match) return 0;

      const betLamports = solToLamports(betAmount);
      const totalPool = solToLamports(match.totalBetA + match.totalBetB) + betLamports;
      const winningPool = side === 'A'
        ? solToLamports(match.totalBetA) + betLamports
        : solToLamports(match.totalBetB) + betLamports;

      // House fee is 1% (100 bps)
      const houseFeeBps = 100;
      const houseFee = Math.floor(totalPool * houseFeeBps / 10000);
      const payoutPool = totalPool - houseFee;

      // Proportional winnings
      const playerShare = betLamports / winningPool;
      const winnings = Math.floor(payoutPool * playerShare);

      return lamportsToSol(winnings);
    } catch {
      return 0;
    }
  }, [program, fetchMatch]);

  return {
    program,
    isReady: !!program,
    initializeHouse,
    createMatchV2,
    placeBet,
    resolveWithPyth,
    claimWinnings,
    cancelMatch,
    refundBet,
    fetchPlayerBet,
    fetchMatch,
    fetchHouse,
    calculatePotentialWinnings,
  };
}
