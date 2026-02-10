import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import * as fs from "fs";
import * as path from "path";

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
    const programId = new web3.PublicKey("6rTzxEePi1mtqs1XXp5ao8Bk6iSXQzzbSayfCk3tdRKQ");

    // In Anchor 0.30+, the Program constructor signature might require the IDL as a specific type
    const program = new Program(idl as any, provider);

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

    console.log("Initializing Flip It House account...");
    try {
        // Try both camelCase and snake_case just in case
        const methods: any = program.methods;
        const initMethod = methods.initializeHouse || methods.initialize_house;

        if (!initMethod) {
            throw new Error("Could not find initialize_house or initializeHouse in IDL");
        }

        const tx = await initMethod()
            .accounts({
                house: housePDA,
                authority: keypair.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        console.log("Successfully initialized! Transaction signature:", tx);
    } catch (err: any) {
        console.error("Initialization failed:", err.message);
        if (err.logs) console.error("Logs:", err.logs);
    }
}

main().catch(console.error);
