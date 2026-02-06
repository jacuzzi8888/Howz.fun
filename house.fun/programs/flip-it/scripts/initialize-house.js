/**
 * Initialize House Account
 * Run this after program deployment to create the house PDA
 * 
 * Usage: npx ts-node scripts/initialize-house.ts
 */

const anchor = require('@coral-xyz/anchor');
const { PublicKey, SystemProgram } = require('@solana/web3.js');

const PROGRAM_ID = new PublicKey('6rTzxEePi1mtqs1XXp5ao8Bk6iSXQzzbSayfCk3tdRKQ');

async function main() {
  console.log('🏠 Initializing House Account...\n');

  // Configure anchor to use the cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet;
  console.log(`Wallet: ${wallet.publicKey.toString()}`);

  // Create program instance
  const program = new anchor.Program(
    require('../target/idl/flip_it.json'), 
    PROGRAM_ID, 
    provider
  );

  // Derive house PDA
  const [housePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('house')],
    PROGRAM_ID
  );
  console.log(`House PDA: ${housePDA.toString()}`);

  // Check if house already exists
  const houseAccount = await provider.connection.getAccountInfo(housePDA);
  if (houseAccount) {
    console.log('\n✅ House account already initialized!');
    console.log(`   Address: ${housePDA.toString()}`);
    return;
  }

  try {
    // Initialize house
    console.log('\n📝 Sending initialize transaction...');
    
    const tx = await program.methods
      .initializeHouse()
      .accounts({
        house: housePDA,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('\n✅ House initialized successfully!');
    console.log(`   Transaction: ${tx}`);
    console.log(`   House PDA: ${housePDA.toString()}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

  } catch (error) {
    console.error('\n❌ Error initializing house:', error);
    throw error;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
