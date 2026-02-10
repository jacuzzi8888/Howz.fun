import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { IDL } from "./src/lib/anchor/idl";

async function main() {
    const connection = new Connection("https://api.devnet.solana.com");
    const programId = new PublicKey("6rTzxEePi1mtqs1XXp5ao8Bk6iSXQzzbSayfCk3tdRKQ");

    const [housePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("house")],
        programId
    );

    console.log("Checking House PDA:", housePDA.toBase58());

    const accountInfo = await connection.getAccountInfo(housePDA);
    if (accountInfo) {
        console.log("House account exists!");
        console.log("Owner:", accountInfo.owner.toBase58());
        console.log("Data size:", accountInfo.data.length);
    } else {
        console.log("House account DOES NOT exist.");
    }
}

main().catch(console.error);
