import "~/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Header } from "~/components/layout/Header";
import { SolanaWalletProvider } from "~/providers/SolanaWalletProvider";
import { MagicBlockProvider } from "~/lib/magicblock/MagicBlockContext";
import { PrivacyProvider } from "~/lib/arcium/PrivacyContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "house.fun | The House Always Wins. So Can You.",
  description:
    "The ultimate on-chain casino where memecoins battle, flip, race, and bluff — all provably fair on Solana.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "house.fun",
    description: "On-chain casino on Solana",
    siteName: "house.fun",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "house.fun",
    description: "The ultimate on-chain casino on Solana",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0A0A0F] font-sans text-white antialiased">
        <TRPCReactProvider>
          <SolanaWalletProvider>
            <MagicBlockProvider>
              <PrivacyProvider>
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <div className="flex-1 overflow-y-auto">
                    {children}
                  </div>
                </div>
              </PrivacyProvider>
            </MagicBlockProvider>
          </SolanaWalletProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
