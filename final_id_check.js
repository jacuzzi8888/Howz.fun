const { PublicKey } = require('@solana/web3.js');
const fs = require('fs');

const file_id_map = {
    'house.fun/Anchor.toml': [
        '3mQcoeWan1JqBJRp6717NR7U8U87fujG2AjB4Pu8vu2s',
        'Dky8DpKsA4LgCMs1YFUPhrrvYE1C1FbwZeFjHSHzXzpzv',
        'GpFdMHcrcFusgR6JMnQVakfQvrXioEw3RJGrMFkBu7nW'
    ],
    'house.fun/programs/shadow-poker/Anchor.toml': ['3mQcoeWan1JqBJRp6717NR7U8U87fujG2AjB4Pu8vu2s'],
    'house.fun/programs/degen-derby/Anchor.toml': ['Dky8DpKsA4LgCMs1YFUPhrrvYE1C1FbwZeFjHSHzXzpzv'],
    'house.fun/programs/fight-club/Anchor.toml': ['GpFdMHcrcFusgR6JMnQVakfQvrXioEw3RJGrMFkBu7nW']
};

console.log("Checking ID Validity and Consistency...");

Object.entries(file_id_map).forEach(([file, ids]) => {
    ids.forEach(id => {
        try {
            new PublicKey(id);
            // Verify it exists in the file
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes(id)) {
                console.log(`[PASS] ${file} contains valid ID: ${id}`);
            } else {
                console.log(`[FAIL] ${file} DOES NOT contain ID: ${id}`);
            }
        } catch (err) {
            console.log(`[ERROR] Invalid ID ${id} in ${file}: ${err.message}`);
        }
    });
});
