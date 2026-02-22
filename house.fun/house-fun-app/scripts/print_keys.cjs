const web3 = require('@solana/web3.js');
const fs = require('fs');

const files = [
    'target/deploy/shadow_poker-keypair.json',
    'target/deploy/degen_derby-keypair.json',
    'target/deploy/fight_club-keypair.json'
];

files.forEach(file => {
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(file, 'utf8')));
    const keypair = web3.Keypair.fromSecretKey(secretKey);
    console.log(`${file} -> ${keypair.publicKey.toBase58()}`);
});
