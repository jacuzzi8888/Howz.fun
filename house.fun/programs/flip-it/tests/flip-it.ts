import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { x25519 } from "@noble/curves/ed25519";
import {
  RescueCipher,
  getArciumEnv,
  getMXEAccAddress,
  getClusterAccAddress,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  awaitComputationFinalization,
  getMXEPublicKeyWithRetry,
  deserializeLE,
} from "@arcium-hq/client";
import { randomBytes } from "crypto";
import os from "os";
import fs from "fs";

// Helper to read keypair from file
function readKpJson(path: string): anchor.web3.Keypair {
  const content = fs.readFileSync(path, "utf-8");
  const secretKey = Uint8Array.from(JSON.parse(content));
  return anchor.web3.Keypair.fromSecretKey(secretKey);
}

describe("Flip It - Arcium Integration", () => {
  // Configure provider
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.FlipIt as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  // Get Arcium environment
  const arciumEnv = getArciumEnv();
  const clusterOffset = arciumEnv.arciumClusterOffset;

  // Test accounts
  let owner: anchor.web3.Keypair;
  let player: anchor.web3.Keypair;
  let housePda: anchor.web3.PublicKey;

  before(async () => {
    // Load owner keypair
    owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);
    
    // Create player keypair with some SOL
    player = anchor.web3.Keypair.generate();
    
    // Airdrop SOL to player for testing
    const airdropSig = await provider.connection.requestAirdrop(
      player.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig, "confirmed");

    // Derive house PDA
    [housePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("house")],
      program.programId
    );
  });

  it("Initializes the house", async () => {
    try {
      const tx = await program.methods
        .initializeHouse()
        .accounts({
          house: housePda,
          authority: owner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" });

      console.log("House initialized:", tx);

      // Verify house account
      const house = await program.account.house.fetch(housePda);
      expect(house.authority.toString()).to.equal(owner.publicKey.toString());
      expect(house.treasury.toNumber()).to.equal(0);
      expect(house.totalBets.toNumber()).to.equal(0);
    } catch (e: any) {
      // House may already exist from previous test run
      if (!e.message.includes("already in use")) {
        throw e;
      }
      console.log("House already initialized");
    }
  });

  it("Initializes the coin_flip computation definition", async () => {
    console.log("Initializing coin_flip computation definition...");

    try {
      const tx = await program.methods
        .initCoinFlipCompDef()
        .accounts({
          payer: owner.publicKey,
          mxeAccount: getMXEAccAddress(program.programId),
          compDefAccount: getCompDefAccAddress(
            program.programId,
            Buffer.from(getCompDefAccOffset("coin_flip")).readUInt32LE()
          ),
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" });

      console.log("Computation definition initialized:", tx);
    } catch (e: any) {
      if (!e.message.includes("already in use")) {
        throw e;
      }
      console.log("Computation definition already initialized");
    }
  });

  it("Places a bet", async () => {
    const house = await program.account.house.fetch(housePda);
    const betAmount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);
    const choice = 0; // HEADS

    // Derive bet PDA
    const [betPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        player.publicKey.toBuffer(),
        house.totalBets.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const tx = await program.methods
      .placeBet(betAmount, choice)
      .accounts({
        bet: betPda,
        house: housePda,
        player: player.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([player])
      .rpc({ commitment: "confirmed" });

    console.log("Bet placed:", tx);

    // Verify bet account
    const bet = await program.account.bet.fetch(betPda);
    expect(bet.player.toString()).to.equal(player.publicKey.toString());
    expect(bet.amount.toNumber()).to.equal(betAmount.toNumber());
    expect(bet.choice).to.equal(choice);
    expect(bet.status).to.deep.equal({ placed: {} });
  });

  it("Requests a flip with Arcium MPC", async () => {
    // Get current bet
    const house = await program.account.house.fetch(housePda);
    const betIndex = house.totalBets.toNumber() - 1;

    const [betPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        player.publicKey.toBuffer(),
        new anchor.BN(betIndex).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const bet = await program.account.bet.fetch(betPda);

    // Setup Arcium encryption
    const privateKey = x25519.utils.randomPrivateKey();
    const publicKey = x25519.getPublicKey(privateKey);

    // Get MXE cluster's public key for encryption
    const mxePublicKey = await getMXEPublicKeyWithRetry(
      provider,
      program.programId
    );
    console.log("MXE x25519 pubkey:", Buffer.from(mxePublicKey).toString("hex"));

    // Create shared secret and cipher
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    // Encrypt the input values
    const nonce = randomBytes(16);
    const choice = BigInt(bet.choice);
    const betId = BigInt(betIndex);
    
    const ciphertexts = cipher.encrypt([choice, betId], nonce);

    // Generate computation offset
    const computationOffset = new anchor.BN(randomBytes(8), "hex");

    console.log("Requesting flip...");

    const tx = await program.methods
      .requestFlip(
        computationOffset,
        Array.from(ciphertexts[0]),
        Array.from(ciphertexts[1]),
        Array.from(publicKey),
        new anchor.BN(deserializeLE(nonce).toString())
      )
      .accountsPartial({
        player: player.publicKey,
        bet: betPda,
        house: housePda,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(clusterOffset),
        executingPool: getExecutingPoolAccAddress(clusterOffset),
        computationAccount: getComputationAccAddress(clusterOffset, computationOffset),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset("coin_flip")).readUInt32LE()
        ),
        clusterAccount: getClusterAccAddress(clusterOffset),
      })
      .signers([player])
      .rpc({ commitment: "confirmed" });

    console.log("Flip requested:", tx);

    // Wait for computation to finalize
    console.log("Waiting for MPC computation...");
    const finalizeSig = await awaitComputationFinalization(
      provider,
      computationOffset,
      program.programId,
      "confirmed"
    );
    console.log("Computation finalized:", finalizeSig);

    // Check bet result
    const resolvedBet = await program.account.bet.fetch(betPda);
    console.log("Bet result:", {
      choice: resolvedBet.choice === 0 ? "HEADS" : "TAILS",
      outcome: resolvedBet.outcome === 0 ? "HEADS" : "TAILS",
      playerWins: resolvedBet.playerWins,
      payout: resolvedBet.payout.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
    });

    expect(resolvedBet.status).to.deep.equal({ resolved: {} });
    expect(resolvedBet.outcome).to.be.oneOf([0, 1]);
  });

  it("Claims winnings", async () => {
    const house = await program.account.house.fetch(housePda);
    const betIndex = house.totalBets.toNumber() - 1;

    const [betPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        player.publicKey.toBuffer(),
        new anchor.BN(betIndex).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const bet = await program.account.bet.fetch(betPda);

    if (bet.playerWins) {
      const balanceBefore = await provider.connection.getBalance(player.publicKey);

      const tx = await program.methods
        .claimWinnings()
        .accounts({
          bet: betPda,
          player: player.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc({ commitment: "confirmed" });

      console.log("Winnings claimed:", tx);

      const balanceAfter = await provider.connection.getBalance(player.publicKey);
      console.log(
        "Player balance change:",
        (balanceAfter - balanceBefore) / anchor.web3.LAMPORTS_PER_SOL,
        "SOL"
      );

      const claimedBet = await program.account.bet.fetch(betPda);
      expect(claimedBet.status).to.deep.equal({ claimed: {} });
    } else {
      console.log("Player lost - no winnings to claim");
    }
  });
});
