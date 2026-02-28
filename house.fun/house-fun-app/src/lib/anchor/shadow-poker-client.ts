import { Program, web3, BN } from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useMemo } from 'react';
import { useMagicBlock } from '~/lib/magicblock/MagicBlockContext';
import {
  createDelegateInstruction,
  createCommitAndUndelegateInstruction,
  MAGIC_PROGRAM_ID,
  DELEGATION_PROGRAM_ID
} from '@magicblock-labs/ephemeral-rollups-sdk';
import { type ShadowPoker } from './shadow-poker-idl';
import {
  createShadowPokerProgram,
  SHADOW_POKER_PROGRAM_ID,
  createProvider,
  getShadowPokerHousePDA,
  getTablePDA,
  getPlayerStatePDA,
  parseShadowPokerError,
  solToLamports,
  lamportsToSol,
  cardToDisplay,
  type TableStatus,
  type BettingRound,
  type PlayerAction,
  type BlindType,
  type Card,
  type CardDisplay,
  type TableConfig
} from './shadow-poker-utils';

export interface JoinTableResult {
  signature: string;
  playerStatePDA: web3.PublicKey;
  tablePDA: web3.PublicKey;
  buyIn: number;
}

export interface CreateTableResult {
  signature: string;
  tablePDA: web3.PublicKey;
  tableIndex: number;
}

export interface StartHandResult {
  signature: string;
  tablePDA: web3.PublicKey;
}

export interface PlayerActionResult {
  signature: string;
  tablePDA: web3.PublicKey;
  action: PlayerAction;
  amount: number;
}

export interface RevealCardsResult {
  signature: string;
  tablePDA: web3.PublicKey;
  cards: CardDisplay[];
}

export interface ShowdownResult {
  signature: string;
  tablePDA: web3.PublicKey;
  winnerIndex: number;
  pot: number;
}

export interface LeaveTableResult {
  signature: string;
  playerStatePDA: web3.PublicKey;
  remainingStack: number;
}

// Arcium Encrypted Card Types
export interface EncryptedCardData {
  ciphertext: number[];
  playerPubkey: string;
  proofFragment: number[];
}

export interface EncryptedDeckData {
  commitment: string;
  cards: EncryptedCardData[];
  arciumProof: {
    computationId: string;
    outcome: number;
    proof: Uint8Array;
    publicInputs: Uint8Array;
    timestamp: number;
    clusterSignature: Uint8Array;
  };
}

export interface DealEncryptedCardsResult {
  signature: string;
  tablePDA: web3.PublicKey;
  playerEncryptedCards: EncryptedCardData[];
}

export interface ShowdownWithProofResult {
  signature: string;
  tablePDA: web3.PublicKey;
  winnerIndex: number;
  pot: number;
  revealedCards: CardDisplay[];
}

export interface PlayerStateAccount {
  player: web3.PublicKey;
  table: web3.PublicKey;
  stack: number;
  currentBet: number;
  isActive: boolean;
  hasActed: boolean;
  isAllIn: boolean;
  holeCards: CardDisplay[];
  position: number;
}

export interface TableAccount {
  index: number;
  minBuyIn: number;
  maxBuyIn: number;
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
  players: web3.PublicKey[];
  playerStates: web3.PublicKey[];
  pot: number;
  status: TableStatus;
  currentRound: BettingRound;
  dealerPosition: number;
  currentPlayerIndex: number;
  communityCards: CardDisplay[];
  currentBet: number;
  createdAt: number;
}

export interface ShadowPokerHouseAccount {
  authority: web3.PublicKey;
  treasury: number;
  totalTables: number;
  totalVolume: number;
  houseFeeBps: number;
}

/**
 * Hook to interact with Shadow Poker smart contract
 */
