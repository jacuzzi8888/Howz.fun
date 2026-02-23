"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMagicBlock } from "~/lib/magicblock/MagicBlockContext";
import { setTRPCWalletAddress } from "~/trpc/react";

/**
 * Invisible component that syncs the connected wallet address
 * to the TRPC client headers. Render inside SolanaWalletProvider.
 * 
 * This enables protectedProcedure endpoints (Profile, Leaderboard,
 * recordBet, resolveBet) to receive the wallet address.
 */
export function WalletSync() {
    const { publicKey } = useWallet();
    const { sessionKey } = useMagicBlock();

    useEffect(() => {
        // ALWAYS use the main wallet's publicKey for backend TRPC authentication.
        // The sessionKey (burner wallet) is ONLY for signing on-chain transactions,
        // not for identifying the user in our off-chain database.
        const activeAddress = publicKey?.toBase58() || null;
        setTRPCWalletAddress(activeAddress);
    }, [publicKey]);

    return null;
}
