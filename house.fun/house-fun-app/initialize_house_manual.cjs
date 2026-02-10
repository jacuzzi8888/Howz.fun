const anchor = require("@coral-xyz/anchor");
const { Program, web3 } = anchor;
const fs = require("fs");

async function main() {
    const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
    const keypairPath = "c:\\Users\\USER\\hackathon planning\\house.fun\\programs\\flip-it\\target\\deploy\\flip_it-keypair.json";
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")));
    const keypair = web3.Keypair.fromSecretKey(secretKey);
    const wallet = new anchor.Wallet(keypair);

    console.log("Authority Address:", keypair.publicKey.toBase58());

    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    const idlPath = "c:\\Users\\USER\\hackathon planning\\house.fun\\programs\\flip-it\\target\\idl\\flip_it.json";
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
    const program = new Program(idl, provider);

    const [housePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("house")],
        program.programId
    );
    console.log("House PDA Target:", housePDA.toBase58());

    console.log("Constructing transaction manually...");

    // instruction name in IDL is initialize_house
    // discriminator is [180, 46, 86, 125, 135, 107, 214, 28]
    const discriminator = Buffer.from([180, 46, 86, 125, 135, 107, 214, 28]);

    const ix = new web3.TransactionInstruction({
        programId: program.programId,
        keys: [
            { pubkey: housePDA, isSigner: false, isWritable: true },
            { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
            { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: discriminator,
    });

    const tx = new web3.Transaction().add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = keypair.publicKey;

    console.log("Signing and sending...");
    try {
        const signature = await web3.sendAndConfirmTransaction(connection, tx, [keypair]);
        console.log("Successfully initialized! Transaction signature:", signature);
    } catch (err) {
        console.error("Manual initialization failed:", err.message);
        if (err.logs) {
            console.log("Logs:");
            err.logs.forEach(l => console.log(l));
        }
    }
}

main().catch(console.error);
