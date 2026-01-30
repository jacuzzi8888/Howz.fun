import { Program, web3, BN } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useMemo } from 'react';
import { type ShadowPoker } from './shadow-poker-idl';
import { 
  createShadowPokerProgram, 
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
export function useShadowPokerProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    const provider = createProvider(connection, wallet);
    return createShadowPokerProgram(provider);
  }, [connection, wallet]);

  /**
   * Initialize house (admin only)
   */
  const initializeHouse = useCallback(async (): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getShadowPokerHousePDA();
      
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
      throw new Error(parseShadowPokerError(error));
    }
  }, [program, wallet.publicKey]);

  /**
   * Create a new poker table (admin only)
   */
  const createTable = useCallback(async (
    config: TableConfig
  ): Promise<CreateTableResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getShadowPokerHousePDA();
      const houseAccount = await (program.account as any).ShadowPokerHouse.fetchNullable(housePDA);
      const tableIndex = houseAccount ? houseAccount.totalTables.toNumber() : 0;
      const [tablePDA] = getTablePDA(tableIndex);
      
      const tx = await program.methods
        .create_table(
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
  }, [program, wallet.publicKey]);

  /**
   * Join a poker table
   */
  const joinTable = useCallback(async (
    tablePDA: web3.PublicKey,
    buyIn: number
  ): Promise<JoinTableResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [playerStatePDA] = getPlayerStatePDA(tablePDA, wallet.publicKey);
      
      const lamports = solToLamports(buyIn);

      const tx = await program.methods
        .join_table(new BN(lamports))
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
  }, [program, wallet.publicKey]);

  /**
   * Start a new hand (admin only)
   */
  const startHand = useCallback(async (
    tablePDA: web3.PublicKey
  ): Promise<StartHandResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getShadowPokerHousePDA();

      const tx = await program.methods
        .start_hand()
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
   * Post blind (small or big)
   */
  const postBlind = useCallback(async (
    tablePDA: web3.PublicKey,
    playerStatePDA: web3.PublicKey,
    blindType: BlindType
  ): Promise<string> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await program.methods
        .post_blind({ [blindType.toLowerCase()]: {} })
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
  }, [program, wallet.publicKey]);

  /**
   * Perform a player action (fold, check, call, raise, all-in)
   */
  const playerAction = useCallback(async (
    tablePDA: web3.PublicKey,
    playerStatePDA: web3.PublicKey,
    action: PlayerAction,
    amount: number = 0
  ): Promise<PlayerActionResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const actionArg = { [action.toLowerCase()]: {} };
      const lamports = solToLamports(amount);

      const tx = await program.methods
        .player_action(actionArg, new BN(lamports))
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
  }, [program, wallet.publicKey]);

  /**
   * Reveal community cards (admin only)
   */
  const revealCards = useCallback(async (
    tablePDA: web3.PublicKey,
    cards: Card[]
  ): Promise<RevealCardsResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await program.methods
        .reveal_cards(cards)
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
  }, [program, wallet.publicKey]);

  /**
   * Resolve showdown with winner (admin only)
   */
  const showdown = useCallback(async (
    tablePDA: web3.PublicKey,
    winnerIndex: number
  ): Promise<ShowdownResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [housePDA] = getShadowPokerHousePDA();

      const tx = await program.methods
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
  }, [program, wallet.publicKey]);

  /**
   * Leave table and withdraw remaining stack
   */
  const leaveTable = useCallback(async (
    tablePDA: web3.PublicKey,
    playerStatePDA: web3.PublicKey
  ): Promise<LeaveTableResult> => {
    if (!program || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Fetch player state to get remaining stack
      const playerState = await (program.account as any).PlayerState.fetch(playerStatePDA);
      const remainingStack = lamportsToSol(playerState.stack.toNumber());

      const tx = await program.methods
        .leave_table()
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
      const [housePDA] = getShadowPokerHousePDA();
      const lamports = solToLamports(amount);

      const tx = await program.methods
        .withdraw_treasury(new BN(lamports))
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
  }, [program, wallet.publicKey]);

  /**
   * Fetch player state account data
   */
  const fetchPlayerState = useCallback(async (
    playerStatePDA: web3.PublicKey
  ): Promise<PlayerStateAccount | null> => {
    if (!program) return null;

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
    } catch {
      return null;
    }
  }, [program]);

  /**
   * Fetch house account data
   */
  const fetchHouse = useCallback(async (): Promise<ShadowPokerHouseAccount | null> => {
    if (!program) return null;

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
      
      if (!table || !playerState || !playerState.isActive) return [];
      
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
    getPlayerPosition,
  };
}
