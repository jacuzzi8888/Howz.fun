"use client";

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '~/lib/utils';

interface Horse {
    id: number;
    name: string;
    image: string;
}

interface DerbyTrackProps {
    horses: Horse[];
    onRaceEnd: (winnerId: number) => void;
}

interface HorseProgress {
    id: number;
    progress: number; // 0 to 100
    speed: number;
}

export const DerbyTrack: React.FC<DerbyTrackProps> = ({ horses, onRaceEnd }) => {
    const [horseProgress, setHorseProgress] = useState<HorseProgress[]>(
        horses.map(h => ({ id: h.id, progress: 0, speed: 0.1 + Math.random() * 0.2 }))
    );
    const [timeLeft, setTimeLeft] = useState(15); // 15 second race
    const requestRef = useRef<number>(null);
    const lastTimeRef = useRef<number>(null);

    const animate = (time: number) => {
        if (lastTimeRef.current !== null) {
            const deltaTime = time - lastTimeRef.current;

            setHorseProgress(prev => {
                const next = prev.map(hp => {
                    if (hp.progress >= 100) return hp;
                    // Add some variance to speed
                    const variance = (Math.random() - 0.5) * 0.05;
                    const newSpeed = Math.max(0.05, hp.speed + variance);
                    return {
                        ...hp,
                        progress: Math.min(100, hp.progress + hp.speed * (deltaTime / 16.6) * 0.5),
                        speed: newSpeed
                    };
                });

                // Check if all finished
                if (next.every(hp => hp.progress >= 100)) {
                    // Find winner
                    const winner = next.sort((a, b) => b.progress - a.progress)[0];
                    if (winner) onRaceEnd(winner.id);
                    return next;
                }

                return next;
            });
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const sortedByProgress = [...horseProgress].sort((a, b) => b.progress - a.progress);

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Race Header */}
            <div className="flex justify-between items-end pb-4 border-b border-white/10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-primary/20 text-primary text-[9px] font-black px-2 py-0.5 rounded border border-primary/30 uppercase tracking-[0.2em]">Race in Progress</span>
                        <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Live Stream</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-white">
                        The Great Memecoin Derby <span className="text-white/20 mx-2">—</span> Final Stretch
                    </h2>
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1 font-black">Estimated Finish</p>
                    <div className="text-accentGold font-mono text-3xl font-black tracking-widest">
                        00:{timeLeft.toString().padStart(2, '0')}
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Track Area */}
                <div className="flex-1 glass-panel rounded-3xl p-4 overflow-hidden relative min-h-[500px] border border-white/5">
                    {/* Track Markings */}
                    <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none">
                        <div className="absolute left-[20%] top-0 bottom-0 w-px bg-white/5"></div>
                        <div className="absolute left-[40%] top-0 bottom-0 w-px bg-white/5"></div>
                        <div className="absolute left-[60%] top-0 bottom-0 w-px bg-white/5"></div>
                        <div className="absolute left-[80%] top-0 bottom-0 w-px bg-white/5"></div>
                        <div className="absolute right-[50px] top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-white to-primary opacity-30 shadow-[0_0_20px_rgba(7,204,0,0.5)]"></div>
                        <div className="absolute right-[60px] top-4 text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] vertical-text">FINISH LINE</div>
                    </div>

                    <div className="flex flex-col h-full justify-between gap-2 relative z-10">
                        {horses.map((horse, idx) => {
                            const progress = horseProgress.find(hp => hp.id === horse.id)?.progress ?? 0;
                            return (
                                <div key={horse.id} className="relative h-12 flex items-center group">
                                    {/* Lane Divider */}
                                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5 group-last:hidden"></div>
                                    <div className="absolute left-2 text-[10px] font-black text-white/20">{idx + 1}</div>

                                    {/* Horse Container */}
                                    <div
                                        className="absolute transition-all duration-100 ease-linear flex items-center gap-3"
                                        style={{ left: `${progress * 0.85}%` }}
                                    >
                                        <div className="relative">
                                            <div className="absolute -inset-2 bg-primary/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div
                                                className="size-10 rounded-lg bg-cover bg-center border border-white/20 shadow-xl relative z-10"
                                                style={{ backgroundImage: `url('${horse.image}')` }}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-white uppercase italic tracking-tighter leading-none">{horse.name}</span>
                                            <span className="text-[8px] text-primary/60 font-mono">+{Math.floor(progress)}m</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Live Leaderboard Sidebar */}
                <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
                    <div className="glass-panel rounded-2xl flex flex-col border border-white/5 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/5">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-primary animate-pulse">leaderboard</span>
                                Live Positions
                            </h3>
                        </div>
                        <div className="p-2 flex flex-col gap-1">
                            {sortedByProgress.map((hp, idx) => {
                                const horse = horses.find(h => h.id === hp.id)!;
                                return (
                                    <div key={hp.id} className={cn(
                                        "flex items-center justify-between p-3 rounded-xl transition-all",
                                        idx === 0 ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "size-5 flex items-center justify-center rounded text-[10px] font-black",
                                                idx === 0 ? "bg-primary text-black" : "bg-white/10 text-white/40"
                                            )}>{idx + 1}</span>
                                            <span className="text-[11px] font-bold text-white uppercase tracking-tight">{horse.name}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-white/30">{Math.floor(hp.progress)}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="glass-panel rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Your Bet</span>
                            <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded">ACTIVE</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded bg-white/10 bg-cover bg-center" style={{ backgroundImage: `url('${horses[3]?.image}')` }} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white uppercase">{horses[3]?.name}</span>
                                <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">1.0 SOL • 8.5x</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-white/20 uppercase">Est. Payout</span>
                                <span className="text-sm font-mono font-black text-primary">8.50 SOL</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
