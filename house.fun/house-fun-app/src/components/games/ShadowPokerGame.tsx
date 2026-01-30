"use client";

import React from 'react';
import { cn } from '~/lib/utils';

export const ShadowPokerGame: React.FC = () => {
    return (
        <div className="flex-1 flex items-center justify-center relative p-4 mt-6 perspective-[1000px]">
            {/* The Poker Table */}
            <div className="relative w-full max-w-[1000px] aspect-[1.8/1] rounded-[200px] bg-[#3E2723] border-[16px] border-[#3E2723] shadow-[inset_0_0_50px_rgba(0,0,0,0.8),_0_20px_50px_rgba(0,0,0,0.5)] z-10">
                {/* Felt Surface */}
                <div className="absolute inset-2 rounded-[180px] bg-table-gradient felt-texture shadow-inner border border-black/30 overflow-hidden">
                    {/* Center: Community Cards & Pot */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20">
                        {/* Pot Display */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="glass-panel px-6 py-2 rounded-full flex flex-col items-center bg-black/40 backdrop-blur-md border border-white/10">
                                <span className="text-primary text-[9px] tracking-[0.2em] font-black uppercase opacity-60 mb-1">Total Pot</span>
                                <div className="text-white text-2xl font-black tracking-tight drop-shadow-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-accentGold text-[20px]">monetization_on</span>
                                    250 USDC
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-primary/60 font-black tracking-[0.2em] mt-2 uppercase italic">
                                <span className="material-symbols-outlined text-[12px]">security</span>
                                Encrypted by Arcium
                            </div>
                        </div>
                        {/* Community Cards */}
                        <div className="flex items-center gap-3">
                            {/* Flop (Revealed) */}
                            <div className="w-14 h-20 md:w-16 md:h-24 bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center relative border border-gray-300">
                                <span className="text-black font-black text-lg absolute top-1 left-2 leading-none">A</span>
                                <span className="material-symbols-outlined text-black absolute top-1 right-1 text-[14px]">playing_cards</span>
                                <span className="material-symbols-outlined text-black text-3xl">playing_cards</span>
                            </div>
                            <div className="w-14 h-20 md:w-16 md:h-24 bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center relative border border-gray-300">
                                <span className="text-danger font-black text-lg absolute top-1 left-2 leading-none">10</span>
                                <span className="material-symbols-outlined text-danger absolute top-1 right-1 text-[14px]">favorite</span>
                                <span className="material-symbols-outlined text-danger text-3xl">favorite</span>
                            </div>
                            <div className="w-14 h-20 md:w-16 md:h-24 bg-white rounded-lg shadow-2xl flex flex-col items-center justify-center relative border border-gray-300">
                                <span className="text-black font-black text-lg absolute top-1 left-2 leading-none">J</span>
                                <span className="material-symbols-outlined text-black absolute top-1 right-1 text-[14px]">card_membership</span>
                                <span className="material-symbols-outlined text-black text-3xl">card_membership</span>
                            </div>
                            {/* Turn & River (Hidden) */}
                            <div className="w-14 h-20 md:w-16 md:h-24 bg-[#111827] rounded-lg shadow-2xl flex items-center justify-center border border-white/5 relative group cursor-pointer">
                                <div className="absolute inset-0 bg-primary/5"></div>
                                <span className="material-symbols-outlined text-primary/40 text-2xl group-hover:text-primary group-hover:scale-110 transition-all">lock</span>
                            </div>
                            <div className="w-14 h-20 md:w-16 md:h-24 bg-[#111827] rounded-lg shadow-2xl flex items-center justify-center border border-white/5 relative group cursor-pointer">
                                <div className="absolute inset-0 bg-primary/5"></div>
                                <span className="material-symbols-outlined text-primary/40 text-2xl group-hover:text-primary group-hover:scale-110 transition-all">lock</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Opponents */}
                {/* Seat 1 */}
                <div className="absolute top-[-30px] left-[15%] -translate-x-1/2 flex flex-col items-center gap-3 z-30">
                    <div className="size-16 rounded-full bg-black/60 border-2 border-white/10 overflow-hidden shadow-2xl relative">
                        <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9hG9fMK0IfI83wrbPPQkn_2g3y1IRFyorzo6cJuAC7dxRmYKqiRBB9x7Wle0sr3-u-Tn4eAxxpT6M97fyO8B7wBIvl2mdZa5D8zaKZClPHHTsP7w5u5c5pqxwhmfDq9wFuvGbxsFc7o7AZKv5dlC-ForsNreiuWaYKSojVKf4iTCs7jxbshyUDikrarVfmBPpvqy45Tp5iG3zUTmEBTYFm-09_IpOB2fBL4WPumB7EN0sWmjUMYKlRRZANFdYG0A2NEEF-NaPvQw" alt="Player 1" />
                    </div>
                    <div className="glass-panel px-4 py-1.5 rounded-xl text-center min-w-[110px] bg-black/40 backdrop-blur-md border border-white/5">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">CryptoWhale</p>
                        <p className="text-xs font-black text-white">$12,400</p>
                    </div>
                </div>
                {/* Seat 2 */}
                <div className="absolute top-[-30px] right-[15%] translate-x-1/2 flex flex-col items-center gap-3 z-30">
                    <div className="size-16 rounded-full bg-black/60 border-2 border-white/10 overflow-hidden shadow-2xl relative">
                        <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkywu7BacNFQB4IfxgcJA1LoXwnF0aDF1BnwljlxPvUQ9waBdhwR_weGeTGdF6ubEYAox4FLLQXcFLrkXbtOJrCEqzEmfj1poIbGyvdj-Pp1LW3t0a5vagL3B2Kj3M5KWlqB986MCqzwoPSLFYyjRCfOxTlaZYoSUM3jqj9wlUvt9lipS4xDrl1a4OaPgMsPOLtxqFYxCIjVZ_jiom5OpnGap_yQB5lUI-LNS1M7zCH3l1A3p9zt_7nMHsg733ZyHiMcRijuNxv_Y" alt="Player 2" />
                    </div>
                    <div className="glass-panel px-4 py-1.5 rounded-xl text-center min-w-[110px] bg-black/40 backdrop-blur-md border border-white/5">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">SolanaKing</p>
                        <p className="text-xs font-black text-white">$4,250</p>
                    </div>
                </div>
                {/* Seat 3: Right */}
                <div className="absolute top-1/2 -right-[50px] -translate-y-1/2 flex flex-col items-center gap-3 z-30">
                    <div className="relative group/player">
                        <div className="size-16 rounded-full bg-black/60 border-2 border-white/10 overflow-hidden shadow-2xl relative">
                            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTYrEbKFazLLAuyUcW-0eGjUOuv8xPYdftomBhv6bIuVabAfKb9vP96DOtxQI-EhB-t0PyNhUmdJa9Kydo1jhGBwsD1O6n1gE1qPePBuRVxqPN1MUj5KNqSN958hTmmTYHfZ9gBuApjnwzciTnqBNu_kXbTTLN7zjIryoOu2ahgMRLqa4zP9GEEt4BudFoWM0LiXwFYjoh7KT4HZbEbSjrFNqBju5IkGZRhLy5WGqj8LTKu1phM-_CwjEYLjiG0LgT10FTiGmefX8" alt="Player 3" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-neutral-800 text-white text-[8px] font-black px-2.5 py-1 rounded-full border border-neutral-700 shadow-xl uppercase tracking-widest">Check</div>
                    </div>
                    <div className="glass-panel px-4 py-1.5 rounded-xl text-center min-w-[110px] bg-black/40 backdrop-blur-md border border-white/5">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">DegenApe</p>
                        <p className="text-xs font-black text-white">$8,900</p>
                    </div>
                </div>
                {/* Seat 4: Left */}
                <div className="absolute top-1/2 -left-[50px] -translate-y-1/2 flex flex-col items-center gap-3 z-30 opacity-40 grayscale">
                    <div className="relative">
                        <div className="size-16 rounded-full bg-black/60 border-2 border-white/10 overflow-hidden shadow-2xl relative">
                            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4U2e3pV45hakTXDN-c_MNtvjDQa3uRIpi7wzTaBQcYpFUIhdCRvmFw3mZueFBBc48m5G5t-uqEVMGeIekaN8wH2dGu8jlttcLbITFhqgOBpJsKfz58rXNqtr1JclU_nACQbE4XbfH3RmfQW-Q838CglqNscyh_-sSCrz2fWyjMJzvKkUUSBlSudPYI-lSTFna0AKFvfkWguVCLPEFIPj2-U1Pu9pMPzZMssdm11JkNPQsxFAMweFtBj4HcdWYlyBiPlurK-Z_pQ0" alt="Player 6" />
                        </div>
                        <div className="absolute -bottom-2 -left-2 bg-danger text-white text-[8px] font-black px-2.5 py-1 rounded-full border border-danger/20 shadow-xl uppercase tracking-widest">Fold</div>
                    </div>
                    <div className="glass-panel px-4 py-1.5 rounded-xl text-center min-w-[110px] bg-black/40 backdrop-blur-md border border-white/5">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">PaperHands</p>
                        <p className="text-xs font-black text-white">$0</p>
                    </div>
                </div>
            </div>

            {/* HERO HUD (Bottom) */}
            <div className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 flex flex-col items-center z-50 w-full max-w-3xl px-4">
                {/* Action Indicator */}
                <div className="relative mb-4">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-24 rounded-full border-4 border-accentGold shadow-[0_0_20px_rgba(180,229,13,0.4)] opacity-80 animate-pulse"></div>
                    <div className="size-20 rounded-full bg-black border-2 border-accentGold overflow-hidden shadow-2xl relative z-10">
                        <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0gi5jYs3dwK7mXrXHoaTVD7YyYl4BT13sx_JxhriGxdcsyHtiSTdRUGHr5gpgQFmhVo_LQMxA1S2_FV4SM8oy8nQfVkZAhzZgx_-XsMCOW3evitDtj3ZZvpiccE4UwLAqNekOLhSzgZbwhvnp-e0XjgfdcRFLom3c5xbp36G4iAAuMPxuoypo0Chfb8eeN95X4mowGeYCMyZYhFufvqpqddPPL3LjhgRKCm-rIFjZh4gtiUYmBoczKuWipt1j5QPofiwSihjnzfM" alt="Your Avatar" />
                    </div>
                    {/* Hole Cards */}
                    <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 flex gap-3 z-0">
                        <div className="w-20 h-28 md:w-24 md:h-36 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center relative border border-gray-300 -rotate-6 transform hover:rotate-0 hover:translate-y-[-20px] transition-all duration-300">
                            <span className="text-black font-black text-2xl absolute top-1.5 left-2.5">K</span>
                            <span className="material-symbols-outlined text-black absolute top-2 right-2 text-sm italic opacity-40">playing_cards</span>
                            <span className="material-symbols-outlined text-black text-5xl">playing_cards</span>
                        </div>
                        <div className="w-20 h-28 md:w-24 md:h-36 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center relative border border-gray-300 rotate-6 transform hover:rotate-0 hover:translate-y-[-20px] transition-all duration-300">
                            <span className="text-danger font-black text-2xl absolute top-1.5 left-2.5">K</span>
                            <span className="material-symbols-outlined text-danger absolute top-2 right-2 text-sm italic opacity-40">diamond</span>
                            <span className="material-symbols-outlined text-danger text-5xl">diamond</span>
                        </div>
                    </div>
                </div>

                {/* Hero Stats HUD */}
                <div className="glass-panel w-full bg-[#050a05]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl mb-8 flex flex-col md:flex-row items-center gap-8 border-t-2 border-t-primary/30">
                    <div className="flex-1 flex flex-col gap-1 text-center md:text-left">
                        <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Active Player</h4>
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <span className="text-lg font-black text-white uppercase italic tracking-tighter">ShadowSlayer</span>
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(7,204,0,0.8)]"></span>
                        </div>
                        <div className="text-primary font-black text-xl tracking-tighter mt-1">$4,500 <span className="text-[10px] opacity-60">USDC</span></div>
                    </div>

                    {/* Betting Controls */}
                    <div className="flex-1 w-full max-w-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">
                            <span>Min: $50</span>
                            <span className="text-accentGold">Pot Limit</span>
                            <span>Max: $1,200</span>
                        </div>
                        <input type="range" className="w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-primary" defaultValue={25} />
                    </div>

                    {/* Buttons Grid */}
                    <div className="w-full md:w-auto grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button className="h-14 min-w-[100px] bg-danger hover:bg-danger/80 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 shadow-xl border-b-4 border-black/40">Fold</button>
                        <button className="h-14 min-w-[100px] bg-neutral-800 hover:bg-neutral-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 shadow-xl border-b-4 border-black/80">Check</button>
                        <button className="h-14 min-w-[100px] bg-white hover:bg-white/90 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 shadow-xl border-b-4 border-black/20 flex flex-col items-center justify-center">
                            <span>Call</span>
                            <span className="text-[8px] opacity-60">$50</span>
                        </button>
                        <button className="h-14 min-w-[100px] bg-primary hover:bg-primaryHover text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(7,204,0,0.4)] border-b-4 border-black/40 flex flex-col items-center justify-center">
                            <span>Raise</span>
                            <span className="text-[8px] opacity-60">$100</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Ambient Background Spotlights */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[70vh] bg-primary/5 blur-[150px] rounded-full"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#B4E50D]/5 blur-[150px] rounded-full"></div>
            </div>
        </div>
    );
};
