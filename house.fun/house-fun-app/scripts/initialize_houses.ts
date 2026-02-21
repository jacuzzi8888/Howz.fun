import { AnchorProvider, Wallet, web3 } from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { createShadowPokerProgram, getShadowPokerHousePDA } from '../src/lib/anchor/shadow-poker-utils';
import { createDegenDerbyProgram, getDegenDerbyHousePDA } from '../src/lib/anchor/degen-derby-utils';
import { createFightClubProgram, getFightClubHousePDA } from '../src/lib/anchor/fight-club-utils';

async function main() {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Load authority keypair
    const authorityKeypairPath = path.resolve(process.cwd(), 'authority.json');
    const secretKeyString = fs.readFileSync(authorityKeypairPath, 'utf8');
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const authority = Keypair.fromSecretKey(secretKey);

    const wallet = new Wallet(authority);
    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());

    console.log('Using authority:', authority.publicKey.toBase58());

    // Shadow Poker
    try {
        const shadowPokerProgram = createShadowPokerProgram(provider);
        const [spHousePda] = getShadowPokerHousePDA();
        console.log(`Shadow Poker PDA: ${spHousePda.toBase58()}`);

        // Check if initialized
        const spAccount = await connection.getAccountInfo(spHousePda);
        if (!spAccount) {
            console.log('Initializing Shadow Poker House...');
            const tx = await shadowPokerProgram.methods.initializeHouse().accounts({
                house: spHousePda,
                authority: authority.publicKey,
                systemProgram: web3.SystemProgram.programId,
            }).rpc();
            console.log('Success!', tx);
        } else {
            console.log('Shadow Poker House already initialized.');
        }
    } catch (e) {
        console.error('Shadow Poker Error:', e);
    }

    // Degen Derby
    try {
        const degenDerbyProgram = createDegenDerbyProgram(provider);
        const [ddHousePda] = getDegenDerbyHousePDA();
        console.log(`Degen Derby PDA: ${ddHousePda.toBase58()}`);

        const ddAccount = await connection.getAccountInfo(ddHousePda);
        if (!ddAccount) {
            console.log('Initializing Degen Derby House...');
            const tx = await degenDerbyProgram.methods.initializeHouse().accounts({
                house: ddHousePda,
                authority: authority.publicKey,
                systemProgram: web3.SystemProgram.programId,
            }).rpc();
            console.log('Success!', tx);
        } else {
            console.log('Degen Derby House already initialized.');
        }
    } catch (e) {
        console.error('Degen Derby Error:', e);
    }

    // Fight Club
    try {
        const fightClubProgram = createFightClubProgram(provider);
        const [fcHousePda] = getFightClubHousePDA();
        console.log(`Fight Club PDA: ${fcHousePda.toBase58()}`);

        const fcAccount = await connection.getAccountInfo(fcHousePda);
        if (!fcAccount) {
            console.log('Initializing Fight Club House...');
            const tx = await fightClubProgram.methods.initializeHouse().accounts({
                house: fcHousePda,
                authority: authority.publicKey,
                systemProgram: web3.SystemProgram.programId,
            }).rpc();
            console.log('Success!', tx);
        } else {
            console.log('Fight Club House already initialized.');
        }
    } catch (e) {
        console.error('Fight Club Error:', e);
    }
}

main().catch(console.error);
