import { AnchorProvider, Program, web3, type Wallet } from '@coral-xyz/anchor';
import { type FlipIt, IDL } from './idl';

// Program ID from deployment - uses env var with fallback
export const PROGRAM_ID = new web3.PublicKey(
  process.env.NEXT_PUBLIC_FLIP_IT_PROGRAM_ID || 'BWGSySnUGc9GRW4KdesmNAzp9Y2KoCioUfrz1Q5cdcqu'
);

// House PDA seeds
export const HOUSE_SEED = Buffer.from('house');
export const BET_SEED = Buffer.from('bet');

// Minimal wallet interface for provider
interface WalletAdapter {
  publicKey: web3.PublicKey | null;
  signTransaction: ((tx: web3.Transaction) => Promise<web3.Transaction>) | undefined;
  signAllTransactions?: (txs: web3.Transaction[]) => Promise<web3.Transaction[]>;
}

/**
 * Create Anchor Provider from wallet connection
 */
export function createProvider(
  connection: web3.Connection,
  wallet: WalletAdapter,
  sessionKey?: web3.Keypair | null
): AnchorProvider {
  const finalWallet = sessionKey
    ? {
      publicKey: sessionKey.publicKey,
      signTransaction: async (tx: web3.Transaction) => {
        tx.partialSign(sessionKey);
        return tx;
      },
      signAllTransactions: async (txs: web3.Transaction[]) => {
        return txs.map((tx) => {
          tx.partialSign(sessionKey);
          return tx;
        });
      },
    }
    : wallet;

  return new AnchorProvider(
    connection,
    finalWallet as Wallet,
    AnchorProvider.defaultOptions()
  );
}

/**
 * Create Flip It program instance
 */
export function createFlipItProgram(provider: AnchorProvider): Program<any> {
  return new Program(IDL as any, provider);
}

/**
 * Get House PDA address
 */
export function getHousePDA(): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [HOUSE_SEED],
    PROGRAM_ID
  );
}

/**
 * Get Bet PDA address for a player
 */
export function getBetPDA(player: web3.PublicKey, betIndex: number): [web3.PublicKey, number] {
  return web3.PublicKey.findProgramAddressSync(
    [
      BET_SEED,
      player.toBuffer(),
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(betIndex)]).buffer))
    ],
    PROGRAM_ID
  );
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.round(sol * web3.LAMPORTS_PER_SOL);
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / web3.LAMPORTS_PER_SOL;
}

/**
 * Generate commitment hash for choice + nonce
 * Returns SHA-256 hash as Uint8Array
 */
export async function generateCommitment(choice: 0 | 1, nonce: number): Promise<Uint8Array> {
  const data = new Uint8Array(9);
  data[0] = choice;

  // Write nonce as 8 bytes (little-endian)
  const view = new DataView(data.buffer);
  view.setBigUint64(1, BigInt(nonce), true);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Flip It Program Error Codes
 */
export const FlipItErrors: Record<number, string> = {
  6000: 'Bet amount too small (minimum 0.001 SOL)',
  6001: 'Bet amount too large (maximum 100 SOL)',
  6002: 'Unauthorized player',
  6003: 'Invalid bet status',
  6004: 'Reveal timeout reached',
  6005: 'Invalid reveal - commitment mismatch',
  6006: 'Bet not resolved yet',
  6007: 'Timeout not reached yet',
  6008: 'Unauthorized house authority',
  6009: 'Insufficient treasury balance',
};

interface FlipItProgramError {
  code?: number;
  message?: string;
}

function isProgramError(err: unknown): err is FlipItProgramError {
  return typeof err === 'object' && err !== null;
}

/**
 * Parse Flip It program error
 */
export function parseFlipItError(error: unknown): string {
  if (!isProgramError(error)) {
    return 'Unknown error occurred';
  }

  if (error.code) {
    const errorMsg = FlipItErrors[error.code];
    if (errorMsg) {
      return errorMsg;
    }
  }

  if (error.message) {
    return error.message;
  }

  return 'Unknown error occurred';
}
