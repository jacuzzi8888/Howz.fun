import "~/styles/globals.css";

import { type Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Suspense } from "react";

import { TRPCReactProvider } from "~/trpc/react";
import { Header } from "~/components/layout/Header";
import { SolanaWalletProvider } from "~/providers/SolanaWalletProvider";
import { MagicBlockProvider } from "~/lib/magicblock/MagicBlockContext";
import { ArciumProvider } from "~/lib/arcium/ArciumContext";
import { WalletSync } from "~/components/wallet/WalletSync";
import { FullPageLoader } from "~/components/loading";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "Howz.fun | The House Always Wins. So Can You.",
  description:
    "The ultimate on-chain casino where memecoins battle, flip, race, and bluff — all provably fair on Solana.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "Howz.fun",
    description: "On-chain casino on Solana",
    siteName: "Howz.fun",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Howz.fun",
    description: "The ultimate on-chain casino on Solana",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0A0A0F] font-sans text-white antialiased">
        <TRPCReactProvider>
          <SolanaWalletProvider>
            <WalletSync />
            <MagicBlockProvider>
              <ArciumProvider>
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <Suspense fallback={<FullPageLoader />}>
                    <div className="flex-1 overflow-y-auto">
                      {children}
                    </div>
                  </Suspense>
                </div>
              </ArciumProvider>
            </MagicBlockProvider>
          </SolanaWalletProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
