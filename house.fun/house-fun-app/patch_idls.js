const fs = require('fs');

const idlFiles = [
    { file: 'src/lib/anchor/degen-derby-idl.ts', exportName: 'DEGEN_DERBY_IDL' },
    { file: 'src/lib/anchor/fight-club-idl.ts', exportName: 'FIGHT_CLUB_IDL' },
    { file: 'src/lib/anchor/shadow-poker-idl.ts', exportName: 'SHADOW_POKER_IDL' },
];

for (const { file, exportName } of idlFiles) {
    let content = fs.readFileSync(file, 'utf8');

    // We must evaluate the object so we can mutate it
    // The files export a const object and have some types at the bottom.
    // We'll extract only the JSON part.
    const jsonMatch = content.match(new RegExp(`export const ${exportName} = ({[\\s\\S]*?});\\s*export type`)) ||
        content.match(new RegExp(`export const ${exportName} = ({[\\s\\S]*?});\\s*$`));

    if (!jsonMatch) {
        console.log('Failed to match JSON in', file);
        continue;
    }

    const jsonStr = jsonMatch[1];
    let idl;
    try {
        idl = eval('(' + jsonStr + ')');
    } catch (e) {
        console.error('Eval failed for', file, e);
        continue;
    }

    // Migrate
    if (idl.accounts) {
        if (!idl.types) idl.types = [];

        for (const acc of idl.accounts) {
            if (acc.type) {
                // Check if already in types
                if (!idl.types.find(t => t.name === acc.name)) {
                    idl.types.push({ name: acc.name, type: acc.type });
                }
                delete acc.type;
            }
        }
    }

    const newJsonStr = JSON.stringify(idl, null, 2);
    // Be careful with replacing: the json string might contain special regex chars.
    const newContent = content.replace(jsonStr, newJsonStr);

    fs.writeFileSync(file, newContent);
    console.log(`Patched ${file}`);
}
