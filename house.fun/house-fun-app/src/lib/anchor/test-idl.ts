
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';
import { SHADOW_POKER_IDL } from './shadow-poker-idl';
import { DEGEN_DERBY_IDL } from './degen-derby-idl';
import { FIGHT_CLUB_IDL } from './fight-club-idl';

const connection = new Connection("https://api.devnet.solana.com");
const wallet = {
    publicKey: Keypair.generate().publicKey,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
};
const provider = new AnchorProvider(connection, wallet as any, {});

console.log("Testing Shadow Poker IDL...");
try {
    const program = new Program(SHADOW_POKER_IDL as any, provider);
    console.log("Shadow Poker IDL loaded successfully.");
} catch (e) {
    console.error("Shadow Poker IDL Error:", e);
}

console.log("Testing Degen Derby IDL...");
try {
    const program = new Program(DEGEN_DERBY_IDL as any, provider);
    console.log("Degen Derby IDL loaded successfully.");
} catch (e) {
    console.error("Degen Derby IDL Error:", e);
}

console.log("Testing Fight Club IDL...");
try {
    // @ts-ignore
    const program = new Program(FIGHT_CLUB_IDL as any, provider);
    console.log("Fight Club IDL loaded successfully.");
} catch (e) {
    console.error("Fight Club IDL Error:", e);
}
