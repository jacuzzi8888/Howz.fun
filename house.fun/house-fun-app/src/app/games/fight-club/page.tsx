'use client';

import dynamic from 'next/dynamic';

const FightClubGame = dynamic(
    () => import("~/components/games/FightClubGame").then((mod) => mod.FightClubGame),
    { ssr: false }
);

export default function FightClubPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)]">
            <FightClubGame />
        </div>
    );
}
