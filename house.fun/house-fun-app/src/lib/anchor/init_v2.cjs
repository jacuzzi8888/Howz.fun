
const { Keypair, Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } = require('@solana/web3.js');
const { AnchorProvider, Program } = require('@coral-xyz/anchor');

const NEW_ADMIN_KEY = [190, 96, 6, 158, 228, 19, 150, 247, 202, 26, 184, 10, 102, 65, 129, 193, 215, 132, 69, 103, 196, 161, 222, 57, 165, 236, 249, 94, 68, 3, 148, 55, 92, 167, 110, 98, 111, 131, 237, 52, 173, 225, 184, 110, 213, 69, 182, 105, 221, 161, 202, 161, 234, 66, 147, 90, 153, 57, 151, 63, 43, 251, 184, 236];
const PROGRAM_ID_STR = "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5";

// We'll use the IDLs we have in the project
const fs = require('fs');
const path = require('path');

async function main() {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const adminKeypair = Keypair.fromSecretKey(new Uint8Array(NEW_ADMIN_KEY));
    console.log("Authority:", adminKeypair.publicKey.toBase58());

    const wallet = {
        publicKey: adminKeypair.publicKey,
        signTransaction: async (tx) => { tx.partialSign(adminKeypair); return tx; },
        signAllTransactions: async (txs) => txs.map(tx => { tx.partialSign(adminKeypair); return tx; }),
    };

    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });

    // Constants for seeds
    const SEEDS = {
        SP: "shadow_poker_house",
        DERBY: "degen_derby_house",
        FC: "fight_club_house"
    };

    // Instruction discriminators (Anchor standard: first 8 bytes of sha256("global:initialize_house"))
    const DISCRIMINATOR = Buffer.from([112, 146, 238, 68, 186, 143, 197, 129]);

    const games = [
        { name: "Shadow Poker", seed: SEEDS.SP },
        { name: "Degen Derby", seed: SEEDS.DERBY },
        { name: "Fight Club", seed: SEEDS.FC }
    ];

    for (const game of games) {
        console.log(`\n--- Initializing ${game.name} ---`);
        const [housePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from(game.seed)],
            new PublicKey(PROGRAM_ID_STR)
        );
        console.log(`House PDA: ${housePDA.toBase58()}`);

        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: housePDA, isSigner: false, isWritable: true },
                { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ],
            programId: new PublicKey(PROGRAM_ID_STR),
            data: DISCRIMINATOR,
        });

        try {
            const { blockhash } = await connection.getLatestBlockhash();
            const tx = new Transaction().add(instruction);
            tx.recentBlockhash = blockhash;
            tx.feePayer = adminKeypair.publicKey;

            const simulation = await connection.simulateTransaction(tx);
            if (simulation.value.err) {
                console.error(`Error initializing ${game.name}:`, simulation.value.err);
                console.error("Logs:", simulation.value.logs);
            } else {
                const signature = await connection.sendTransaction(tx, [adminKeypair]);
                console.log(`Success! ${game.name} Signature: ${signature}`);
            }
        } catch (e) {
            if (e.message && e.message.includes("already in use")) {
                console.log(`${game.name} House already exists.`);
            } else if (e.logs) {
                console.error(`Error initializing ${game.name}:`, e.message);
                console.error("Logs:", e.logs);
            } else {
                console.error(`Error initializing ${game.name}:`, e.message || e);
            }
        }
    }
}

main();
