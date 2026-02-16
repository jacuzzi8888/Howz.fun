
import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
import { SHADOW_POKER_IDL } from './shadow-poker-idl';
import { DEGEN_DERBY_IDL } from './degen-derby-idl';
import { FIGHT_CLUB_IDL } from './fight-club-idl';

const NEW_ADMIN_KEY = [235, 67, 17, 252, 153, 87, 201, 214, 31, 5, 15, 230, 20, 131, 220, 202, 103, 116, 161, 251, 92, 8, 37, 89, 105, 147, 135, 139, 22, 172, 2, 180, 185, 116, 98, 145, 99, 196, 136, 108, 254, 222, 183, 41, 17, 188, 184, 21, 49, 31, 20, 16, 66, 44, 188, 237, 205, 29, 246, 28, 9, 156, 88, 195];
const CONNECTION_URL = "https://api.devnet.solana.com";

async function initialize() {
    const connection = new web3.Connection(CONNECTION_URL, "confirmed");
    const adminKeypair = web3.Keypair.fromSecretKey(new Uint8Array(NEW_ADMIN_KEY));
    console.log("Using Wallet:", adminKeypair.publicKey.toBase58());

    const wallet = {
        publicKey: adminKeypair.publicKey,
        signTransaction: async (tx: web3.Transaction) => { tx.partialSign(adminKeypair); return tx; },
        signAllTransactions: async (txs: web3.Transaction[]) => txs.map(tx => { tx.partialSign(adminKeypair); return tx; }),
    };

    const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });

    // 1. Shadow Poker
    const shadowPokerProgram = new Program(SHADOW_POKER_IDL as any, provider);
    console.log("SP Methods:", Object.keys(shadowPokerProgram.methods));
    const [spHousePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("shadow_poker_house")],
        new web3.PublicKey("6rTzxEePi1mtqs1XXp5ao8Bk6iSXQzzbSaYfCk3tdRKQ")
    );
    console.log("SP House PDA:", spHousePDA.toBase58());

    try {
        const tx = await shadowPokerProgram.methods.initialize_house().accounts({
            house: spHousePDA,
            authority: adminKeypair.publicKey,
            systemProgram: web3.SystemProgram.programId,
        } as any).rpc();
        console.log("Shadow Poker Initialized! TX:", tx);
    } catch (e: any) {
        console.log("SP Init Error (might already exist):", e.message || e);
    }

    // 2. Degen Derby
    const derbyProgram = new Program(DEGEN_DERBY_IDL as any, provider);
    const [derbyHousePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("degen_derby_house")],
        new web3.PublicKey("G1qaWMRahGRqNRSPF1NSKRFeokyvPUsTEYF58sVTph38")
    );
    console.log("Derby House PDA:", derbyHousePDA.toBase58());
    try {
        const tx = await derbyProgram.methods.initialize_house().accounts({
            house: derbyHousePDA,
            authority: adminKeypair.publicKey,
            systemProgram: web3.SystemProgram.programId,
        } as any).rpc();
        console.log("Degen Derby Initialized! TX:", tx);
    } catch (e: any) {
        console.log("Derby Init Error:", e.message || e);
    }

    // 3. Fight Club
    const fightClubProgram = new Program(FIGHT_CLUB_IDL as any, provider);
    const [fcHousePDA] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("fight_club_house")],
        new web3.PublicKey("AVVzy9JxsarZ7DvXwUDZFwpFH1RYJEJBperCcE15TsGN")
    );
    console.log("FC House PDA:", fcHousePDA.toBase58());
    try {
        const tx = await fightClubProgram.methods.initialize_house().accounts({
            house: fcHousePDA,
            authority: adminKeypair.publicKey,
            systemProgram: web3.SystemProgram.programId,
        } as any).rpc();
        console.log("Fight Club Initialized! TX:", tx);
    } catch (e: any) {
        console.log("FC Init Error:", e.message || e);
    }
}

initialize();
