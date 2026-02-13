"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
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

    useEffect(() => {
        setTRPCWalletAddress(publicKey?.toBase58() ?? null);
    }, [publicKey]);

    return null;
}
