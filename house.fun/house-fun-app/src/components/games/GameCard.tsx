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
            <div className={`relative flex h-[400px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#12121A]/80 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-500 z-10 ${comingSoon ? 'opacity-70 grayscale-[30%]' : 'hover:-translate-y-2 hover:border-primary/50 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),_0_15px_40px_rgba(0,255,65,0.2)] group-hover:bg-[#1A1A24]/90'}`}>

                {/* Inner Ambient Glow on Hover */}
                {!comingSoon && <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/0 via-primary/5 to-primary/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-2xl pointer-events-none" />}

                {/* Status Badge */}
                {status && (
                    <div className="absolute left-4 top-4 z-20">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black tracking-widest uppercase border backdrop-blur-md shadow-lg ${comingSoon
                            ? 'bg-black/80 text-accentGold border-accentGold/40'
                            : isLive
                                ? 'bg-primary/20 text-primary border-primary/40 shadow-[0_0_15px_rgba(0,255,65,0.2)]'
                                : 'bg-black/80 text-white border-white/10'
                            }`}>
                            {comingSoon && <span className="material-symbols-outlined text-[14px] text-accentGold">lock</span>}
                            {isLive && <span className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_5px_var(--color-primary)]" />}
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
                <div className="relative z-10 flex flex-grow flex-col justify-between bg-gradient-to-b from-[#0A0A0F]/10 via-[#0A0A0F]/80 to-[#0A0A0F] p-6">
                    <div className="relative z-20">
                        <h3 className={`mb-1.5 text-2xl font-black text-white uppercase tracking-tight ${comingSoon ? '' : 'group-hover:text-primary group-hover:drop-shadow-[0_0_10px_rgba(0,255,65,0.4)]'} transition-all duration-300`}>{title}</h3>
                        <p className="text-sm font-medium text-gray-400 leading-snug w-full">{description}</p>
                    </div>

                    <div className="space-y-5 relative z-20">
                        <div className="flex items-center justify-between text-sm font-medium text-gray-300 border-t border-white/5 pt-4 mt-2">
                            <span className="flex items-center gap-1.5 font-bold">
                                <span className="material-symbols-outlined text-[16px] text-gray-500">
                                    {title === 'SHADOW POKER' ? 'visibility_off' : 'group'}
                                </span>
                                {comingSoon ? '—' : players}
                                {!comingSoon && typeof players === 'number' && <span className="text-gray-500 text-xs uppercase tracking-widest ml-1">Live</span>}
                            </span>
                            <span className={`font-black tracking-widest ${accent === 'red' ? 'text-red-400' : accent === 'gold' ? 'text-accentGold' : 'text-white'}`}>
                                {comingSoon ? '—' : maxBet}
                            </span>
                        </div>

                        {comingSoon ? (
                            <button className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-accentGold/20 bg-accentGold/5 text-sm font-black tracking-widest text-accentGold/70 uppercase transition-all hover:bg-accentGold/10">
                                <span className="material-symbols-outlined text-[18px]">notifications</span>
                                NOTIFY ME
                            </button>
                        ) : (
                            <a
                                href={href}
                                onClick={(e) => e.stopPropagation()}
                                className="group/btn relative flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 text-sm font-black tracking-widest text-primary uppercase transition-all duration-300 hover:border-primary hover:bg-primary hover:text-black hover:shadow-[0_0_25px_var(--color-primaryHover)] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover/btn:animate-[shimmer_1s_ease-in-out_infinite]" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {isLive || title === 'FLIP IT' ? 'PLAY NOW' : title === 'DEGEN DERBY' ? 'PLACE BETS' : 'JOIN TABLE'}
                                    <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover/btn:translate-x-1">
                                        arrow_forward
                                    </span>
                                </span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

