'use client';

import React from 'react';

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
    comingSoon?: boolean;
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
    comingSoon = false,
}) => {
    const isLive = status === 'LIVE' && !comingSoon;

    return (
        <div
            className={`group block ${comingSoon ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={() => !comingSoon && (window.location.href = href)}
        >
            <div className={`glass-panel relative flex h-[380px] flex-col overflow-hidden rounded-xl transition-all duration-300 ${comingSoon ? 'opacity-70 grayscale-[30%]' : 'hover:-translate-y-1 hover:border-primary/30'}`}>
                {/* Status Badge */}
                {status && (
                    <div className="absolute left-3 top-3 z-20">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border backdrop-blur-sm ${comingSoon
                                ? 'bg-black/60 text-accentGold border-accentGold/30'
                                : isLive
                                    ? 'bg-primary/20 text-primary border-primary/30 animate-pulse'
                                    : 'bg-black/60 text-white border-white/10'
                            }`}>
                            {comingSoon && <span className="material-symbols-outlined text-xs text-accentGold">lock</span>}
                            {isLive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                            {comingSoon ? 'COMING SOON' : status}
                        </span>
                    </div>
                )}

                {/* Image */}
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

                {/* Content */}
                <div className="flex flex-grow flex-col justify-between bg-gradient-to-b from-transparent to-black/20 p-5">
                    <div>
                        <h3 className={`mb-1 text-xl font-bold text-white uppercase tracking-tighter ${comingSoon ? '' : 'group-hover:text-primary'} transition-colors`}>{title}</h3>
                        <p className="max-w-[200px] text-xs font-medium text-gray-400">{description}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">
                                    {title === 'SHADOW POKER' ? 'visibility_off' : 'group'}
                                </span>
                                {comingSoon ? '—' : players} {!comingSoon && typeof players === 'number' ? 'Playing' : ''}
                            </span>
                            <span className={`font-bold ${accent === 'red' ? 'text-red-400' : accent === 'gold' ? 'text-accentGold' : 'text-white'}`}>
                                {comingSoon ? '—' : maxBet}
                            </span>
                        </div>

                        {comingSoon ? (
                            <div className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-accentGold/20 bg-accentGold/5 text-sm font-bold text-accentGold/70">
                                <span className="material-symbols-outlined text-sm">notifications</span>
                                NOTIFY ME
                            </div>
                        ) : (
                            <a
                                href={href}
                                onClick={(e) => e.stopPropagation()}
                                className="group/btn flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 text-sm font-bold text-white transition-all duration-200 hover:border-transparent hover:bg-primary hover:text-black hover:shadow-[0_0_15px_rgba(7,204,0,0.4)]"
                            >
                                {isLive || title === 'FLIP IT' ? 'PLAY NOW' : title === 'DEGEN DERBY' ? 'PLACE BETS' : 'JOIN TABLE'}
                                <span className="material-symbols-outlined text-[16px] transition-transform group-hover/btn:translate-x-1">
                                    arrow_forward
                                </span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

