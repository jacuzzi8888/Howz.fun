# Quick Start Guide - Arcium Deployment

## 🚀 Deploy in 3 Steps

### Step 1: Add Secrets (2 minutes)

Go to your GitHub repository:
```
Settings → Secrets and variables → Actions → New repository secret
```

Add these secrets:

1. **DEPLOYER_KEY**
   - Value: Your Solana wallet private key (JSON array format)
   - Get it: `cat ~/.config/solana/id.json`

2. **HELIUS_API_KEY**
   - Value: `0e89ca71-766d-40cc-9628-5d709af0f2cc`
   - (Already provided)

### Step 2: Fund Your Wallet

Get your wallet address:
```bash
solana address
```

Fund with devnet SOL:
- Go to https://faucet.solana.com/
- Paste your address
- Request 2-5 SOL

### Step 3: Deploy

1. Go to **Actions** tab in GitHub
2. Click **"Deploy Flip It - Free Tier"**
3. Click **"Run workflow"**
4. Wait ~10 minutes
5. Done! 🎉

## 📋 What Happens

```
1. Install Solana CLI, Anchor, Arcium
2. Build Arcis circuits (coin_flip.rs)
3. Compile Anchor program
4. Deploy to devnet
5. Initialize computation definition
6. Output new program ID
```

## 📝 After Deployment

Update your frontend:

```bash
# 1. Get the new program ID from the Actions output
# 2. Update .env.local:
NEXT_PUBLIC_FLIP_IT_PROGRAM_ID=<NEW_PROGRAM_ID>

# 3. Update the IDL file:
cp house.fun/programs/flip-it/target/idl/flip_it.json \
   house.fun/house-fun-app/src/lib/anchor/idl.ts
```

## 🐛 Troubleshooting

### "Low balance detected"
- Get more SOL from faucet.solana.com
- You need ~2 SOL for deployment

### "Program already deployed"
- This is fine! Just copy the existing program ID
- Or use "skip_init" option if re-running

### "Transaction failed"
- Helius free tier is shared, may be slow
- Just re-run the workflow
- It will retry automatically

### "Arcium build failed"
- Make sure your circuits compile locally first:
```bash
cd house.fun/programs/flip-it
arcium build
```

## 💡 Tips

- **Cost:** $0 (everything free tier)
- **Time:** ~10 minutes per deployment
- **Retries:** Unlimited GitHub Actions for public repos
- **Network:** Devnet only (mainnet not needed for hackathon)

## 🔗 Useful Links

- [Solana Explorer](https://explorer.solana.com/?cluster=devnet)
- [Solana Faucet](https://faucet.solana.com/)
- [Arcium Docs](https://docs.arcium.com)
- [Workflow File](../../.github/workflows/deploy-arcium-free.yml)

## 📞 Need Help?

1. Check the **Actions logs** for detailed error messages
2. Download the **artifacts** (build files) if needed
3. Verify deployment on [Solana Explorer](https://explorer.solana.com/?cluster=devnet)
