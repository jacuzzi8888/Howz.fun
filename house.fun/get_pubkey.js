const fs = require('fs');
const { Keypair } = require('@solana/web3.js');

try {
    const keypairFile = process.argv[2];
    const secretKey = JSON.parse(fs.readFileSync(keypairFile, 'utf8'));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
    console.log(keypair.publicKey.toBase58());
} catch (err) {
    console.error(err);
    process.exit(1);
}
