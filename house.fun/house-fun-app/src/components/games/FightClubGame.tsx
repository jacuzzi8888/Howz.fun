"use client";

import React, { useState } from 'react';
import { cn } from '~/lib/utils';

export const FightClubGame: React.FC = () => {
    const [selectedSide, setSelectedSide] = useState<'RED' | 'GREEN' | null>(null);
    const [wager, setWager] = useState(1.5);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative z-10 w-full max-w-[1400px] mx-auto">
            {/* Ambient Background Lighting */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF3F33] opacity-[0.08] blur-[150px] pointer-events-none z-0"></div>
            <div className="fixed top-[10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-[#08CB00] opacity-[0.06] blur-[150px] pointer-events-none z-0"></div>

            {/* Page Heading */}
            <div className="w-full max-w-[960px] flex flex-col md:flex-row justify-between items-center gap-4 mb-8 md:mb-12">
                <div className="flex flex-col gap-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-accentGold mb-1">
                        <span className="material-symbols-outlined text-sm">stars</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Middleweight Championship Bout</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-[-0.04em] italic uppercase">
                        MAIN EVENT: <span className="text-danger">BONK</span> <span className="text-white/20 px-2 not-italic font-sans">vs</span> <span className="text-primary">WIF</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                    <span className="material-symbols-outlined text-gray-400 text-sm">info</span>
                    <span className="text-gray-300 text-[10px] font-bold uppercase tracking-wider">Rules: 24h Volume Battle</span>
                </div>
            </div>

            {/* Fight Card Layout */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-12 items-center mb-10">

                {/* RED CORNER (Left) */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-b from-danger to-transparent rounded-2xl opacity-30 blur-md group-hover:opacity-60 transition duration-500"></div>
                    <div className="glass-panel bg-gradient-to-b from-danger/5 to-black/60 rounded-2xl p-8 border-t-2 border-t-danger relative flex flex-col items-center text-center h-full">
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/40 border border-danger/30 px-2.5 py-1 rounded-md">
                            <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
                            <span className="text-[10px] font-bold text-danger uppercase tracking-widest">Red Corner</span>
                        </div>
                        <div className="relative mb-6 mt-4">
                            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-danger to-black/50 shadow-[0_0_30px_rgba(255,63,51,0.2)]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                    <img alt="Bonk" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkEN9TEBWwzunKeH88u9avcuL06alXS_kG1_m8dxAKv-obbUzcbvGUELjulHm5YA17NfTB7-PXZLccIk497ydIl8lHtlksgCSRwFdyrlBq-h2EsnuINzgnFp_r8eEjJFvk3XMFTph-PQ3tOBrXgEDB6rFI5H-l_mWHAmq3GL0QmEzj2Umov5pd9st2H8vM3lFsBXKwrvF0_LmWXGxWOfC1hfBtE_QuYb_0glnh9H01Rwa7Dv37KR0VYJKCphXWCuK3qjeWf7yHqBU" />
                                </div>
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-danger text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(255,63,51,0.5)]">
                                Underdog
                            </div>
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tighter mb-1 text-white group-hover:text-danger transition-colors uppercase">BONK</h2>
                        <div className="flex flex-col items-center gap-1 mb-8">
                            <span className="text-2xl font-black text-white/90 tracking-tighter">$0.00002341</span>
                            <div className="flex items-center gap-1 text-danger bg-danger/10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                                <span className="material-symbols-outlined text-xs">trending_down</span>
                                <span>-4.2% (24h)</span>
                            </div>
                        </div>
                        {/* Health Bar */}
                        <div className="w-full space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                <span>Power</span>
                                <span className="text-white">100/100</span>
                            </div>
                            <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                                <div className="absolute inset-0 opacity-20 bg-scanlines"></div>
                                <div className="h-full bg-gradient-to-r from-danger/60 to-danger shadow-[0_0_15px_rgba(255,63,51,0.4)] relative w-full">
                                    <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VS CENTER */}
                <div className="flex flex-col items-center justify-center gap-8 py-4 relative z-20">
                    <div className="relative">
                        <h2 className="text-7xl md:text-9xl font-black italic text-white vs-glow-text leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(180,229,13,0.3)]">VS</h2>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-accentGold opacity-20 blur-[60px] -z-10 animate-pulse"></div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-accentGold font-bold tracking-[0.3em] text-[10px] uppercase">Round Ends In</span>
                        <div className="text-4xl font-mono font-bold text-white tabular-nums bg-black/60 border border-white/10 px-6 py-3 rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                            04:59
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-gray-500 text-[9px] uppercase font-bold tracking-[0.3em] mb-1">Total Pool</span>
                        <span className="text-white font-black text-2xl tracking-tighter">4,502 SOL</span>
                    </div>
                </div>

                {/* GREEN CORNER (Right) */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-b from-primary to-transparent rounded-2xl opacity-30 blur-md group-hover:opacity-60 transition duration-500"></div>
                    <div className="glass-panel bg-gradient-to-b from-primary/5 to-black/60 rounded-2xl p-8 border-t-2 border-t-primary relative flex flex-col items-center text-center h-full">
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 border border-primary/30 px-2.5 py-1 rounded-md">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Blue Corner</span>
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        </div>
                        <div className="relative mb-6 mt-4">
                            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-primary to-black/50 shadow-[0_0_30px_rgba(7,204,0,0.2)]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                                    <img alt="WIF" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDk7KmrWg872_sn8gPbp0HHJg2G0Y1rqcpu5NMk9u86i-DPnm3GAIKk9D_EAMVtTJeHMwa9kyUff0qeAYdGuqynLNqNJbr4YS4EptbVWtFR958f8h_ZsN9a0Lv7MJ_xD8i3D7MWrWAuDhdlWqbADUclO1rhhEDMNp-FDyzyGFvwE0J-Y7iy6M6Kolhsh3Mxftiw8RB58rhxfYj8FsjuwR263DKQnAMtnasyGWkdj4f0jC64GEjakikUvbe_JpxMn4u3KeKvOL20aEo" />
                                </div>
                            </div>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-black text-[10px] font-black px-3 py-1 rounded uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(7,204,0,0.5)]">
                                Favorite
                            </div>
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tighter mb-1 text-white group-hover:text-primary transition-colors uppercase">WIF</h2>
                        <div className="flex flex-col items-center gap-1 mb-8">
                            <span className="text-2xl font-black text-white/90 tracking-tighter">$2.45</span>
                            <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                                <span className="material-symbols-outlined text-xs">trending_up</span>
                                <span>+12.5% (24h)</span>
                            </div>
                        </div>
                        {/* Health Bar */}
                        <div className="w-full space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                <span>Power</span>
                                <span className="text-white">85/100</span>
                            </div>
                            <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                                <div className="absolute inset-0 opacity-20 bg-scanlines"></div>
                                <div className="h-full bg-gradient-to-r from-primary/60 to-primary shadow-[0_0_15px_rgba(7,204,0,0.4)] relative w-[85%]">
                                    <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Betting Console (Bottom) */}
            <div className="w-full max-w-[960px] glass-panel rounded-3xl p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="flex flex-col gap-8">
                    {/* Betting Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bet Red Option */}
                        <button
                            onClick={() => setSelectedSide('RED')}
                            className={cn(
                                "relative overflow-hidden rounded-2xl p-6 flex items-center justify-between group transition-all duration-300 border-2 active:scale-[0.98]",
                                selectedSide === 'RED'
                                    ? "bg-danger/20 border-danger shadow-[0_0_30px_rgba(255,63,51,0.2)]"
                                    : "bg-danger/5 border-transparent hover:bg-danger/10 text-white/80"
                            )}>
                            <div className="flex flex-col items-start gap-1 z-10">
                                <span className="text-gray-500 text-[9px] font-black uppercase tracking-[0.3em]">Bet on Bonk</span>
                                <span className={cn(
                                    "font-black text-3xl tracking-tighter italic transition-transform group-hover:scale-105",
                                    selectedSide === 'RED' ? "text-danger" : "text-white/40"
                                )}>BET RED</span>
                            </div>
                            <div className="flex flex-col items-end z-10">
                                <span className={cn(
                                    "text-sm font-black px-4 py-1.5 rounded-lg shadow-xl",
                                    selectedSide === 'RED' ? "bg-danger text-white shadow-danger/40" : "bg-neutral-800 text-gray-400"
                                )}>1.85x</span>
                                <span className="text-[9px] text-gray-500 mt-2 font-black uppercase tracking-widest italic opacity-60">Payout 1.85:1</span>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-4 translate-y-4 rotate-[-15deg]">
                                <span className="material-symbols-outlined text-[100px] text-danger">local_fire_department</span>
                            </div>
                        </button>

                        {/* Bet Green Option */}
                        <button
                            onClick={() => setSelectedSide('GREEN')}
                            className={cn(
                                "relative overflow-hidden rounded-2xl p-6 flex items-center justify-between group transition-all duration-300 border-2 active:scale-[0.98]",
                                selectedSide === 'GREEN'
                                    ? "bg-primary/20 border-primary shadow-[0_0_30px_rgba(7,204,0,0.2)]"
                                    : "bg-primary/5 border-transparent hover:bg-primary/10 text-white/80"
                            )}>
                            <div className="absolute top-3 left-3 text-primary opacity-0 transition-opacity peer-checked:opacity-100">
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                            </div>
                            <div className="flex flex-col items-start gap-1 z-10">
                                <span className="text-gray-500 text-[9px] font-black uppercase tracking-[0.3em]">Bet on WIF</span>
                                <span className={cn(
                                    "font-black text-3xl tracking-tighter italic transition-transform group-hover:scale-105",
                                    selectedSide === 'GREEN' ? "text-primary" : "text-white/40"
                                )}>BET GREEN</span>
                            </div>
                            <div className="flex flex-col items-end z-10">
                                <span className={cn(
                                    "text-sm font-black px-4 py-1.5 rounded-lg shadow-xl",
                                    selectedSide === 'GREEN' ? "bg-primary text-black shadow-primary/40" : "bg-neutral-800 text-gray-400"
                                )}>2.10x</span>
                                <span className="text-[9px] text-gray-500 mt-2 font-black uppercase tracking-widest italic opacity-60">Payout 2.10:1</span>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-4 translate-y-4 rotate-[-15deg]">
                                <span className="material-symbols-outlined text-[100px] text-primary">trending_up</span>
                            </div>
                        </button>
                    </div>

                    {/* Input & Action */}
                    <div className="flex flex-col lg:flex-row gap-8 items-center pt-8 border-t border-white/5">
                        <div className="flex-1 w-full space-y-6">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Bet Amount</label>
                                <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-1.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                                    <span className="text-white font-mono font-bold text-lg">{wager}</span>
                                    <span className="text-[10px] text-gray-500 font-bold tracking-widest">SOL</span>
                                </div>
                            </div>
                            <div className="relative group/slider">
                                <input
                                    type="range"
                                    min="0.1"
                                    max="10"
                                    step="0.1"
                                    value={wager}
                                    onChange={(e) => setWager(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-primary group-hover/slider:accent-primaryHover transition-all"
                                />
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-600 font-mono font-black uppercase tracking-[0.3em]">
                                <span>0.1 SOL</span>
                                <span>5.0 SOL</span>
                                <span>10.0 SOL</span>
                            </div>
                        </div>
                        <div className="w-full lg:w-auto flex flex-col gap-3 min-w-[280px]">
                            <button
                                disabled={!selectedSide}
                                className={cn(
                                    "h-16 rounded-2xl shadow-xl transition-all transform active:translate-y-0.5 flex items-center justify-center gap-3 group border-b-4",
                                    selectedSide
                                        ? "bg-primary border-[#058a00] hover:bg-primaryHover text-[#0A0A0F] shadow-[0_10px_30px_rgba(7,204,0,0.4)]"
                                        : "bg-neutral-800 border-neutral-900 text-gray-500 cursor-not-allowed opacity-50"
                                )}>
                                <span className="text-lg font-black tracking-widest uppercase">PLACE BET</span>
                                <span className="material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                            <div className="text-center">
                                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest italic tracking-widest italic opacity-60">Estimated gas: 0.00005 SOL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
