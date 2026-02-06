import { Program, web3, BN } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useMemo } from 'react';
import { type FlipIt } from './idl';
import { 
  createFlipItProgram, 
  createProvider, 
  getHousePDA, 
  getBetPDA,
  generateCommitment,
  parseFlipItError,
  solToLamports 
} from './utils';

export interface BetResult {
  signature: string;
  betPDA: web3.PublicKey;
  commitment: Uint8Array;
  nonce: number;
}

export interface RevealResult {
  signature: string;
  outcome: 'HEADS' | 'TAILS';
  playerWon: boolean;
  payout: number;
}

export interface BetAccount {
  player: web3.PublicKey;
  amount: number;
  status: 'Committed' | 'Resolved' | 'Claimed';
  playerWins: boolean | null;
  payout: number;
}

/**
 * Hook to interact with Flip It smart contract
 * 
 * NOTE: This client uses the legacy Anchor IDL which expects snake_case method names.
 * The Rust program has been refactored for Arcium integration with camelCase methods,
 * but the IDL needs to be regenerated with:
 *   cd house.fun/programs/flip-it && anchor build && anchor idl init --filepath target/idl/flip_it.json <program_id>
 * 
 * After IDL regeneration, update this client to use the new Arcium methods:
 *   - initialize_house -> initializeHouse
 *   - init_coin_flip_comp_def (NEW) - one-time setup
 *   - place_bet -> placeBet (takes choice directly, no commitment)
 *   - request_flip (NEW) - queues Arcium computation
 *   - claim_winnings -> claimWinnings
 *   - deposit_treasury (NEW)
 */
export function useFlipItProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    const provider = createProvider(connection, wallet);
    return createFlipItProgram(provider);
  }, [connection, wallet]);

  /**
   * Initialize house (admin only)
   */
  const initializeHouse = useCallback(async (): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getHousePDA();
      
      const tx = await program.methods
        .initialize_house()
        .accounts({
          house: housePDA,
          authority: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseFlipItError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Place a bet with commitment (legacy method - pre-Arcium)
   */
  const placeBet = useCallback(async (
    amount: number,
    choice: 'HEADS' | 'TAILS'
  ): Promise<BetResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Generate random nonce
      const nonce = Math.floor(Math.random() * 1000000000);
      const choiceNum = choice === 'HEADS' ? 0 : 1;
      
      // Generate commitment
      const commitment = await generateCommitment(choiceNum, nonce);
      
      // Get PDAs
      const [housePDA] = getHousePDA();
      const houseAccount = await (program.account as any).House.fetchNullable(housePDA);
      const betIndex = houseAccount ? houseAccount.totalBets.toNumber() : 0;
      const [betPDA] = getBetPDA(wallet.publicKey, betIndex);
      
      // Convert amount to lamports
      const lamports = solToLamports(amount);

      // Send transaction
      const tx = await program.methods
        .place_bet(new BN(lamports), Array.from(commitment))
        .accounts({
          bet: betPDA,
          house: housePDA,
          player: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        betPDA,
        commitment,
        nonce,
      };
    } catch (error) {
      throw new Error(parseFlipItError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Reveal bet and resolve game (legacy method - uses on-chain randomness)
   * NOTE: This is exploitable and should not be used for real stakes.
   * Use Arcium integration (coming after IDL update) for provably fair flips.
   */
  const reveal = useCallback(async (
    betPDA: web3.PublicKey,
    choice: 'HEADS' | 'TAILS',
    nonce: number
  ): Promise<RevealResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getHousePDA();
      const choiceNum = choice === 'HEADS' ? 0 : 1;

      // Send reveal transaction
      const tx = await program.methods
        .reveal(choiceNum, new BN(nonce))
        .accounts({
          bet: betPDA,
          house: housePDA,
          player: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      // Fetch updated bet account
      const betAccount = await (program.account as any).Bet.fetch(betPDA);

      return {
        signature: tx,
        outcome: betAccount.outcome === 0 ? 'HEADS' : 'TAILS',
        playerWon: betAccount.playerWins,
        payout: betAccount.payout.toNumber() / web3.LAMPORTS_PER_SOL,
      };
    } catch (error) {
      throw new Error(parseFlipItError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Claim winnings from resolved bet
   */
  const claimWinnings = useCallback(async (
    betPDA: web3.PublicKey
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await program.methods
        .claim_winnings()
        .accounts({
          bet: betPDA,
          player: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseFlipItError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Fetch bet account data
   */
  const fetchBet = useCallback(async (
    betPDA: web3.PublicKey
  ): Promise<BetAccount | null> => {
    if (!program) return null;

    try {
      const bet = await (program.account as any).Bet.fetch(betPDA);
      
      return {
        player: bet.player,
        amount: bet.amount.toNumber() / web3.LAMPORTS_PER_SOL,
        status: Object.keys(bet.status)[0] as BetAccount['status'],
        playerWins: bet.playerWins,
        payout: bet.payout.toNumber() / web3.LAMPORTS_PER_SOL,
      };
    } catch {
      return null;
    }
  }, [program]);

  /**
   * Fetch house account data
   */
  const fetchHouse = useCallback(async () => {
    if (!program) return null;

    try {
      const [housePDA] = getHousePDA();
      const house = await (program.account as any).House.fetch(housePDA);
      
      return {
        authority: house.authority,
        treasury: house.treasury.toNumber() / web3.LAMPORTS_PER_SOL,
        totalBets: house.totalBets.toNumber(),
        totalVolume: house.totalVolume.toNumber() / web3.LAMPORTS_PER_SOL,
      };
    } catch {
      return null;
    }
  }, [program]);

  return {
    program,
    isReady: !!program,
    initializeHouse,
    placeBet,
    reveal,
    claimWinnings,
    fetchBet,
    fetchHouse,
  };
}
