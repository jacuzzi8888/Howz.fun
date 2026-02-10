const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const fs = require("fs");

async function main() {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const keypairPath = "c:\\Users\\USER\\hackathon planning\\house.fun\\programs\\flip-it\\target\\deploy\\flip_it-keypair.json";
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")));
    const keypair = Keypair.fromSecretKey(secretKey);

    console.log("Authority Address:", keypair.publicKey.toBase58());

    const balance = await connection.getBalance(keypair.publicKey);
    console.log("Balance:", balance / 1e9, "SOL");

    if (balance < 0.01 * 1e9) {
        console.log("Insufficient balance to initialize house.");
        return;
    }
}

main().catch(console.error);
