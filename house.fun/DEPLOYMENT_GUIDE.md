# Deploy Flip It Smart Contract

This workflow automatically deploys the Flip It smart contract to Solana devnet or mainnet.

## Setup Instructions

### Step 1: Export Your Wallet Private Key

You need to export your wallet's private key and add it to GitHub secrets.

**For Phantom Wallet:**
1. Open Phantom browser extension
2. Click on your wallet name/address at the top
3. Click "Export Private Key"
4. Enter your password
5. Copy the private key (it will be a base58 string or array of numbers)

**For Solflare or other wallets:**
- Look for "Export Private Key" or "Show Private Key" in settings

### Step 2: Add Secret to GitHub

1. Go to your GitHub repository: https://github.com/jacuzzi8888/Howz.fun
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `WALLET_PRIVATE_KEY`
6. Value: Paste your private key (the base58 string like: `5KQm...`)
7. Click **Add secret**

### Step 3: Fund Your Wallet

**For Devnet:**
- Get free devnet SOL from the faucet:
  - Website: https://faucet.solana.com/
  - Enter your address: `7EgawZyB5YBDoa5MP2NgJ7FmPUKj7GVvL5ociDqVLgrX`
  - Request 2 SOL (can do this multiple times)
  - Or use the CLI: `solana airdrop 2 7EgawZyB5YBDoa5MP2NgJ7FmPUKj7GVvL5ociDqVLgrX --url devnet`

**For Mainnet:**
- You need real SOL (about 0.5-1 SOL for deployment)
- Buy from an exchange or ask for sponsorship

### Step 4: Run the Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **"Deploy Flip It to Devnet"** in the left sidebar
4. Click **Run workflow** button (dropdown)
5. Select network: `devnet` (or `mainnet-beta` when ready)
6. Click **Run workflow**
7. Wait 3-5 minutes for deployment to complete

### Step 5: Update Your Code

After deployment, the workflow will automatically:
- ✅ Update `lib.rs` with the new Program ID
- ✅ Update `Anchor.toml` with the new Program ID
- ✅ Update TypeScript client files with the new Program ID
- ✅ Commit and push the changes

You just need to:
1. Pull the latest changes: `git pull`
2. Update your local `.env.local` file with the Program ID shown in the Actions log

### Viewing the Deployment

After deployment, you can view your program on Solana Explorer:
- **Devnet**: https://explorer.solana.com/?cluster=devnet
- **Mainnet**: https://explorer.solana.com/

Just search for the Program ID from the Actions log.

## Troubleshooting

**"Insufficient funds" error:**
- Get more SOL from the devnet faucet
- For mainnet, ensure you have at least 0.5 SOL

**"Program already exists" error:**
- This is fine! The workflow handles this automatically
- It means the program is already deployed at that address

**Deployment fails:**
- Check the Actions logs for specific errors
- Most common: not enough SOL, or invalid private key format

## Security Note

⚠️ **Important**: The private key stored in GitHub secrets is encrypted and secure. GitHub Actions can only access it during workflow runs. Never commit your private key directly to the repository!