export function useShadowPokerProgram(sessionKey?: web3.Keypair | null) {
  const { activeConnection } = useMagicBlock();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey && !sessionKey) return null;

    // In session mode, we use the session key to sign.
    // Otherwise, we check for standard wallet capabilities.
    if (!sessionKey) {
      const hasSigningCapability = wallet.signTransaction || wallet.signAllTransactions;
      if (!hasSigningCapability) {
        console.warn('[ShadowPoker] Wallet signing capability not available yet');
        return null;
      }
    }

    const provider = createProvider(activeConnection, wallet, sessionKey);
    return createShadowPokerProgram(provider);
  }, [activeConnection, wallet, sessionKey]);

  /**
   * Initialize house (admin only)
   */
  const initializeHouse = useCallback(async (): Promise<string> => {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getShadowPokerHousePDA();

      const tx = await (program as any).methods
        .initializeHouse()
        .accounts({
          house: housePDA,
          authority: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
  }, [program, wallet.publicKey]);

  /**
   * Create a new poker table (admin only)
   */
  const createTable = useCallback(async (
    config: TableConfig
  ): Promise<CreateTableResult> => {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getShadowPokerHousePDA();
      const houseAccount = await (program.account as any).ShadowPokerHouse.fetchNullable(housePDA);
      const tableIndex = houseAccount ? houseAccount.totalTables.toNumber() : 0;
      const [tablePDA] = getTablePDA(tableIndex);

      const tx = await (program as any).methods
        .createTable(
          new BN(solToLamports(config.minBuyIn)),
          new BN(solToLamports(config.maxBuyIn)),
          new BN(solToLamports(config.smallBlind)),
          new BN(solToLamports(config.bigBlind)),
          config.maxPlayers
        )
        .accounts({
          table: tablePDA,
          house: housePDA,
          authority: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        tablePDA,
        tableIndex,
      };
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
  }, [program, wallet.publicKey]);

  /**
   * Join a poker table
   */
  const joinTable = useCallback(async (
    tablePDA: web3.PublicKey,
    buyIn: number
  ): Promise<JoinTableResult> => {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [playerStatePDA] = getPlayerStatePDA(tablePDA, wallet.publicKey);

      const lamports = solToLamports(buyIn);

      const tx = await (program as any).methods
        .joinTable(new BN(lamports))
        .accounts({
          player_state: playerStatePDA,
          table: tablePDA,
          player: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        playerStatePDA,
        tablePDA,
        buyIn,
      };
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
  }, [program, wallet.publicKey]);

  /**
   * Start a new hand (admin only)
   */
  const startHand = useCallback(async (
    tablePDA: web3.PublicKey
  ): Promise<StartHandResult> => {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getShadowPokerHousePDA();

      const tx = await (program as any).methods
        .startHand()
        .accounts({
          table: tablePDA,
          house: housePDA,
          authority: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        tablePDA,
      };
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Initialize the poker computation definition
   */
  const initPokerCompDef = useCallback(async (): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await (program as any).methods
        .initPokerCompDef()
        .accounts({
          payer: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
          // Other Arcium accounts handled by derive_mxe_pda etc. or provided via helper
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Deal encrypted cards using Arcium MPC
   */
  const dealEncryptedCards = useCallback(async (
    tablePDA: web3.PublicKey,
    computationOffset: BN,
    pubKey: number[],
    nonce: BN
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await (program as any).methods
        .dealEncryptedCards(computationOffset, pubKey, nonce)
        .accounts({
          payer: wallet.publicKey,
          table: tablePDA,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
  }, [program, wallet.publicKey]);


  /**
   * Showdown - determine winner and distribute pot using Arcium MPC
   */
  const showdownWithProof = useCallback(async (
    tablePDA: web3.PublicKey,
    computationOffset: BN,
    pubKey: number[],
    nonce: BN
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getShadowPokerHousePDA();

      const tx = await (program as any).methods
        .showdownWithProof(computationOffset, pubKey, nonce)
        .accounts({
          payer: wallet.publicKey,
          table: tablePDA,
          house: housePDA,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Post blind (small or big)
   */
  const postBlind = useCallback(async (
    tablePDA: web3.PublicKey,
    playerStatePDA: web3.PublicKey,
    blindType: BlindType
  ): Promise<string> => {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await (program as any).methods
        .postBlind({ [blindType]: {} })
        .accounts({
          player_state: playerStatePDA,
          table: tablePDA,
          player: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
  }, [program, wallet.publicKey]);

  /**
   * Perform a player action (fold, check, call, raise, all-in)
   */
  const playerAction = useCallback(async (
    tablePDA: web3.PublicKey,
    playerStatePDA: web3.PublicKey,
    action: PlayerAction,
    amount = 0
  ): Promise<PlayerActionResult> => {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const actionArg = { [action]: {} };
      const lamports = solToLamports(amount);

      const tx = await (program as any).methods
        .playerAction(actionArg, new BN(lamports))
        .accounts({
          player_state: playerStatePDA,
          table: tablePDA,
          player: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        tablePDA,
        action,
        amount,
      };
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
  }, [program, wallet.publicKey]);

  /**
   * Reveal community cards (admin only)
   */
  const revealCards = useCallback(async (
    tablePDA: web3.PublicKey,
    cards: Card[]
  ): Promise<RevealCardsResult> => {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await (program as any).methods
        .revealCards(cards)
        .accounts({
          table: tablePDA,
          authority: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        tablePDA,
        cards: cards.map(cardToDisplay),
      };
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
  }, [program, wallet.publicKey]);

  /**
   * Resolve showdown with winner (admin only)
   */
  const showdown = useCallback(async (
    tablePDA: web3.PublicKey,
    winnerIndex: number
  ): Promise<ShowdownResult> => {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getShadowPokerHousePDA();

      const tx = await (program as any).methods
        .showdown(winnerIndex)
        .accounts({
          table: tablePDA,
          house: housePDA,
          authority: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      // Fetch updated table to get pot amount
      const tableAccount = await (program.account as any).Table.fetch(tablePDA);

      return {
        signature: tx,
        tablePDA,
        winnerIndex,
        pot: lamportsToSol(tableAccount.pot.toNumber()),
      };
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
  }, [program, wallet.publicKey]);


  /**
   * Leave table and withdraw remaining stack
   */
  const leaveTable = useCallback(async (
    tablePDA: web3.PublicKey,
    playerStatePDA: web3.PublicKey
  ): Promise<LeaveTableResult> => {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Fetch player state to get remaining stack
      const playerState = await (program.account as any).PlayerState.fetch(playerStatePDA);
      const remainingStack = lamportsToSol(playerState.stack.toNumber());

      const tx = await (program as any).methods
        .leaveTable()
        .accounts({
          player_state: playerStatePDA,
          table: tablePDA,
          player: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return {
        signature: tx,
        playerStatePDA,
        remainingStack,
      };
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
  }, [program, wallet.publicKey]);

  /**
   * Withdraw treasury (admin only)
   */
  const withdrawTreasury = useCallback(async (
    amount: number
  ): Promise<string> => {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getShadowPokerHousePDA();
      const lamports = solToLamports(amount);

      const tx = await (program as any).methods
        .withdrawTreasury(new BN(lamports))
        .accounts({
          house: housePDA,
          authority: wallet.publicKey,
          system_program: web3.SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
  }, [program, wallet.publicKey]);

  /**
   * Fetch player state account data
   */
  const fetchPlayerState = useCallback(async (
    playerStatePDA: web3.PublicKey
  ): Promise<PlayerStateAccount | null> => {
    if (!program) return null;

    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    try {
      const state = await (program.account as any).PlayerState.fetch(playerStatePDA);

      return {
        player: state.player,
        table: state.table,
        stack: lamportsToSol(state.stack.toNumber()),
        currentBet: lamportsToSol(state.currentBet.toNumber()),
        isActive: state.isActive,
        hasActed: state.hasActed,
        isAllIn: state.isAllIn,
        holeCards: state.holeCards.map((c: Card) => cardToDisplay(c)),
        position: state.position,
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    } catch {
      return null;
    }
  }, [program]);

  /**
   * Fetch table account data
   */
  const fetchTable = useCallback(async (
    tablePDA: web3.PublicKey
  ): Promise<TableAccount | null> => {
    if (!program) return null;

    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    try {
      const table = await (program.account as any).Table.fetch(tablePDA);

      return {
        index: table.index.toNumber(),
        minBuyIn: lamportsToSol(table.minBuyIn.toNumber()),
        maxBuyIn: lamportsToSol(table.maxBuyIn.toNumber()),
        smallBlind: lamportsToSol(table.smallBlind.toNumber()),
        bigBlind: lamportsToSol(table.bigBlind.toNumber()),
        maxPlayers: table.maxPlayers,
        players: table.players,
        playerStates: table.playerStates,
        pot: lamportsToSol(table.pot.toNumber()),
        status: Object.keys(table.status)[0] as TableStatus,
        currentRound: Object.keys(table.currentRound)[0] as BettingRound,
        dealerPosition: table.dealerPosition,
        currentPlayerIndex: table.currentPlayerIndex,
        communityCards: table.communityCards.map((c: Card) => cardToDisplay(c)),
        currentBet: lamportsToSol(table.currentBet.toNumber()),
        createdAt: table.createdAt.toNumber(),
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    } catch {
      return null;
    }
  }, [program]);

  /**
   * Fetch house account data
   */
  const fetchHouse = useCallback(async (): Promise<ShadowPokerHouseAccount | null> => {
    if (!program) return null;

    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    try {
      const [housePDA] = getShadowPokerHousePDA();
      const house = await (program.account as any).ShadowPokerHouse.fetch(housePDA);

      return {
        authority: house.authority,
        treasury: lamportsToSol(house.treasury.toNumber()),
        totalTables: house.totalTables.toNumber(),
        totalVolume: lamportsToSol(house.totalVolume.toNumber()),
        houseFeeBps: house.houseFeeBps,
      };
      /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    } catch {
      return null;
    }
  }, [program]);

  /**
   * Check if it's the current player's turn
   */
  const isPlayerTurn = useCallback(async (
    tablePDA: web3.PublicKey,
    playerStatePDA: web3.PublicKey
  ): Promise<boolean> => {
    if (!program) return false;

    try {
      const table = await fetchTable(tablePDA);
      const playerState = await fetchPlayerState(playerStatePDA);

      if (!table || !playerState) return false;

      // Find player index in table
      const playerIndex = table.players.findIndex(
        p => p.toBase58() === playerState.player.toBase58()
      );

      return playerIndex === table.currentPlayerIndex;
    } catch {
      return false;
    }
  }, [program, fetchTable, fetchPlayerState]);

  /**
   * Get available actions for current player
   */
  const getAvailableActions = useCallback(async (
    tablePDA: web3.PublicKey,
    playerStatePDA: web3.PublicKey
  ): Promise<PlayerAction[]> => {
    if (!program) return [];

    try {
      const table = await fetchTable(tablePDA);
      const playerState = await fetchPlayerState(playerStatePDA);

      if (!table || !playerState?.isActive) return [];

      const actions: PlayerAction[] = ['Fold'];

      const callAmount = Math.max(0, table.currentBet - playerState.currentBet);

      if (callAmount === 0) {
        actions.push('Check');
      } else {
        actions.push('Call');
      }

      if (playerState.stack > callAmount) {
        actions.push('Raise');
      }

      if (playerState.stack > 0) {
        actions.push('AllIn');
      }

      return actions;
    } catch {
      return [];
    }
  }, [program, fetchTable, fetchPlayerState]);

  /**
   * Get player position at table
   */
  const getPlayerPosition = useCallback(async (
    tablePDA: web3.PublicKey,
    playerStatePDA: web3.PublicKey
  ): Promise<number | null> => {
    if (!program) return null;

    try {
      const table = await fetchTable(tablePDA);
      const playerState = await fetchPlayerState(playerStatePDA);

      if (!table || !playerState) return null;

      return table.players.findIndex(
        p => p.toBase58() === playerState.player.toBase58()
      );
    } catch {
      return null;
    }
  }, [program, fetchTable, fetchPlayerState]);

  /**
   * Delegate an account to the MagicBlock Ephemeral Rollup
   */
  const delegateAccount = useCallback(async (
    accountToDelegate: web3.PublicKey
  ): Promise<string> => {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    try {
      const ix = createDelegateInstruction({
        payer: wallet.publicKey,
        delegatedAccount: accountToDelegate,
        ownerProgram: SHADOW_POKER_PROGRAM_ID,
      });

      const tx = new web3.Transaction().add(ix);
      const signature = await wallet.sendTransaction(tx, activeConnection);
      await activeConnection.confirmTransaction(signature, 'confirmed');
      return signature;
    } catch (error) {
      throw new Error(`Delegation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [wallet, activeConnection]);

  /**
   * Undelegate an account from the MagicBlock Ephemeral Rollup
   */
  const undelegateAccount = useCallback(async (
    accountToUndelegate: web3.PublicKey
  ): Promise<string> => {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    try {
      const ix = createCommitAndUndelegateInstruction(
        wallet.publicKey,
        [accountToUndelegate]
      );

      const tx = new web3.Transaction().add(ix);
      const signature = await wallet.sendTransaction(tx, activeConnection);
      await activeConnection.confirmTransaction(signature, 'confirmed');
      return signature;
    } catch (error) {
      throw new Error(`Undelegation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [wallet, activeConnection]);

  /**
   * Program-specific Delegate Table
   */
  const delegateTable = useCallback(async (tablePDA: web3.PublicKey): Promise<string> => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected');
    try {
      const tx = await (program as any).methods
        .delegateTable()
        .accounts({
          table: tablePDA,
          payer: wallet.publicKey,
          delegationProgram: DELEGATION_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .rpc();
      return tx;
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Program-specific Undelegate Table
   */
  const undelegateTable = useCallback(async (tablePDA: web3.PublicKey): Promise<string> => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected');
    try {
      const tx = await (program as any).methods
        .undelegateTable()
        .accounts({
          table: tablePDA,
          payer: wallet.publicKey,
          delegationProgram: DELEGATION_PROGRAM_ID,
        } as any)
        .rpc();
      return tx;
    } catch (error) {
      throw new Error(parseShadowPokerError(error));
    }
  }, [program, wallet.publicKey]);

  return {
    program,
    isReady: !!program,
    initializeHouse,
    createTable,
    joinTable,
    startHand,
    postBlind,
    playerAction,
    revealCards,
    showdown,
    leaveTable,
    withdrawTreasury,
    fetchPlayerState,
    fetchTable,
    fetchHouse,
    isPlayerTurn,
    getAvailableActions,
    delegateAccount,
    undelegateAccount,
    initPokerCompDef,
    dealEncryptedCards,
    showdownWithProof,
    delegateTable,
    undelegateTable,
  };
}
