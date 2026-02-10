const { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } = require("@solana/web3.js");
const fs = require("fs");

async function main() {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    // Load source (program keypair)
    const sourcePath = "c:\\Users\\USER\\hackathon planning\\house.fun\\programs\\flip-it\\target\\deploy\\flip_it-keypair.json";
    const sourceKey = Uint8Array.from(JSON.parse(fs.readFileSync(sourcePath, "utf-8")));
    const sourceKeypair = Keypair.fromSecretKey(sourceKey);

    // Load destination (new authority)
    const destSecret = Uint8Array.from(JSON.parse(fs.readFileSync("authority.json", "utf-8")));
    const destKeypair = Keypair.fromSecretKey(destSecret);

    console.log("Source Address:", sourceKeypair.publicKey.toBase58());
    console.log("Dest Address:", destKeypair.publicKey.toBase58());

    const sourceBalance = await connection.getBalance(sourceKeypair.publicKey);
    console.log("Source Balance:", sourceBalance / 1e9, "SOL");

    if (sourceBalance < 0.6 * 1e9) {
        console.log("Insufficient source balance to transfer.");
        return;
    }

    console.log("Transferring 0.5 SOL...");
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: sourceKeypair.publicKey,
            toPubkey: destKeypair.publicKey,
            lamports: 0.5 * 1e9,
        })
    );

    try {
        const signature = await sendAndConfirmTransaction(connection, transaction, [sourceKeypair]);
        console.log("Transfer successful! Signature:", signature);
    } catch (e) {
        console.error("Transfer failed:", e.message);
    }
}

main().catch(console.error);
