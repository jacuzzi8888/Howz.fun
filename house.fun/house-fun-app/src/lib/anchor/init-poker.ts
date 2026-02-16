
import { AnchorProvider, Program, web3, web3 as solana } from '@coral-xyz/anchor';
import { SHADOW_POKER_IDL } from './shadow-poker-idl';

const ADMIN_KEY = [56, 128, 45, 200, 32, 144, 77, 21, 190, 116, 4, 30, 86, 203, 123, 192, 209, 163, 85, 155, 82, 234, 139, 64, 99, 157, 63, 142, 97, 86, 28, 79, 118, 115, 217, 147, 23, 35, 84, 91, 144, 128, 74, 222, 62, 67, 220, 175, 32, 219, 120, 145, 71, 223, 128, 33, 163, 148, 52, 201, 66, 124, 126, 173];
const SHADOW_POKER_ADDRESS = "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5";

async function main() {
    const connection = new solana.Connection("https://api.devnet.solana.com", "confirmed");
    const adminKeypair = solana.Keypair.fromSecretKey(new Uint8Array(ADMIN_KEY));
    const wallet = {
        publicKey: adminKeypair.publicKey,
        signTransaction: async (tx: solana.Transaction) => { tx.partialSign(adminKeypair); return tx; },
        signAllTransactions: async (txs: solana.Transaction[]) => txs.map(tx => { tx.partialSign(adminKeypair); return tx; }),
    };

    const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
    const program = new Program(SHADOW_POKER_IDL as any, provider);

    const [housePDA] = solana.PublicKey.findProgramAddressSync(
        [Buffer.from("shadow_poker_house")],
        new solana.PublicKey(SHADOW_POKER_ADDRESS)
    );

    console.log("Initializing Shadow Poker House at:", housePDA.toBase58());

    try {
        const tx = await program.methods
            .initialize_house()
            .accounts({
                house: housePDA,
                authority: adminKeypair.publicKey,
                systemProgram: solana.SystemProgram.programId,
            } as any)
            .rpc();
        console.log("Shadow Poker Initialized! TX:", tx);
    } catch (e: any) {
        if (e.message.includes("already in use")) {
            console.log("Shadow Poker House already exists.");
        } else {
            console.error("Failed to initialize Shadow Poker:", e);
        }
    }
}

main();
