import { Program, web3, BN } from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useMemo } from 'react';
import { useMagicBlock } from '~/lib/magicblock/MagicBlockContext';
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
export function useFlipItProgram(sessionKey?: web3.Keypair | null) {
  const { activeConnection, standardConnection } = useMagicBlock();
  const wallet = useWallet();

  // Program instance using the active connection (could be L1 or L2)
  const program = useMemo(() => {
    if (!wallet.publicKey && !sessionKey) return null;

    if (!sessionKey) {
      const hasSigningCapability = wallet.signTransaction || wallet.signAllTransactions;
      if (!hasSigningCapability) return null;
    }

    const provider = createProvider(activeConnection, wallet, sessionKey);
    return createFlipItProgram(provider);
  }, [activeConnection, wallet.publicKey, !!wallet.signTransaction, sessionKey]);

  // ALWAYS L1 instance for fetching persistent state
  const standardProgram = useMemo(() => {
    if (!wallet.publicKey && !sessionKey) return null;
    const provider = createProvider(standardConnection, wallet, sessionKey);
    return createFlipItProgram(provider);
  }, [standardConnection, wallet.publicKey, !!wallet.signTransaction, sessionKey]);

  /**
   * Initialize house (admin only)
   */
  const initializeHouse = useCallback(async (): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getHousePDA();

      const tx = await (program.methods as any)
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
   * Place a bet (Arcium-compatible)
   */
  const placeBet = useCallback(async (
    amount: number,
    choice: 'HEADS' | 'TAILS',
    betIndex?: number
  ): Promise<BetResult> => {
    if (!program || !wallet.publicKey || !standardProgram) {
      throw new Error('Wallet not connected');
    }

    try {
      const choiceBool = choice === 'HEADS';

      // Get PDAs
      const [housePDA] = getHousePDA();

      let finalBetIndex = betIndex;

      if (finalBetIndex === undefined) {
        // Resilient account fetching (try camelCase house and PascalCase House)
        const accountGate = (standardProgram.account as any).house || (standardProgram.account as any).House;
        const houseAccount = accountGate ? await accountGate.fetchNullable(housePDA) : null;
        finalBetIndex = houseAccount ? houseAccount.totalBets.toNumber() : 0;
      }

      const [betPDA] = getBetPDA(wallet.publicKey, finalBetIndex);

      // Convert amount to lamports
      const lamports = solToLamports(amount);

      // Send transaction
      const tx = await (program.methods as any)
        .place_bet(new BN(lamports), choiceBool)
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
        commitment: new Uint8Array(),
        nonce: 0,
      };
    } catch (error) {
      throw new Error(parseFlipItError(error));
    }
  }, [program, standardProgram, wallet.publicKey]);

  /**
   * Request Arcium Flip
   */
  const requestFlip = useCallback(async (
    betPDA: web3.PublicKey,
    computationOffset: number,
    userChoice: number[],
    pubKey: number[],
    nonce: number
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getHousePDA();

      const tx = await (program.methods as any)
        .flip(
          new BN(computationOffset),
          userChoice,
          pubKey,
          new BN(nonce)
        )
        .accounts({
          payer: wallet.publicKey,
          bet: betPDA,
          house: housePDA,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseFlipItError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Reveal is no longer a separate instruction.
   */
  const reveal = useCallback(async (
    _betPDA: web3.PublicKey,
    _choice: 'HEADS' | 'TAILS',
    _nonce: number
  ): Promise<RevealResult> => {
    throw new Error('Reveal instruction deprecated.');
  }, []);

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
      const tx = await (program.methods as any)
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
    const activeProg = program ?? standardProgram;
    if (!activeProg) return null;

    try {
      const accountGate = (activeProg.account as any).bet || (activeProg.account as any).Bet;
      if (!accountGate) return null;

      const bet = await accountGate.fetch(betPDA);

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
  }, [program, standardProgram]);

  /**
   * Fetch house account data
   */
  const fetchHouse = useCallback(async () => {
    if (!standardProgram) return null;

    try {
      const [housePDA] = getHousePDA();
      const accountGate = (standardProgram.account as any).house || (standardProgram.account as any).House;
      if (!accountGate) return null;

      const house = await accountGate.fetch(housePDA);

      return {
        authority: house.authority,
        treasury: house.treasury.toNumber() / web3.LAMPORTS_PER_SOL,
        totalBets: house.totalBets.toNumber(),
        totalVolume: house.totalVolume.toNumber() / web3.LAMPORTS_PER_SOL,
      };
    } catch (err) {
      console.error('[FlipIt] fetchHouse failed:', err);
      return null;
    }
  }, [standardProgram]);

  return {
    program,
    isReady: !!program,
    initializeHouse,
    placeBet,
    requestFlip,
    reveal,
    claimWinnings,
    fetchBet,
    fetchHouse,
  };
}
