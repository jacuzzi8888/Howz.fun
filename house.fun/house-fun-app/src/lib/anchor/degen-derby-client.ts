import { Program, web3, BN } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useMemo } from 'react';
import { type DegenDerby } from './degen-derby-idl';
import {
  createDegenDerbyProgram,
  createProvider,
  getDegenDerbyHousePDA,
  getRacePDA,
  getPlayerBetPDA,
  parseDegenDerbyError,
  solToLamports,
  lamportsToSol,
  type RaceStatus,
  type Horse,
  type HorseData
} from './degen-derby-utils';

// Re-export types for consumers
export type { RaceStatus, Horse, HorseData };

export interface BetResult {
  signature: string;
  playerBetPDA: web3.PublicKey;
  racePDA: web3.PublicKey;
  amount: number;
  horseIndex: number;
}

export interface ClaimResult {
  signature: string;
  winnings: number;
  playerBetPDA: web3.PublicKey;
}

export interface RaceResult {
  signature: string;
  racePDA: web3.PublicKey;
  winnerHorseIndex: number;
}

export interface CreateRaceResult {
  signature: string;
  racePDA: web3.PublicKey;
  raceIndex: number;
}

export interface StartRaceResult {
  signature: string;
  racePDA: web3.PublicKey;
}

export interface PlayerBetAccount {
  player: web3.PublicKey;
  raceIndex: number;
  amount: number;
  horseIndex: number;
  claimed: boolean;
  winnings: number;
}

export interface RaceAccount {
  index: number;
  horses: Horse[];
  totalBets: number[];
  playerCounts: number[];
  status: RaceStatus;
  winner: number | null;
  houseFee: number;
  createdAt: number;
  startedAt: number | null;
  resolvedAt: number | null;
}

export interface DegenDerbyHouseAccount {
  authority: web3.PublicKey;
  treasury: number;
  totalRaces: number;
  totalVolume: number;
  houseFeeBps: number;
}

/**
 * Hook to interact with Degen Derby smart contract
 */
