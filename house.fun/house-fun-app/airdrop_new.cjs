const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const fs = require("fs");

async function main() {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync("authority.json", "utf-8")));
    const keypair = Keypair.fromSecretKey(secretKey);

    console.log("Authority Address:", keypair.publicKey.toBase58());

    console.log("Requesting airdrop...");
    try {
        const signature = await connection.requestAirdrop(keypair.publicKey, 0.5 * 1e9);
        await connection.confirmTransaction(signature, "confirmed");
        console.log("Airdrop successful!");
    } catch (e) {
        console.error("Airdrop failed:", e.message);
    }

    const balance = await connection.getBalance(keypair.publicKey);
    console.log("Current Balance:", balance / 1e9, "SOL");
}

main().catch(console.error);
