"use client";

import React, { useState } from 'react';
import { colors } from '~/lib/design-tokens';
import { cn } from '~/lib/utils';

export const FlipItGame: React.FC = () => {
    const [side, setSide] = useState<'HEADS' | 'TAILS'>('HEADS');
    const [amount, setAmount] = useState<number>(1.5);
    const [isFlipping, setIsFlipping] = useState(false);

    const handleFlip = () => {
        setIsFlipping(true);
        // Simulate flip animation
        setTimeout(() => setIsFlipping(false), 2000);
    };

    return (
        <div className="flex flex-1 relative overflow-hidden">
            {/* Game Area (Center) */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-10 relative z-10 overflow-y-auto">
                <div className="w-full max-w-lg flex flex-col items-center gap-12">

                    {/* 3D Coin Display */}
                    <div className="relative group cursor-pointer perspective-1000">
                        {/* Glow Effect behind coin */}
                        <div className="absolute inset-0 rounded-full bg-accentGold blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>

                        {/* Coin Graphic */}
                        <div className={cn(
                            "relative size-[200px] rounded-full bg-gradient-to-br from-[#FFD700] via-[#F59E0B] to-[#B45309] shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] flex items-center justify-center border-4 border-[#FCD34D] transform transition-all duration-500",
                            isFlipping ? "animate-spin" : "group-hover:scale-105 group-hover:rotate-y-12"
                        )}>
                            <div className="absolute inset-2 rounded-full border-2 border-[#B45309]/50 border-dashed"></div>
                            <span className="text-8xl font-black text-[#92400E] drop-shadow-[0_2px_2px_rgba(255,255,255,0.4)]">
                                {side === 'HEADS' ? 'H' : 'T'}
                            </span>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-50"></div>
                        </div>
                    </div>

                    {/* Betting Controls Container */}
                    <div className="w-full glass-panel rounded-3xl p-8 flex flex-col gap-8 shadow-2xl">
                        {/* Heads / Tails Toggle */}
                        <div className="grid grid-cols-2 gap-4 p-1.5 bg-black/40 rounded-2xl">
                            <button
                                onClick={() => setSide('HEADS')}
                                className={cn(
                                    "h-14 flex items-center justify-center rounded-xl border-2 transition-all duration-300 font-bold tracking-wider",
                                    side === 'HEADS'
                                        ? "bg-primary border-primary/50 text-black shadow-[0_0_20px_-5px_rgba(7,204,0,0.5)]"
                                        : "border-transparent text-white/50 hover:text-white"
                                )}
                            >
                                HEADS
                            </button>
                            <button
                                onClick={() => setSide('TAILS')}
                                className={cn(
                                    "h-14 flex items-center justify-center rounded-xl border-2 transition-all duration-300 font-bold tracking-wider",
                                    side === 'TAILS'
                                        ? "bg-danger border-danger/50 text-white shadow-[0_0_20px_-5px_rgba(255,63,51,0.5)]"
                                        : "border-transparent text-white/50 hover:text-white"
                                )}
                            >
                                TAILS
                            </button>
                        </div>

                        {/* Bet Amount Input */}
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center text-xs font-bold text-gray-400 px-1 tracking-widest uppercase">
                                <span>Wager Amount</span>
                                <span>Balance: <span className="text-white">145.20 SOL</span></span>
                            </div>
                            <div className="flex items-stretch gap-3">
                                <button
                                    onClick={() => setAmount(Math.max(0.1, amount - 0.5))}
                                    className="size-14 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-2xl font-bold text-gray-400 hover:text-white transition-all"
                                >-</button>
                                <div className="flex-1 relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(parseFloat(e.target.value))}
                                        className="w-full h-14 bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 text-white font-mono text-xl font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-center"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-500 pointer-events-none tracking-tighter">SOL</div>
                                </div>
                                <button
                                    onClick={() => setAmount(amount + 0.5)}
                                    className="size-14 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-2xl font-bold text-gray-400 hover:text-white transition-all"
                                >+</button>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            disabled={isFlipping}
                            onClick={handleFlip}
                            className={cn(
                                "w-full h-16 text-xl font-black tracking-[0.1em] uppercase rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 group shadow-[0_0_30px_rgba(7,204,0,0.3)]",
                                isFlipping ? "bg-gray-700 cursor-not-allowed text-gray-400" : "bg-primary hover:bg-primaryHover text-[#0A0A0F] hover:shadow-[0_0_40px_rgba(7,204,0,0.5)]"
                            )}
                        >
                            <span>{isFlipping ? 'FLIPPING...' : 'FLIP NOW'}</span>
                            <span className={cn(
                                "material-symbols-outlined transition-transform duration-700",
                                isFlipping ? "animate-spin" : "group-hover:rotate-180"
                            )}>sync</span>
                        </button>

                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] px-1">
                            <span>Multiplier: <span className="text-white">2.0x</span></span>
                            <span>Win Chance: <span className="text-white">50%</span></span>
                        </div>
                    </div>
                </div>

                {/* Background Decorative Glows */}
                <div className="absolute top-1/4 left-1/4 size-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 size-96 bg-danger/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse delay-700"></div>
            </div>

            {/* Sidebar (Recent Flips) */}
            <aside className="w-80 border-l border-white/5 bg-[#0A0A0F]/50 backdrop-blur-xl hidden xl:flex flex-col z-20">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-white tracking-tighter flex items-center gap-2 uppercase text-sm">
                        <span className="material-symbols-outlined text-gray-400 text-lg">history</span>
                        Recent Flips
                    </h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Live</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Mock Recent Items */}
                    {[
                        { id: 1, type: 'win', amount: '+2.00', side: 'HEADS', user: '0x8a...4f2', time: 'Just now' },
                        { id: 2, type: 'loss', amount: '-0.50', side: 'TAILS', user: '0xb2...9c1', time: '4s ago' },
                        { id: 3, type: 'win', amount: '+10.5', side: 'HEADS', user: '0x33...a11', time: '12s ago' },
                    ].map(item => (
                        <div key={item.id} className="glass-panel rounded-xl p-4 flex items-center justify-between group hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "size-10 rounded-lg flex items-center justify-center border",
                                    item.type === 'win' ? "bg-primary/10 text-primary border-primary/20" : "bg-danger/10 text-danger border-danger/20"
                                )}>
                                    <span className="material-symbols-outlined text-sm">
                                        {item.type === 'win' ? 'check_circle' : 'cancel'}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono text-gray-500">{item.user}</span>
                                    <span className="text-[11px] font-black text-white uppercase tracking-tighter">{item.side}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={cn("text-sm font-black tracking-tighter", item.type === 'win' ? "text-primary" : "text-gray-500")}>
                                    {item.amount} SOL
                                </div>
                                <div className="text-[9px] font-bold text-gray-500 uppercase">{item.time}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/5">
                    <button className="w-full py-3 rounded-xl border border-white/5 hover:border-white/20 text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest bg-white/5">
                        View All History
                    </button>
                </div>
            </aside>
        </div>
    );
};
