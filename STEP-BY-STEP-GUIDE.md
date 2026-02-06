# 🚀 COMPLETE STEP-BY-STEP DEPLOYMENT GUIDE

**Goal:** Deploy Flip It with Arcium MPC to Solana Devnet  
**Time Required:** 15-20 minutes (first time)  
**Cost:** $0 (100% free tier)  
**Difficulty:** Easy (just follow steps)

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites Check](#step-0-prerequisites-check)
2. [Open Terminal](#step-1-open-terminal)
3. [Navigate to Project](#step-2-navigate-to-project)
4. [Make Script Executable](#step-3-make-script-executable)
5. [Run Deployment](#step-4-run-deployment)
6. [Monitor Progress](#step-5-monitor-progress)
7. [Verify Deployment](#step-6-verify-deployment)
8. [Test the Program](#step-7-test-the-program)
9. [Update Frontend](#step-8-update-frontend)
10. [Troubleshooting](#troubleshooting)

---

## STEP 0: PREREQUISITES CHECK

Before starting, ensure you have:

### ✅ Requirement 1: WSL2 (Windows Users Only)

**Check if you have WSL2:**
```powershell
# Open PowerShell as Administrator and run:
wsl --version
```

**If you see version info** → You have WSL2 ✅  
**If you see "not recognized"** → Install WSL2:

```powershell
# In PowerShell as Administrator:
wsl --install

# Restart your computer when prompted
# After restart, Ubuntu will open and ask you to create a username/password
```

**macOS/Linux users:** Skip this step (you're already good!)

---

### ✅ Requirement 2: Solana Wallet

**Check if wallet exists:**
```bash
ls ~/.config/solana/id.json
```

**If file exists** → You have a wallet ✅  
**If "No such file"** → Create one:

```bash
# Install Solana CLI first
curl -sSfL https://release.anza.xyz/stable/install | bash

# Add to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Create wallet
solana-keygen new

# When prompted:
# - Leave passphrase empty (press Enter twice)
# - Save the recovery phrase somewhere safe (optional for hackathon)
```

**Get your wallet address:**
```bash
solana address
# Example output: 7EgawZyB5YBDoaMP2NgJ7FmPUKj7GVvL5ociDqVLgrX
```

**Write this down!** You'll need it for the faucet.

---

### ✅ Requirement 3: Devnet SOL (Money for Deployment)

Deployments cost SOL (even on devnet it's free, but you need the tokens).

**Check your balance:**
```bash
solana balance
```

**If you see "0 SOL" or less than 2 SOL, get free SOL:**

**Option A: Command Line (Easiest)**
```bash
solana airdrop 2
# Wait for confirmation
solana balance
```

**Option B: Web Faucet (If command fails)**
1. Go to https://faucet.solana.com/
2. Paste your wallet address (from `solana address`)
3. Select "Devnet"
4. Click "Request Airdrop"
5. Wait 30 seconds
6. Check balance again: `solana balance`

**You need at least 2 SOL.** If you have less, run airdrop again.

---

## STEP 1: OPEN TERMINAL

### Windows (WSL2):
```powershell
# Option 1: From PowerShell
wsl

# Option 2: Open "Ubuntu" from Start Menu
```

### macOS:
```bash
# Open Terminal app (Cmd + Space, type "Terminal")
# OR use iTerm if you have it
```

### Linux:
```bash
# Open your terminal (Ctrl + Alt + T on Ubuntu)
```

**You should see a prompt like:**
```
user@computer:~$
```

---

## STEP 2: NAVIGATE TO PROJECT

**Type this command exactly:**

```bash
cd /mnt/c/Users/USER/hackathon\ planning
```

**Verify you're in the right place:**
```bash
pwd
# Should show: /mnt/c/Users/USER/hackathon planning

ls
# Should show files including: hackathon-deploy.sh
```

**If you see "No such file or directory":**
```bash
# Find your project directory
ls /mnt/c/Users/
# Look for your username

# Then navigate there
cd /mnt/c/Users/YOUR_USERNAME/hackathon\ planning
```

---

## STEP 3: MAKE SCRIPT EXECUTABLE

**Run this command (only needed once):**

```bash
chmod +x hackathon-deploy.sh
```

**What this does:**
- Tells Linux "this file can be run as a program"
- Without this, you get "Permission denied"

**Verify it worked:**
```bash
ls -la hackathon-deploy.sh
# Should show: -rwxr-xr-x (the x means executable)
```

---

## STEP 4: RUN DEPLOYMENT

**THE BIG MOMENT! Run this:**

```bash
./hackathon-deploy.sh
```

**What you'll see:**
```
╔══════════════════════════════════════════════════════════╗
║         FLIP IT - ARCIUM DEPLOYMENT SCRIPT               ║
║              Hackathon Edition (Free Tier)               ║
╚══════════════════════════════════════════════════════════╝

STEP 1: Checking Prerequisites
================================
[SUCCESS] Linux detected
[SUCCESS] Project directory found
[SUCCESS] Wallet found: 7EgawZyB5YBDoaMP2NgJ7FmPUKj7GVvL5ociDqVLgrX
```

**The script is now running!** Don't close the terminal.

---

## STEP 5: MONITOR PROGRESS

The script will show colored output. Here's what each color means:

- 🟦 **BLUE** `[INFO]` - Normal status update
- 🟩 **GREEN** `[SUCCESS]` - Something completed successfully  
- 🟨 **YELLOW** `[WARNING]` - Not an error, but worth noting
- 🟥 **RED** `[ERROR]` - Something failed (read carefully!)

### Expected Timeline:

**Minute 0-2: Checking & Installing**
```
STEP 2: Installing Dependencies
=================================
[SUCCESS] Solana CLI already installed: solana-cli 2.2.0
[SUCCESS] Anchor already installed: anchor-cli 0.32.1
[INFO] Installing Arcium CLI...
[SUCCESS] Arcium CLI installed
```

**Minute 2-3: Balance Check**
```
STEP 3: Checking Wallet Balance
=================================
[INFO] Current balance: 3.5 SOL
```

**Minute 3-5: Building**
```
STEP 4: Building Project
========================
[INFO] Generating program keypair...
[SUCCESS] Program ID: 5SLSFwTtdbomiw8fyo4obKvjBhKLaA7s7EbnWmpkgLkg
[INFO] Building Arcis circuits...
[SUCCESS] Build complete!
```

**Minute 5-7: Deploying**
```
STEP 5: Deploying to Devnet
===========================
[INFO] Deploying program...
[INFO] Program ID: 5SLSFwTtdbomiw8fyo4obKvjBhKLaA7s7EbnWmpkgLkg
[INFO] Cluster Offset: 456
[INFO] RPC: Helius (Free Tier)
[SUCCESS] Deployment successful!
```

**Minute 7-9: Initialization**
```
STEP 6: Initializing Computation Definition
============================================
[INFO] Initializing Arcium computation definition...
[SUCCESS] Computation definition initialized!
```

**Minute 9-10: Finalizing**
```
STEP 7: Verifying Deployment
============================
[SUCCESS] Program verified!

STEP 8: Updating Frontend
=========================
[SUCCESS] IDL copied!
[SUCCESS] .env.local updated!
```

**Final Output:**
```
╔══════════════════════════════════════════════════════════╗
║                   DEPLOYMENT COMPLETE!                   ║
╚══════════════════════════════════════════════════════════╝

Program Details:
================
Program ID: 5SLSFwTtdbomiw8fyo4obKvjBhKLaA7s7EbnWmpkgLkg
Network: Devnet
Deployer: 7EgawZyB5YBDoaMP2NgJ7FmPUKj7GVvL5ociDqVLgrX

Links:
======
Solana Explorer: https://explorer.solana.com/address/5SLSFwTtdbomiw8fyo4obKvjBhKLaA7s7EbnWmpkgLkg?cluster=devnet
Solscan: https://solscan.io/account/5SLSFwTtdbomiw8fyo4obKvjBhKLaA7s7EbnWmpkgLkg?cluster=devnet

Next Steps:
===========
1. Your .env.local has been updated
2. The IDL has been copied to your frontend
3. Run the tests: cd house.fun/programs/flip-it && anchor test
4. Start your frontend: cd house.fun/house-fun-app && npm run dev

Happy hacking! 🚀
```

**🎉 SUCCESS!** Your program is deployed!

---

## STEP 6: VERIFY DEPLOYMENT

### Method 1: Check on Solana Explorer

1. Copy your Program ID (from the output above)
2. Open this link in browser:
   ```
   https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
   ```
3. You should see:
   - Program details
   - Deployed status
   - Recent transactions

### Method 2: Command Line

```bash
# Replace with your actual Program ID
solana program show 5SLSFwTtdbomiw8fyo4obKvjBhKLaA7s7EbnWmpkgLkg --url devnet
```

**Expected output:**
```
Program Id: 5SLSFwTtdbomiw8fyo4obKvjBhKLaA7s7EbnWmpkgLkg
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: H3kD...f8qN
Authority: 7EgawZyB5YBDoaMP2NgJ7FmPUKj7GVvL5ociDqVLgrX
Last Deployed In Slot: 394857234
Data Length: 152384 (0x25380) bytes
Balance: 1.0646304 SOL
```

**If you see this** → Deployment confirmed ✅

---

## STEP 7: TEST THE PROGRAM

### Run the Test Suite:

```bash
# Go to the project directory
cd house.fun/programs/flip-it

# Run tests
anchor test
```

**Expected output:**
```
  Flip It - Arcium Integration
    ✓ Initializes the house
    ✓ Initializes the coin_flip computation definition
    ✓ Places a bet
    ✓ Requests a flip with Arcium MPC
    ✓ Claims winnings

  5 passing (45s)
```

**If tests pass** → Everything works! 🎉

**If tests fail:**
- Check error message
- Make sure you have enough SOL
- Try running again (sometimes devnet is slow)

---

## STEP 8: UPDATE FRONTEND

### Option A: Script Already Did It (Automatic)

The script should have:
1. ✅ Updated `house.fun/house-fun-app/.env.local`
2. ✅ Copied IDL to `house.fun/house-fun-app/src/lib/anchor/idl.ts`

**Verify:**
```bash
# Check .env.local
cat house.fun/house-fun-app/.env.local
# Should show: NEXT_PUBLIC_FLIP_IT_PROGRAM_ID=5SLSFwTtdbomiw8fyo4obKvjBhKLaA7s7EbnWmpkgLkg

# Check IDL exists
ls house.fun/house-fun-app/src/lib/anchor/idl.ts
```

### Option B: Manual Update (If Script Failed)

**Update .env.local:**
```bash
# Open the file
nano house.fun/house-fun-app/.env.local

# Add this line (replace with your Program ID):
NEXT_PUBLIC_FLIP_IT_PROGRAM_ID=5SLSFwTtdbomiw8fyo4obKvjBhKLaA7s7EbnWmpkgLkg

# Save: Ctrl+X, then Y, then Enter
```

**Copy IDL:**
```bash
cp house.fun/programs/flip-it/target/idl/flip_it.json \
   house.fun/house-fun-app/src/lib/anchor/idl.ts
```

---

## STEP 9: START THE APP

```bash
# Go to frontend
cd house.fun/house-fun-app

# Install dependencies (if not done)
npm install

# Start the app
npm run dev
```

**Open browser:** http://localhost:3000

**You should see:**
- House.fun app loading
- Wallet connection working
- Flip It game available
- "Demo Mode - Arcium Deploy Pending" banner (until you enable Arcium)

---

## TROUBLESHOOTING

### Problem: "Windows detected! This script requires WSL2"

**Solution:**
```powershell
# In PowerShell as Administrator
wsl --install
# Restart computer
# Then try again
```

---

### Problem: "Solana wallet not found"

**Solution:**
```bash
# Create wallet
solana-keygen new

# Leave passphrase empty (press Enter twice)
```

---

### Problem: "Low balance detected"

**Solution:**
```bash
# Get free SOL
solana airdrop 2

# Check balance
solana balance

# If still low, use web faucet:
# https://faucet.solana.com/
```

---

### Problem: "Command not found: solana"

**Solution:**
```bash
# Install Solana
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Add to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify
solana --version
```

---

### Problem: "arcium: command not found"

**Solution:**
```bash
# Install Arcium
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash

# Add to PATH
export PATH="$HOME/.arcium/bin:$PATH"

# Verify
arcium --version
```

---

### Problem: "Deployment failed"

**Common causes:**
1. **No SOL** → Get airdrop
2. **Network issues** → Just re-run the script
3. **Program already exists** → Check if it's actually deployed:
   ```bash
   solana program show YOUR_PROGRAM_ID --url devnet
   ```
   If it shows program details, it's already deployed!

---

### Problem: "anchor: command not found"

**Solution:**
```bash
# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest

# Add to PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Verify
anchor --version
```

---

### Problem: Tests fail with "Program not found"

**Solution:**
```bash
# Make sure you're in the right directory
cd house.fun/programs/flip-it

# Check Anchor.toml has correct program ID
cat Anchor.toml
# Should show: flip_it = "YOUR_PROGRAM_ID"

# Sync the ID
solana-keygen pubkey target/deploy/flip_it-keypair.json
# Then update Anchor.toml manually if needed
```

---

## 📞 STILL HAVING ISSUES?

1. **Share the error message** (copy-paste from terminal)
2. **Tell me which step failed**
3. **Share your Program ID** (if you have one)

I'll help you debug!

---

## ✅ DEPLOYMENT CHECKLIST

Before you start:
- [ ] WSL2 installed (Windows) or native Linux/macOS
- [ ] Solana wallet created (`~/.config/solana/id.json` exists)
- [ ] At least 2 SOL in wallet (`solana balance` shows 2+)

During deployment:
- [ ] Terminal shows "STEP 1: Checking Prerequisites" ✓
- [ ] Terminal shows dependencies installing ✓
- [ ] Terminal shows "Build complete!" ✓
- [ ] Terminal shows "Deployment successful!" ✓
- [ ] Terminal shows "DEPLOYMENT COMPLETE!" ✓

After deployment:
- [ ] Can see program on Solana Explorer
- [ ] Tests pass (`anchor test` shows all green)
- [ ] Frontend .env.local updated
- [ ] Frontend starts without errors
- [ ] Can connect wallet in app

---

## 🎉 YOU'RE DONE!

Once everything is checked:
1. Your program is deployed to devnet ✅
2. Arcium MPC is ready ✅
3. Frontend is configured ✅
4. Ready for hackathon judging ✅

**Good luck! 🚀**
