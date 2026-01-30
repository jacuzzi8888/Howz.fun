'use client';

import { useEffect } from 'react';
import Script from 'next/script';

const JupiterTerminal = () => {
    useEffect(() => {
        if (window.Jupiter) {
            // Re-init if already loaded (e.g. navigation)
            initJupiter();
        }
    }, []);

    const initJupiter = () => {
        window.Jupiter.init({
            displayMode: 'integrated',
            integratedTargetId: 'integrated-terminal',
            // TODO: Replace with a private RPC for production to avoid rate limits
            endpoint: 'https://api.mainnet-beta.solana.com',
            strictTokenList: true,
            formProps: {
                initialInputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
                initialOutputMint: 'So11111111111111111111111111111111111111112', // SOL
            },
        });
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-black/40 rounded-3xl overflow-hidden border border-white/5">
            <Script
                src="https://terminal.jup.ag/main-v3.js"
                strategy="lazyOnload"
                onLoad={initJupiter}
            />
            <div
                id="integrated-terminal"
                className="w-full h-full min-h-[500px]"
            />
        </div>
    );
};

export default JupiterTerminal;
