import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Manually fetch IDLs since target/idl is missing
import { IDL as ShadowPokerIdl } from "../programs/shadow-poker/programs/shadow-poker/src/idl.ts" // Need to see if idl is available. 

// Actually, wait! In Anchor workspace, `anchor.workspace` has the programs!
// Let's use anchor.workspace.

describe("Initialize PDAs", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    it("Initializes all houses", async () => {
        // Programs
        const shadowPoker = anchor.workspace.ShadowPoker as Program<any>;
        const degenDerby = anchor.workspace.DegenDerby as Program<any>;
        const fightClub = anchor.workspace.FightClub as Program<any>;

        const provider = anchor.getProvider() as anchor.AnchorProvider;
        const authority = provider.wallet.publicKey;

        console.log("Using authority:", authority.toBase58());

        // Initialize Shadow Poker
        try {
            const [spHousePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("shadow_poker_house")],
                shadowPoker.programId
            );
            console.log("Initializing Shadow Poker Pda:", spHousePda.toBase58());
            await shadowPoker.methods.initializeHouse().accounts({
                house: spHousePda,
                authority,
                systemProgram: anchor.web3.SystemProgram.programId,
            }).rpc();
            console.log("Success -> Shadow Poker");
        } catch (e) { console.log(e.message); }

        // Initialize Degen Derby
        try {
            const [ddHousePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("degen_derby_house")],
                degenDerby.programId
            );
            console.log("Initializing Degen Derby Pda:", ddHousePda.toBase58());
            await degenDerby.methods.initializeHouse().accounts({
                house: ddHousePda,
                authority,
                systemProgram: anchor.web3.SystemProgram.programId,
            }).rpc();
            console.log("Success -> Degen Derby");
        } catch (e) { console.log(e.message); }

        // Initialize Fight Club
        try {
            const [fcHousePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("fight_club_house")],
                fightClub.programId
            );
            console.log("Initializing Fight Club Pda:", fcHousePda.toBase58());
            await fightClub.methods.initializeHouse().accounts({
                house: fcHousePda,
                authority,
                systemProgram: anchor.web3.SystemProgram.programId,
            }).rpc();
            console.log("Success -> Fight Club");
        } catch (e) { console.log(e.message); }
    });
});
