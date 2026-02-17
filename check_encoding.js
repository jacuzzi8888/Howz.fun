const fs = require('fs');

const files = [
    'house.fun/Anchor.toml',
    'house.fun/programs/shadow-poker/programs/shadow-poker/src/lib.rs',
    'house.fun/programs/degen-derby/programs/degen-derby/src/lib.rs',
    'house.fun/programs/fight-club/programs/fight-club/src/lib.rs'
];

files.forEach(file => {
    try {
        const buffer = fs.readFileSync(file);
        const isUTF16 = buffer[0] === 0xFF && buffer[1] === 0xFE || buffer[0] === 0xFE && buffer[1] === 0xFF;
        const hasBOM = buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
        console.log(`${file}: size=${buffer.length}, UTF16=${isUTF16}, BOM=${hasBOM}`);
    } catch (err) {
        console.log(`${file}: ERROR - ${err.message}`);
    }
});
