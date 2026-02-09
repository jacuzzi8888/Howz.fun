'use client';

import dynamic from 'next/dynamic';

const FlipItGame = dynamic(
    () => import("~/components/games/FlipItGame").then((mod) => mod.FlipItGame),
    { ssr: false }
);

export default function FlipItPage() {
    return (
        <div className="flex flex-col h-[calc(100vh-80px)]">
            <FlipItGame />
        </div>
    );
}
