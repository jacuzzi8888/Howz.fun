/**
 * Initialize House Account Script
 * Run this once after deploying a new program
 * 
 * Usage: npx ts-node scripts/init-house.ts
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, web3, BN } from '@coral-xyz/anchor';
import { IDL } from '../src/lib/anchor/idl';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PROGRAM_ID = new PublicKey('6rTzxEePi1mtqs1XXp5ao8Bk6iSXQzzbSayfCk3tdRKQ');
const RPC_URL = 'https://devnet.helius-rpc.com/?api-key=0e89ca71-766d-40cc-9628-5d709af0f2cc';

// Load wallet from id.json (your deployer wallet)
function loadWallet(): Keypair {
  // Try to load from common locations
  const possiblePaths = [
    path.join(process.env.HOME || '', '.config/solana/id.json'),
    path.join(process.cwd(), 'wallet.json'),
    path.join(process.cwd(), '../wallet.json'),
    path.join(process.cwd(), '../../wallet.json'),
  ];
  
  for (const walletPath of possiblePaths) {
    if (fs.existsSync(walletPath)) {
      console.log(`Loading wallet from: ${walletPath}`);
      const secretKey = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
      return Keypair.fromSecretKey(new Uint8Array(secretKey));
    }
  }
  
  throw new Error('Wallet not found. Please provide wallet.json or set up ~/.config/solana/id.json');
}

async function main() {
  console.log('🏠 Initializing House Account...\n');
  
  try {
    // Setup connection
    const connection = new Connection(RPC_URL, 'confirmed');
    console.log(`✓ Connected to: ${RPC_URL}`);
    
    // Load wallet
    const wallet = loadWallet();
    console.log(`✓ Wallet loaded: ${wallet.publicKey.toString()}`);
    
    // Check balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`✓ Balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);
    
    if (balance < 0.01 * web3.LAMPORTS_PER_SOL) {
      throw new Error('Insufficient balance. Need at least 0.01 SOL for rent.');
    }
    
    // Setup provider
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: async (tx) => {
          if (tx instanceof web3.VersionedTransaction) {
            tx.sign([wallet]);
          } else {
            tx.partialSign(wallet);
          }
          return tx;
        },
        signAllTransactions: async (txs) => {
          return txs.map(tx => {
            if (tx instanceof web3.VersionedTransaction) {
              tx.sign([wallet]);
            } else {
              tx.partialSign(wallet);
            }
            return tx;
          });
        },
      },
      { commitment: 'confirmed' }
    );
    
    // Create program
    const program = new Program(IDL as any, provider);
    console.log(`✓ Program loaded: ${PROGRAM_ID.toString()}`);
    
    // Get House PDA
    const [housePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('house')],
      PROGRAM_ID
    );
    console.log(`✓ House PDA: ${housePDA.toString()}`);
    
    // Check if house already exists
    const houseAccount = await connection.getAccountInfo(housePDA);
    if (houseAccount) {
      console.log('\n✅ House account already initialized!');
      console.log(`   Address: ${housePDA.toString()}`);
      return;
    }
    
    // Initialize house
    console.log('\n📝 Sending initialize_house transaction...');
    
    if (!program.methods) {
      throw new Error('Program methods not available');
    }
    
    const tx = await (program.methods as any)
      .initialize_house()
      .accounts({
        house: housePDA,
        authority: wallet.publicKey,
        system_program: web3.SystemProgram.programId,
      } as any)
      .rpc();
    
    console.log('\n✅ House initialized successfully!');
    console.log(`   Transaction: ${tx}`);
    console.log(`   House PDA: ${housePDA.toString()}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
