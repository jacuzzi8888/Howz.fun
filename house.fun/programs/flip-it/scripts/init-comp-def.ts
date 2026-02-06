/**
 * Initialize Arcium Computation Definition
 * 
 * This script initializes the coin_flip computation definition on devnet.
 * Run this after deploying the program.
 * 
 * Usage:
 *   npx ts-node scripts/init-comp-def.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  getMXEAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as os from "os";

// Configuration
const PROGRAM_ID = process.env.PROGRAM_ID || "YOUR_PROGRAM_ID_HERE";
const NETWORK = process.env.NETWORK || "devnet";
const CLUSTER_OFFSET = 456; // v0.7.0

async function main() {
  console.log("🔧 Initializing Arcium Computation Definition");
  console.log("==============================================");
  console.log(`Program ID: ${PROGRAM_ID}`);
  console.log(`Network: ${NETWORK}`);
  console.log(`Cluster Offset: ${CLUSTER_OFFSET}`);
  console.log();

  // Setup connection
  const connection = new anchor.web3.Connection(
    NETWORK === "devnet" 
      ? "https://devnet.helius-rpc.com/?api-key=0e89ca71-766d-40cc-9628-5d709af0f2cc"
      : "https://api.mainnet-beta.solana.com",
    "confirmed"
  );

  // Load wallet
  const keypairPath = `${os.homedir()}/.config/solana/id.json`;
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")));
  const wallet = anchor.web3.Keypair.fromSecretKey(secretKey);
  
  console.log(`Deployer: ${wallet.publicKey.toString()}`);

  // Create provider
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load IDL
  const idlPath = "./target/idl/flip_it.json";
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  
  // Create program instance
  const program = new anchor.Program(idl, provider) as Program<any>;

  // Get computation definition offset
  const compDefOffset = Buffer.from(getCompDefAccOffset("coin_flip")).readUInt32LE();
  
  // Get accounts
  const mxeAccount = getMXEAccAddress(program.programId);
  const compDefAccount = getCompDefAccAddress(program.programId, compDefOffset);
  
  console.log();
  console.log("Accounts:");
  console.log(`  MXE Account: ${mxeAccount.toString()}`);
  console.log(`  Comp Def Account: ${compDefAccount.toString()}`);
  console.log();

  try {
    // Check if already initialized
    const compDefInfo = await connection.getAccountInfo(compDefAccount);
    if (compDefInfo) {
      console.log("✅ Computation definition already initialized!");
      console.log(`   Account size: ${compDefInfo.data.length} bytes`);
      return;
    }

    console.log("🚀 Initializing computation definition...");
    
    // Call init_coin_flip_comp_def
    const tx = await program.methods
      .initCoinFlipCompDef()
      .accounts({
        payer: wallet.publicKey,
        mxeAccount: mxeAccount,
        compDefAccount: compDefAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();

    console.log();
    console.log("✅ Success!");
    console.log(`   Transaction: ${tx}`);
    console.log(`   Comp Def: ${compDefAccount.toString()}`);
    console.log();
    console.log("View on Solana Explorer:");
    console.log(`   https://explorer.solana.com/tx/${tx}?cluster=${NETWORK}`);
    
  } catch (error: any) {
    console.error();
    console.error("❌ Error:");
    console.error(error.message);
    
    if (error.message.includes("already in use")) {
      console.error();
      console.log("💡 The computation definition is already initialized.");
      console.log("   You can proceed with testing.");
      process.exit(0);
    }
    
    process.exit(1);
  }
}

main();
