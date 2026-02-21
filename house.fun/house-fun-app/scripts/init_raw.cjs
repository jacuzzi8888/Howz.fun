const web3 = require("@solana/web3.js");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const authorityKeypairPath = path.resolve(__dirname, "../authority.json");
const authRaw = fs.readFileSync(authorityKeypairPath, "utf8");
const authority = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(authRaw)));
const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");

function getDiscriminator(name) {
    return crypto.createHash('sha256').update(name).digest().slice(0, 8);
}
const initData = getDiscriminator("global:initialize_house");

const SHADOW_POKER_ID = new web3.PublicKey("5YScsLMogjS2JHeXPfQjxEHoAK17RGMCauo1rj343RWD");
const DEGEN_DERBY_ID = new web3.PublicKey("Bi47R2F3rkyDfvMHEUzyDXuv9TCFPJ3uzHpNCYPBMQeE");
const FIGHT_CLUB_ID = new web3.PublicKey("9cdERKti1DeD4pmspjfk1ePqtoze5FwrDzERdnDBWB9Z");

async function initHouse(programId, seedStr) {
    const [pda] = web3.PublicKey.findProgramAddressSync([Buffer.from(seedStr)], programId);
    console.log(`Initializing ${seedStr}: ${pda.toBase58()}`);

    const acc = await connection.getAccountInfo(pda);
    if (acc) {
        console.log("Already initialized.");
        return;
    }

    const ix = new web3.TransactionInstruction({
        programId,
        keys: [
            { pubkey: pda, isSigner: false, isWritable: true },
            { pubkey: authority.publicKey, isSigner: true, isWritable: true },
            { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        data: initData
    });

    const tx = new web3.Transaction().add(ix);
    tx.feePayer = authority.publicKey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    tx.sign(authority);
    const sig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction({
        signature: sig,
        blockhash,
        lastValidBlockHeight
    });
    console.log("Success! Signature:", sig);
}

async function main() {
    console.log("Authority:", authority.publicKey.toBase58());
    await initHouse(SHADOW_POKER_ID, "shadow_poker_house");
    await initHouse(DEGEN_DERBY_ID, "degen_derby_house");
    await initHouse(FIGHT_CLUB_ID, "fight_club_house");
}
main().catch(console.error);
