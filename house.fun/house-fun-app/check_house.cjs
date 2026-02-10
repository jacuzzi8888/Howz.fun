const { Connection, PublicKey } = require("@solana/web3.js");

async function main() {
    const connection = new Connection("https://api.devnet.solana.com");
    // Correct Program ID from IDL
    const programId = new PublicKey("BWGSySnUGc9GRW4KdesmNAzp9Y2KoCioUfrz1Q5cdcqu");

    const [housePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("house")],
        programId
    );

    console.log("Checking House PDA:", housePDA.toBase58());

    try {
        const accountInfo = await connection.getAccountInfo(housePDA);
        if (accountInfo) {
            console.log("House account exists!");
            console.log("Owner:", accountInfo.owner.toBase58());
            console.log("Data size:", accountInfo.data.length);
        } else {
            console.log("House account DOES NOT exist.");
        }
    } catch (e) {
        console.error("Error fetching account info:", e.message);
    }
}

main().catch(console.error);
