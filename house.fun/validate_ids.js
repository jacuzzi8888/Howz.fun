const { PublicKey } = require('@solana/web3.js');

const ids = [
    "3mQcoeWan1JqBJRp6717NR7U8U87fujG2AjB4Pu8vu2s",
    "Dky8DpKsA4LgCMs1YFUPhrvYE1C1FbwZeFjHSHzXzpzv",
    "GpFdMHcrcFusgR6JMnQVakfQvrXioEw3RJGrMFkBu7nW"
];

ids.forEach(id => {
    try {
        new PublicKey(id);
        console.log(`${id}: VALID`);
    } catch (err) {
        console.log(`${id}: INVALID - ${err.message}`);
    }
});
