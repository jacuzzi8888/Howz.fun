
import { web3 } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5');

const [shadowPDA] = PublicKey.findProgramAddressSync([Buffer.from("shadow_poker_house")], PROGRAM_ID);
const [derbyPDA] = PublicKey.findProgramAddressSync([Buffer.from("degen_derby_house")], PROGRAM_ID);
const [fightPDA] = PublicKey.findProgramAddressSync([Buffer.from("fight_club_house")], PROGRAM_ID);

console.log("Shadow Poker House PDA:", shadowPDA.toBase58());
console.log("Degen Derby House PDA:", derbyPDA.toBase58());
console.log("Fight Club House PDA:", fightPDA.toBase58());
