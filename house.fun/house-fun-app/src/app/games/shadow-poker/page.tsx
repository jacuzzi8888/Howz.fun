'use client';

import dynamic from 'next/dynamic';

const ShadowPokerGame = dynamic(
    () => import("~/components/games/ShadowPokerGame").then((mod) => mod.ShadowPokerGame),
    { ssr: false }
);

export default function ShadowPokerPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] overflow-hidden">
            <ShadowPokerGame />
        </div>
    );
}
