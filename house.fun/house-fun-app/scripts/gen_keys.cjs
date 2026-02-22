const web3 = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");

const keysDir = path.join(__dirname, "../../deploy/keys");
if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
}

function genAndSave(name) {
    const kp = web3.Keypair.generate();
    fs.writeFileSync(path.join(keysDir, `${name}-keypair.json`), JSON.stringify(Array.from(kp.secretKey)));
    console.log(`${name}: ${kp.publicKey.toBase58()}`);
}

genAndSave("shadow_poker");
genAndSave("degen_derby");
genAndSave("fight_club");
