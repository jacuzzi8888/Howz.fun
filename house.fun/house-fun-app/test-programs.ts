import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';
import { createShadowPokerProgram } from './src/lib/anchor/shadow-poker-utils';
import { createFightClubProgram } from './src/lib/anchor/fight-club-utils';
import { createDegenDerbyProgram } from './src/lib/anchor/degen-derby-utils';

async function test() {
    const connection = new Connection('https://api.devnet.solana.com');
    const provider = new AnchorProvider(connection, new Wallet(Keypair.generate()), AnchorProvider.defaultOptions());

    try { console.log('Testing SP'); createShadowPokerProgram(provider); console.log('SP OK'); } catch (e) { console.error('SP ERR', e) }
    try { console.log('Testing FC'); createFightClubProgram(provider); console.log('FC OK'); } catch (e) { console.error('FC ERR', e) }
    try { console.log('Testing DD'); createDegenDerbyProgram(provider); console.log('DD OK'); } catch (e) { console.error('DD ERR', e) }
}
test();
