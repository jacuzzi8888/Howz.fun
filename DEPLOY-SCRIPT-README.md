# 🚀 One-Click Deployment Script

**File:** `hackathon-deploy.sh`

This script automates the ENTIRE Arcium deployment process. Just run one command and everything happens automatically!

---

## ✅ What This Script Does

1. **Checks prerequisites** (OS, project directory, wallet)
2. **Installs all tools** (Solana CLI, Rust, Anchor, Arcium)
3. **Checks your wallet balance** (and requests airdrop if needed)
4. **Builds the project** (Arcis circuits + Anchor program)
5. **Deploys to devnet** using Helius RPC
6. **Initializes computation definition**
7. **Verifies deployment** on Solana
8. **Updates frontend** (copies IDL, updates .env.local)

**Total time:** ~10 minutes  
**Cost:** $0 (all free tier)

---

## 🚀 How to Use

### Step 1: Open Terminal in WSL2

```bash
# Windows users - open WSL2
wsl

# macOS/Linux - open regular terminal
```

### Step 2: Navigate to Repository

```bash
cd /path/to/your/hackathon-planning
```

### Step 3: Make Script Executable

```bash
chmod +x hackathon-deploy.sh
```

### Step 4: RUN IT! 🎉

```bash
./hackathon-deploy.sh
```

---

## 📋 Prerequisites

Before running, make sure you have:

1. ✅ **WSL2** (Windows) or native Linux/macOS
2. ✅ **Wallet** at `~/.config/solana/id.json`
3. ✅ **Internet connection** (downloads tools on first run)

---

## 🎯 What Happens When You Run It

```
[SUCCESS] Wallet found: 7EgawZyB5YBDoaMP2NgJ7FmPUKj7GVvL5ociDqVLgrX
[INFO] Current balance: 3.5 SOL
[SUCCESS] Solana CLI already installed: solana-cli 2.2.0
[SUCCESS] Anchor already installed: anchor-cli 0.32.1
[INFO] Installing Arcium CLI...
[SUCCESS] Arcium CLI installed
[INFO] Generating program keypair...
[SUCCESS] Program ID: 5SLSFwTtdbomiw8fyo4obKvjBhKLaA7s7EbnWmpkgLkg
[INFO] Building Arcis circuits...
[SUCCESS] Build complete!
[INFO] Deploying program...
[SUCCESS] Deployment successful!
[INFO] Initializing computation definition...
[SUCCESS] Computation definition initialized!
[SUCCESS] IDL copied!
[SUCCESS] .env.local updated!

🎉 DEPLOYMENT COMPLETE!

Program ID: 5SLSFwTtdbomiw8fyo4obKvjBhKLaA7s7EbnWmpkgLkg
Network: Devnet

Links:
- Solana Explorer: https://explorer.solana.com/address/...
- Solscan: https://solscan.io/account/...

Next Steps:
1. Your .env.local has been updated
2. The IDL has been copied to your frontend
3. Run: cd house.fun/house-fun-app && npm run dev
```

---

## 🐛 Troubleshooting

### "Windows detected! This script requires WSL2"

**Solution:** Install WSL2:
```powershell
# Run in PowerShell as Administrator
wsl --install
# Restart your computer
```

### "Solana wallet not found"

**Solution:** Create a wallet:
```bash
solana-keygen new
```

### "Low balance detected"

**Solution:** Get free devnet SOL:
```bash
solana airdrop 2
# OR go to https://faucet.solana.com/
```

### "Command not found: arcium"

**Solution:** The script will install it automatically. Just wait.

### "Deployment failed"

**Common causes:**
1. **No SOL** → Get airdrop
2. **Network issues** → Just re-run the script
3. **Program already exists** → This is OK, script will detect it

---

## 🔧 Manual Steps (If Script Fails)

If the script has issues, you can still deploy manually:

```bash
# 1. Go to project
cd house.fun/programs/flip-it

# 2. Build
arcium build

# 3. Deploy
arcium deploy \
  --cluster-offset 456 \
  --recovery-set-size 4 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url https://devnet.helius-rpc.com/?api-key=0e89ca71-766d-40cc-9628-5d709af0f2cc

# 4. Initialize
npx ts-node scripts/init-comp-def.ts
```

---

## 📊 Comparison

| Method | Commands | Time | Effort |
|--------|----------|------|--------|
| **This Script** | 1 | ~10 min | ⭐ |
| **GitHub Actions** | Click button | ~10 min | ⭐ |
| **Manual** | 10+ | ~30 min | ⭐⭐⭐⭐⭐ |

---

## 💡 Pro Tips

1. **First run takes longer** (installs tools)
2. **Subsequent runs are faster** (uses cache)
3. **Keep terminal open** (don't close during deployment)
4. **Check logs** if something fails

---

## 🎉 After Deployment

Your program is live! You can:

1. **Test it:** `anchor test`
2. **View on explorer:** Links provided in output
3. **Use in frontend:** Already updated .env.local for you
4. **Share with judges:** Give them the Program ID

---

**Ready? Just run:**
```bash
./hackathon-deploy.sh
```

**Good luck with your hackathon! 🚀**
