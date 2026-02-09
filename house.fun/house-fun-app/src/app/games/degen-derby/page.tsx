'use client';

import dynamic from 'next/dynamic';

const DegenDerbyGame = dynamic(
    () => import("~/components/games/DegenDerbyGame").then((mod) => mod.DegenDerbyGame),
    { ssr: false }
);

export default function DegenDerbyPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)]">
            <DegenDerbyGame />
        </div>
    );
}
