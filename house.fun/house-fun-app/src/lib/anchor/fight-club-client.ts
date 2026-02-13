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
  tokenA: web3.PublicKey;
  tokenB: web3.PublicKey;
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

      const tx = await program.methods
        .initialize_house()
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
   * Create a new match between two tokens (admin only)
   */
  const createMatch = useCallback(async (
    tokenA: web3.PublicKey,
    tokenB: web3.PublicKey
  ): Promise<CreateMatchResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getFightClubHousePDA();
      const houseAccount = await (program.account as any).FightClubHouse.fetchNullable(housePDA);
      const matchIndex = houseAccount ? houseAccount.totalMatches.toNumber() : 0;
      const [matchPDA] = getMatchPDA(matchIndex);

      const tx = await program.methods
        .create_match(tokenA, tokenB)
        .accounts({
          match: matchPDA,
          house: housePDA,
          authority: wallet.publicKey,
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

      const tx = await program.methods
        .place_bet(new BN(lamports), sideNum)
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
   * Resolve a match and determine winner (admin only)
   */
  const resolveMatch = useCallback(async (
    matchPDA: web3.PublicKey,
    winnerSide: MatchSide
  ): Promise<MatchResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getFightClubHousePDA();
      const winnerNum = winnerSide === 'A' ? 0 : 1;

      const tx = await program.methods
        .resolve_match(winnerNum)
        .accounts({
          match: matchPDA,
          house: housePDA,
          authority: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        matchPDA,
        winner: winnerSide,
      };
    } catch (error) {
      throw new Error(parseFightClubError(error));
    }
  }, [program, wallet.publicKey]);

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

      const tx = await program.methods
        .claim_winnings()
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

      const tx = await program.methods
        .cancel_match()
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

      const tx = await program.methods
        .refund_bet()
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
        totalBetA: lamportsToSol(match.totalBetA.toNumber()),
        totalBetB: lamportsToSol(match.totalBetB.toNumber()),
        totalPlayersA: match.totalPlayersA,
        totalPlayersB: match.totalPlayersB,
        status: Object.keys(match.status)[0] as MatchStatus,
        winner: match.winner !== null ? (match.winner === 0 ? 'A' : 'B') : null,
        houseFee: lamportsToSol(match.houseFee.toNumber()),
        createdAt: match.createdAt.toNumber(),
        resolvedAt: match.resolvedAt !== null ? match.resolvedAt.toNumber() : null,
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
    createMatch,
    placeBet,
    resolveMatch,
    claimWinnings,
    cancelMatch,
    refundBet,
    fetchPlayerBet,
    fetchMatch,
    fetchHouse,
    calculatePotentialWinnings,
  };
}
