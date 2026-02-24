import { Connection, PublicKey } from '@solana/web3.js';

async function main() {
    const connection = new Connection('https://api.devnet.solana.com');
    const pubkey = new PublicKey('7EgawZyB5YBDoa5MP2NgJ7FmPUKj7GVvL5ociDqVLgrX');
    const balance = await connection.getBalance(pubkey);
    console.log(`Balance for ${pubkey.toBase58()} is ${balance / 1e9} SOL`);

    const pda = PublicKey.findProgramAddressSync([Buffer.from('degen_derby_house')], new PublicKey('Bi47R2F3rkyDfvMHEUzyDXuv9TCFPJ3uzHpNCYPBMQeE'))[0];
    const houseInfo = await connection.getAccountInfo(pda);
    console.log(`House PDA ${pda.toBase58()} exists:`, !!houseInfo);
}

main().catch(console.error);
