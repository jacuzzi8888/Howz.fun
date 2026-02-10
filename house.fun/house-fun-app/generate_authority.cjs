const { Keypair } = require("@solana/web3.js");
const fs = require("fs");

const keypair = Keypair.generate();
const secretKey = Array.from(keypair.secretKey);
fs.writeFileSync("authority.json", JSON.stringify(secretKey));

console.log("New Authority Address:", keypair.publicKey.toBase58());
console.log("Please fund this address with 0.1 SOL on Devnet.");
