
const { Keypair, Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } = require('@solana/web3.js');

const ADMIN_KEY = [56, 128, 45, 200, 32, 144, 77, 21, 190, 116, 4, 30, 86, 203, 123, 192, 209, 163, 85, 155, 82, 234, 139, 64, 99, 157, 63, 142, 97, 86, 28, 79, 118, 115, 217, 147, 23, 35, 84, 91, 144, 128, 74, 222, 62, 67, 220, 175, 32, 219, 120, 145, 71, 223, 128, 33, 163, 148, 52, 201, 66, 124, 126, 173];
const PROGRAM_ID = new PublicKey("7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5");

async function main() {
    try {
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        const adminKeypair = Keypair.fromSecretKey(new Uint8Array(ADMIN_KEY));

        const [housePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("shadow_poker_house")],
            PROGRAM_ID
        );

        console.log("House PDA:", housePDA.toBase58());

        // discriminator [112, 146, 238, 68, 186, 143, 197, 129]
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

        const { blockhash } = await connection.getLatestBlockhash();
        const tx = new Transaction().add(instruction);
        tx.recentBlockhash = blockhash;
        tx.feePayer = adminKeypair.publicKey;

        tx.sign(adminKeypair);
        const signature = await connection.sendRawTransaction(tx.serialize());
        console.log("SUCCESS_SIGNATURE:", signature);

    } catch (e) {
        console.error("CATCH_ERROR:", e.message || e);
        process.exit(1);
    }
}

main();
