import { Connection, PublicKey } from '@solana/web3.js';
async function main() {
    const devnet = new Connection('https://api.devnet.solana.com');
    const mainnet = new Connection('https://api.mainnet-beta.solana.com');
    // Or checking Phantom's commonly used test wallet for this project:
    const pubkey = new PublicKey('7EgawZyB5YBDoa5MP2NgJ7FmPUKj7GVvL5ociDqVLgrX');

    const devBalance = await devnet.getBalance(pubkey).catch(() => 0);
    const mainBalance = await mainnet.getBalance(pubkey).catch(() => 0);

    console.log(`DEVNET:  ${devBalance / 1e9} SOL`);
    console.log(`MAINNET: ${mainBalance / 1e9} SOL`);
}
main().catch(console.error);
