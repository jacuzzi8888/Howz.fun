import * as fs from 'fs';
import { DEGEN_DERBY_IDL } from './src/lib/anchor/degen-derby-idl';
import { FIGHT_CLUB_IDL } from './src/lib/anchor/fight-club-idl';
import { SHADOW_POKER_IDL } from './src/lib/anchor/shadow-poker-idl';

const files = [
    { idl: DEGEN_DERBY_IDL, name: 'DEGEN_DERBY_IDL', path: 'src/lib/anchor/degen-derby-idl.ts', typeName: 'DegenDerby' },
    { idl: FIGHT_CLUB_IDL, name: 'FIGHT_CLUB_IDL', path: 'src/lib/anchor/fight-club-idl.ts', typeName: 'FightClub' },
    { idl: SHADOW_POKER_IDL, name: 'SHADOW_POKER_IDL', path: 'src/lib/anchor/shadow-poker-idl.ts', typeName: 'ShadowPoker' }
];

for (const { idl, name, path, typeName } of files) {
    const mutIdl = JSON.parse(JSON.stringify(idl));

    if (mutIdl.accounts) {
        if (!mutIdl.types) mutIdl.types = [];
        mutIdl.accounts.forEach((acc: any) => {
            if (acc.type) {
                if (!mutIdl.types.find((t: any) => t.name === acc.name)) {
                    mutIdl.types.push({ name: acc.name, type: acc.type });
                }
                delete acc.type;
            }
        });
    }

    const content = `/**
 * Anchor IDL for ${typeName} Program
 * Auto-patched for Anchor 0.30+
 */

export const ${name} = ${JSON.stringify(mutIdl, null, 2)};

export type ${typeName} = typeof ${name};
`;

    fs.writeFileSync(path, content);
    console.log(`Successfully patched ${path}`);
}
