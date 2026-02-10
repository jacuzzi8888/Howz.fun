'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface GameCardProps {
    title: string;
    description: string;
    status?: string;
    players?: string | number;
    maxBet?: string;
    image: string;
    icon: string;
    href: string;
    accent?: 'gold' | 'red' | 'white';
}

export const GameCard: React.FC<Readonly<GameCardProps>> = ({
    title,
    description,
    status,
    players,
    maxBet,
    image,
    icon,
    href,
    accent = 'white',
}) => {
    const isLive = status === 'LIVE';
    const router = useRouter();

    const handleCardClick = (e: React.MouseEvent) => {
        console.log(`[GameCard] Clicked ${title} -> ${href}`);
        // If we want to force navigation if Link fails
        // router.push(href);
    };

    return (
        <Link
            href={href}
            className="group block"
            onClick={handleCardClick}
        >
            <div className="glass-panel relative flex h-[380px] flex-col overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
                {status && (
                    <div className="absolute left-3 top-3 z-20">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border backdrop-blur-sm ${isLive
                            ? 'bg-primary/20 text-primary border-primary/30 animate-pulse'
                            : 'bg-black/60 text-white border-white/10'
                            }`}>
                            {isLive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                            {!isLive && icon === 'timer' && <span className="material-symbols-outlined text-[12px] text-accentGold">timer</span>}
                            {status}
                        </span>
                    </div>
                )}

                <div
                    className="relative h-1/2 w-full overflow-hidden bg-black/40 bg-cover bg-center transition-all duration-500 group-hover:scale-105"
                    style={{
                        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.8)), url("${image}")`
                    }}
                >
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                        <span className={`material-symbols-outlined text-5xl drop-shadow-[0_0_10px_rgba(7,204,0,0.8)] scale-110 ${accent === 'gold' ? 'text-accentGold' : 'text-white'
                            }`}>
                            {icon}
                        </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                        <span className={`material-symbols-outlined text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] ${accent === 'gold' ? 'text-accentGold' : 'text-white'
                            }`}>
                            {icon}
                        </span>
                    </div>
                </div>

                <div className="flex flex-grow flex-col justify-between bg-gradient-to-b from-transparent to-black/20 p-5">
                    <div>
                        <h3 className="mb-1 text-xl font-bold text-white uppercase tracking-tighter group-hover:text-primary transition-colors">{title}</h3>
                        <p className="max-w-[200px] text-xs font-medium text-gray-400">{description}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">
                                    {title === 'SHADOW POKER' ? 'visibility_off' : 'group'}
                                </span>
                                {players} {typeof players === 'number' ? 'Playing' : ''}
                            </span>
                            <span className={`font-bold ${accent === 'red' ? 'text-red-400' : accent === 'gold' ? 'text-accentGold' : 'text-white'}`}>
                                {maxBet}
                            </span>
                        </div>

                        <div
                            className="group/btn flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 text-sm font-bold text-white transition-all duration-200 group-hover:border-transparent group-hover:bg-primary group-hover:text-black group-hover:shadow-[0_0_15px_rgba(7,204,0,0.4)]"
                        >
                            {isLive || title === 'FLIP IT' ? 'PLAY NOW' : title === 'DEGEN DERBY' ? 'PLACE BETS' : 'JOIN TABLE'}
                            <span className="material-symbols-outlined text-[16px] transition-transform group-hover/btn:translate-x-1">
                                arrow_forward
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};
