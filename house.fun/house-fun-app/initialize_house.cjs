const anchor = require("@coral-xyz/anchor");
const { Program, web3 } = anchor;
const fs = require("fs");

async function main() {
    const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
    // Use the NEW dedicated authority keypair
    const keypairPath = "authority.json";

    if (!fs.existsSync(keypairPath)) {
        throw new Error("Authority keypair not found at " + keypairPath);
    }

    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")));
    const keypair = web3.Keypair.fromSecretKey(secretKey);
    const wallet = new anchor.Wallet(keypair);

    console.log("Authority Address:", keypair.publicKey.toBase58());

    const balance = await connection.getBalance(keypair.publicKey);
    console.log("Authority Balance:", balance / 1e9, "SOL");

    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    const idlPath = "c:\\Users\\USER\\hackathon planning\\house.fun\\programs\\flip-it\\target\\idl\\flip_it.json";
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

    console.log("Program ID from IDL:", idl.address);

    const program = new Program(idl, provider);

    const [housePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("house")],
        program.programId
    );
    console.log("House PDA Target:", housePDA.toBase58());

    const accountInfo = await connection.getAccountInfo(housePDA);
    if (accountInfo) {
        console.log("House account already exists.");
        return;
    }

    if (balance < 0.01 * 1e9) {
        console.log("CRITICAL: Balance is too low to initialize house.");
        return;
    }

    console.log("Initializing Flip It House account...");
    try {
        const tx = await program.methods
            .initializeHouse()
            .accounts({
                house: housePDA,
                authority: keypair.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        console.log("Successfully initialized! Transaction signature:", tx);
    } catch (err) {
        console.error("Initialization failed:", err.message);
        if (err.logs) {
            console.log("Logs:");
            err.logs.forEach(l => console.log(l));
        }
    }
}

main().catch(console.error);
