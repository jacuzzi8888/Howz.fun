
import { web3 } from '@coral-xyz/anchor';
const { Keypair, Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } = web3;

const ADMIN_KEY = [56, 128, 45, 200, 32, 144, 77, 21, 190, 116, 4, 30, 86, 203, 123, 192, 209, 163, 85, 155, 82, 234, 139, 64, 99, 157, 63, 142, 97, 86, 28, 79, 118, 115, 217, 147, 23, 35, 84, 91, 144, 128, 74, 222, 62, 67, 220, 175, 32, 219, 120, 145, 71, 223, 128, 33, 163, 148, 52, 201, 66, 124, 126, 173];
const PROGRAM_ID = new PublicKey("7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5");

async function main() {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const adminKeypair = Keypair.fromSecretKey(new Uint8Array(ADMIN_KEY));

    const [housePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("shadow_poker_house")],
        PROGRAM_ID
    );

    console.log("House PDA:", housePDA.toBase58());

    // Anchor discriminator for initialize_house: [112, 146, 238, 68, 186, 143, 197, 129]
    const data = Buffer.from([112, 146, 238, 68, 186, 143, 197, 129]);

    const instruction = new TransactionInstruction({
        keys: [
            { pubkey: housePDA, isSigner: false, isWritable: true },
            { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: data,
    });

    const tx = new Transaction().add(instruction);
    try {
        const signature = await connection.sendTransaction(tx, [adminKeypair]);
        await connection.confirmTransaction(signature);
        console.log("Success! Signature:", signature);
    } catch (e: any) {
        console.error("Error:", e.message || e);
    }
}

main();
