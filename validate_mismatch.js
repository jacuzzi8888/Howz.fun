const { PublicKey } = require('@solana/web3.js');

const ids = [
    "Dky8DpKsA4LgCMs1YFUPhrrvYE1C1FbwZeFjHSHzXzpzv", // Double r (Root Anchor.toml)
    "Dky8DpKsA4LgCMs1YFUPhrvYE1C1FbwZeFjHSHzXzpzv"  // Single r (Program Anchor.toml & lib.rs)
];

ids.forEach(id => {
    try {
        new PublicKey(id);
        console.log(`${id}: VALID (${id.length} chars)`);
    } catch (err) {
        console.log(`${id}: INVALID (${id.length} chars) - ${err.message}`);
    }
});