export function useDegenDerbyProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    const provider = createProvider(connection, wallet);
    return createDegenDerbyProgram(provider);
  }, [connection, wallet]);

  /**
   * Initialize house (admin only)
   */
  const initializeHouse = useCallback(async (): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getDegenDerbyHousePDA();

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
      throw new Error(parseDegenDerbyError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Create a new race with horses (admin only)
   */
  const createRace = useCallback(async (
    horses: HorseData[]
  ): Promise<CreateRaceResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getDegenDerbyHousePDA();
      const houseAccount = await (program.account as any).DegenDerbyHouse.fetchNullable(housePDA);
      const raceIndex = houseAccount ? houseAccount.totalRaces.toNumber() : 0;
      const [racePDA] = getRacePDA(raceIndex);

      const tx = await (program as any).methods
        .createRace(horses)
        .accounts({
          race: racePDA,
          house: housePDA,
          authority: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        racePDA,
        raceIndex,
      };
    } catch (error) {
      throw new Error(parseDegenDerbyError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Place a bet on a horse in a race
   */
  const placeBet = useCallback(async (
    racePDA: web3.PublicKey,
    raceIndex: number,
    amount: number,
    horseIndex: number
  ): Promise<BetResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getDegenDerbyHousePDA();
      const [playerBetPDA] = getPlayerBetPDA(racePDA, wallet.publicKey);

      const lamports = solToLamports(amount);

      const tx = await (program as any).methods
        .placeBet(new BN(lamports), horseIndex)
        .accounts({
          playerBet: playerBetPDA,
          race: racePDA,
          house: housePDA,
          player: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        playerBetPDA,
        racePDA,
        amount,
        horseIndex,
      };
    } catch (error) {
      throw new Error(parseDegenDerbyError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Start a race (admin only)
   */
  const startRace = useCallback(async (
    racePDA: web3.PublicKey
  ): Promise<StartRaceResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getDegenDerbyHousePDA();

      const tx = await (program as any).methods
        .startRace()
        .accounts({
          race: racePDA,
          house: housePDA,
          authority: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        racePDA,
      };
    } catch (error) {
      throw new Error(parseDegenDerbyError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Resolve a race with weighted random winner (admin only)
   */
  const resolveRace = useCallback(async (
    racePDA: web3.PublicKey
  ): Promise<RaceResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getDegenDerbyHousePDA();

      // Get recent blockhash for randomness
      const { blockhash } = await connection.getLatestBlockhash();
      const recentBlockhashAccount = new web3.PublicKey('7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5');

      const tx = await (program as any).methods
        .resolveRace()
        .accounts({
          race: racePDA,
          house: housePDA,
          authority: wallet.publicKey,
          recentBlockhashes: recentBlockhashAccount,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      // Fetch updated race account to get winner
      const raceAccount = await (program.account as any).Race.fetch(racePDA);

      return {
        signature: tx,
        racePDA,
        winnerHorseIndex: raceAccount.winner,
      };
    } catch (error) {
      throw new Error(parseDegenDerbyError(error));
    }
  }, [program, wallet.publicKey, connection]);

  /**
   * Claim winnings from a resolved race
   */
  const claimWinnings = useCallback(async (
    racePDA: web3.PublicKey,
    playerBetPDA: web3.PublicKey
  ): Promise<ClaimResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getDegenDerbyHousePDA();

      const tx = await (program as any).methods
        .claimWinnings()
        .accounts({
          playerBet: playerBetPDA,
          race: racePDA,
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
      throw new Error(parseDegenDerbyError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Cancel a race (admin only)
   */
  const cancelRace = useCallback(async (
    racePDA: web3.PublicKey
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getDegenDerbyHousePDA();

      const tx = await (program as any).methods
        .cancelRace()
        .accounts({
          race: racePDA,
          house: housePDA,
          authority: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseDegenDerbyError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Refund bet from a cancelled race
   */
  const refundBet = useCallback(async (
    racePDA: web3.PublicKey,
    playerBetPDA: web3.PublicKey
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getDegenDerbyHousePDA();

      const tx = await (program as any).methods
        .refundBet()
        .accounts({
          playerBet: playerBetPDA,
          race: racePDA,
          house: housePDA,
          player: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseDegenDerbyError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Withdraw treasury (admin only)
   */
  const withdrawTreasury = useCallback(async (
    amount: number
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getDegenDerbyHousePDA();
      const lamports = solToLamports(amount);

      const tx = await (program as any).methods
        .withdrawTreasury(new BN(lamports))
        .accounts({
          house: housePDA,
          authority: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseDegenDerbyError(error));
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
        raceIndex: bet.raceIndex.toNumber(),
        amount: lamportsToSol(bet.amount.toNumber()),
        horseIndex: bet.horseIndex,
        claimed: bet.claimed,
        winnings: lamportsToSol(bet.winnings.toNumber()),
      };
    } catch {
      return null;
    }
  }, [program]);

  /**
   * Fetch race account data
   */
  const fetchRace = useCallback(async (
    racePDA: web3.PublicKey
  ): Promise<RaceAccount | null> => {
    if (!program) return null;

    try {
      const race = await (program.account as any).Race.fetch(racePDA);

      return {
        index: race.index.toNumber(),
        horses: race.horses.map((h: any) => ({
          name: h.name,
          oddsNumerator: h.oddsNumerator,
          oddsDenominator: h.oddsDenominator,
        })),
        totalBets: race.totalBets.map((b: any) => lamportsToSol(b.toNumber())),
        playerCounts: race.playerCounts,
        status: Object.keys(race.status)[0] as RaceStatus,
        winner: race.winner !== null ? race.winner : null,
        houseFee: lamportsToSol(race.houseFee.toNumber()),
        createdAt: race.createdAt.toNumber(),
        startedAt: race.startedAt !== null ? race.startedAt.toNumber() : null,
        resolvedAt: race.resolvedAt !== null ? race.resolvedAt.toNumber() : null,
      };
    } catch {
      return null;
    }
  }, [program]);

  /**
   * Fetch house account data
   */
  const fetchHouse = useCallback(async (): Promise<DegenDerbyHouseAccount | null> => {
    if (!program) return null;

    try {
      const [housePDA] = getDegenDerbyHousePDA();
      const house = await (program.account as any).DegenDerbyHouse.fetch(housePDA);

      return {
        authority: house.authority,
        treasury: lamportsToSol(house.treasury.toNumber()),
        totalRaces: house.totalRaces.toNumber(),
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
    racePDA: web3.PublicKey,
    betAmount: number,
    horseIndex: number
  ): Promise<number> => {
    if (!program) return 0;

    try {
      const race = await fetchRace(racePDA);
      if (!race) return 0;

      const betLamports = solToLamports(betAmount);
      const currentBetsOnHorse = solToLamports(race.totalBets[horseIndex] || 0);
      const totalPool = race.totalBets.reduce((sum, bet) => sum + solToLamports(bet), 0) + betLamports;

      // Calculate new bets array with this bet added
      const newBetsOnHorse = currentBetsOnHorse + betLamports;
      const allBets = race.totalBets.map((bet, idx) =>
        idx === horseIndex ? newBetsOnHorse : solToLamports(bet)
      );

      // House fee is 1% (100 bps)
      const houseFeeBps = 100;
      const houseFee = Math.floor(totalPool * houseFeeBps / 10000);
      const payoutPool = totalPool - houseFee;

      // Calculate weighted odds (inverse of bet proportion)
      const totalInverseBets = allBets.reduce((sum, bet) => sum + (1 / Math.max(bet, 1)), 0);
      const horseInverseWeight = 1 / Math.max(newBetsOnHorse, 1);
      const oddsMultiplier = totalInverseBets / horseInverseWeight;

      // Proportional winnings
      const playerShare = betLamports / Math.max(newBetsOnHorse, 1);
      const winnings = Math.floor(playerShare * oddsMultiplier * payoutPool / totalPool);

      return lamportsToSol(winnings);
    } catch {
      return 0;
    }
  }, [program, fetchRace]);

  /**
   * Get current odds for all horses in a race
   */
  const getCurrentOdds = useCallback(async (
    racePDA: web3.PublicKey
  ): Promise<number[]> => {
    if (!program) return [];

    try {
      const race = await fetchRace(racePDA);
      if (!race) return [];

      const allBets = race.totalBets.map(bet => solToLamports(bet));
      const totalPool = allBets.reduce((sum, bet) => sum + bet, 0);

      if (totalPool === 0) {
        // If no bets yet, return initial odds from horse data
        return race.horses.map(h => h.oddsNumerator / h.oddsDenominator);
      }

      // Calculate inverse-weighted odds
      const totalInverseBets = allBets.reduce((sum, bet) => sum + (1 / Math.max(bet, 1)), 0);

      return allBets.map(bet => {
        const horseInverseWeight = 1 / Math.max(bet, 1);
        const oddsMultiplier = totalInverseBets / horseInverseWeight;

        // Apply house fee
        const houseFeeBps = 100;
        const houseFee = Math.floor(totalPool * houseFeeBps / 10000);
        const payoutPool = totalPool - houseFee;

        return (payoutPool / totalPool) * oddsMultiplier;
      });
    } catch {
      return [];
    }
  }, [program, fetchRace]);

  return {
    program,
    isReady: !!program,
    initializeHouse,
    createRace,
    placeBet,
    startRace,
    resolveRace,
    claimWinnings,
    cancelRace,
    refundBet,
    withdrawTreasury,
    fetchPlayerBet,
    fetchRace,
    fetchHouse,
    calculatePotentialWinnings,
    getCurrentOdds,
  };
}
