import React, { useState } from 'react';
import { cn } from '~/lib/utils';
import { useMagicBlock } from '~/lib/magicblock/MagicBlockContext';
import { DerbyTrack } from './_components/DerbyTrack';

interface Horse {
    id: number;
    name: string;
    odds: number;
    image: string;
    sponsor: string;
    sponsorIcon: string;
    gen: number;
    form: boolean[];
}

const HORSES: Horse[] = [
    { id: 1, name: "Pepe Pride", odds: 3.2, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRvZJu25LR3TqOkZmn4L8yFnTwyx8HNOFaLQaVTbn58UxRoytIhm7vVyikqVcjhENlfg6p_mwa5PAIDh0V1bzgrLjwvJ8XVZ9VJdrjf8bKYgHYf9MpBCZc7gsCBjxa4rR4gHdjP9-zx7u-M4cmMvLmdjy05tWjtAql45buO83qL86KnBKGC9LAlLVqNQnK18fzmzpfXGkEXHIIIYWMi5ugdE4a_HWSwXCsASIVmDl3vI2h9caBdlLRD7gSJCRWlsWFwXx1fsmftZw", sponsor: "Solana", sponsorIcon: "bolt", gen: 1, form: [true, true, true] },
    { id: 2, name: "Doge Dust", odds: 5.5, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9k-aPJW68R9jRYUYBUHFKXT0HdwfcaUUWcdEioXULm5UU9NwOjvJxntSY8nZyPWv3NqgBXVrsQ-oSd9DA8kCY5YBPqyYyOg7NQIsO0h6DKFCshHkbLJhkyUf4RffOHWNtaCtGfleH8AWQylZIQLUyk1f0m8nbqcT1SWI59TrupUdREhkIno6pQMhwDhTsVqyicjRc0qKa6S3syoHPRUqrlS7DqWtSEA1iMTRKIU4VRd9airrB2_DXRBoGkLxcoVm4BlwEhPPuFV8", sponsor: "Jupiter", sponsorIcon: "rocket_launch", gen: 3, form: [true, false, true] },
    { id: 3, name: "Diamond Hands", odds: 4.8, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD777dbkCSPfdnfGmvpoTGALV-jG8OL2AHIWzLDeuR_zl2mvjWAAEgQU1ZTMMfvJ5p1vadrCXtMkHzYdfKlIiyd3qnSc1v3PZizzCEAKF3_FvFEONEbmDlZ_TtH36_lF-z8poNgrKwJY-FUSn242Hk6r5E3aZeXu_imNoRxOmpVnhrzbKApIWSxVtRXGRZqvZ-CTnRUgU22CZVhn7q9B4s8c18V8f_SddJ-16zmMHVy6_FrGQ6h54FF6OoBMDXs6lwk_Bsy7QNZQ6Q", sponsor: "Magic Eden", sponsorIcon: "diamond", gen: 2, form: [true, true, false] },
    { id: 4, name: "Bonk Blazer", odds: 8.5, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVTl3M8cSH0v_Lgd9P5gfBZKByccI43uCvrqLk132YOsZk_LmdBHKZcUTDHFVuwiZmjZC8esXwLq_BCbevhwyj1dqtqFL7ZFLOU613-Vli69ddeb1smjPv-ewXSi_4kwPnT1UgYWBPisuqtuuPfQ1pyRiKsEJLnrgYVSWM5c60_IVE5PfNDkZoee9D4shvfyfYj_U_4yAVdYl_QvOfY_XtV6b3eJci8CI4c4Aaz3x8jRzylNs12liWsOmKicCZx35r3IqJYkzk7z0", sponsor: "Phantom", sponsorIcon: "pets", gen: 5, form: [true, true, false] },
    { id: 5, name: "Solana Speed", odds: 7.0, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQq3KfJdBMuztjr7lCsQFB5yDpTuW8ShUNMiPlhKseguk3RY5XzvTMx0G2qv3yOAzVDeXJesJ3xx_iHYlCcK73NS0a2ePqZhWemF0j3wDfrGHRWVH1rEOw_E6rmoS6nqS5R8KTNIwnqCcxbXyPuqOt2Tz0rmknCaHgpAGRt0FReGKKdChiq3xjCBXnXgcby2e-AWUhpG6dV_XMGfDvgKXWLx5t_Fru0hB98YnGilFatuwigcVRILYY0S_U-K67UIBuD5YiJZ4oMJo", sponsor: "Raydium", sponsorIcon: "waves", gen: 1, form: [false, true, true] },
    { id: 6, name: "Hodl Horse", odds: 15.0, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQ7HiouYWYfTS4iI0cXyMVKsQezzqf6wL-noM7cH8nfs_-fiQ8zhX9b16yau6qOq96O50rlSFRfCHUeGmmbxBEr63PGxzJFMnhSP0iWUPimXjE9aPTy1pyI-q8YCENt0y1vJAq_rvB5QM947ku3eaNVWz84Cfe4msdNuMiOxR7cqHmvNkM8pzvMsjtbmrcKU-IRb1VLRHvo4rj1lJsopAuO9YOEI4M17_-VtSZClq1fAy944Ozkus72meX5W_HfJy6TgD9xG9n-Vw", sponsor: "Ledger", sponsorIcon: "lock", gen: 4, form: [true, false, false] },
    { id: 7, name: "Wif Hat", odds: 12.0, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGJH6qAOTbFZfazEAGqinfVhy0_IH29UJP0d67dDAQAFSxPC1Ry-oJwXoAqSSyXoZkChqu08QQD5nPUF5fF7K_IsisPelh4Ohq67g-pvpsi9H1LH7yfIlV3PdpGfdA2aaIJ-7VdQI4X6H6XryV0qeS-dOVp0ELZzo0ZaPN8NKIq23LkpoVN7bLFewtzhukpbOOvx3RQGiFhyhMLg2qBGkLP7r_XATQxqwiAffMlZ9AI-Ro28J-6RAbmckqdz73E64pTHAx1dHLGsw", sponsor: "Metaplex", sponsorIcon: "checkroom", gen: 2, form: [false, false, true] },
    { id: 8, name: "Moon Shot", odds: 25.0, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAuy7qBEYzOApi8gPeiWcfcJPe3aJlQIUbS-hn_PZ9JGD3whlFkW2ozXNkgF67PS5NbdAP17Va8WKbiOZk4Tuw8KhmuOBIyhITHBsmd2FTBks70v0ipiThbJadlXxmZoXWw81jyENUzKOaRRlP6Rd-4G4NyFT9g2vw1_4bZl2PCBkasDbo9Ny7F0nI3x0VUgU3V7-uFF8g3Mu6AVLF9ZaukrnWfHzKLS11xClb_xrPpz1l-Vr7Qk9BNal7WXfZn8u0AjC1dv3ucWMI", sponsor: "Degenerate Ape", sponsorIcon: "rocket", gen: 1, form: [false, false, false] },
];

export const DegenDerbyGame: React.FC = () => {
    const [gameState, setGameState] = useState<'BETTING' | 'RACING' | 'RESULTS'>('BETTING');
    const [selectedHorseId, setSelectedHorseId] = useState<number | null>(4);
    const [stake, setStake] = useState(0.5);
    const [winnerId, setWinnerId] = useState<number | null>(null);
    const { setIsUsingRollup } = useMagicBlock();

    const handlePlaceBet = () => {
        if (!selectedHorseId) return;
        setIsUsingRollup(true); // Switch to high-speed rollup connection
        setGameState('RACING');
    };

    const handleRaceEnd = (id: number) => {
        setWinnerId(id);
        setIsUsingRollup(false); // Return to standard L1
        setGameState('RESULTS');
    };

    const selectedHorse = HORSES.find(h => h.id === selectedHorseId);
    const estPayout = selectedHorse ? (stake * selectedHorse.odds).toFixed(2) : "0.00";

    return (
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
            {/* Left Column: Race Info & Grid */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                {/* Race Header & Timer */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-primary/20 text-primary text-[9px] font-black px-2 py-0.5 rounded border border-primary/30 uppercase tracking-[0.2em]">Live Now</span>
                            <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Solana Network</span>
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase text-white">
                            Race #42 <span className="text-white/20 mx-2">—</span> Memecoin Championship
                        </h2>
                        <p className="text-white/50 text-xs font-bold uppercase tracking-widest">High Stakes Arena • 1200m Dirt • Class 1</p>
                    </div>
                    {/* Timer */}
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1 font-black">Gates Open In</p>
                        <div className="text-accentGold font-mono text-4xl md:text-6xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(180,229,13,0.3)]">
                            02:34
                        </div>
                    </div>
                </div>

                {/* Content based on Game State */}
                {gameState === 'BETTING' ? (
                    <>
                        {/* Horse Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {HORSES.map(horse => (
                                <div
                                    key={horse.id}
                                    onClick={() => setSelectedHorseId(horse.id)}
                                    className={cn(
                                        "group relative flex flex-col glass-panel rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer border-2",
                                        selectedHorseId === horse.id
                                            ? "border-accentGold shadow-[0_0_30px_rgba(180,229,13,0.15)] scale-[1.02] z-10"
                                            : "border-white/5 hover:border-white/20 hover:scale-[1.01]"
                                    )}>
                                    <div className={cn(
                                        "absolute top-4 left-4 z-20 size-8 flex items-center justify-center rounded-full border text-sm font-black transition-colors",
                                        selectedHorseId === horse.id ? "bg-accentGold text-black border-accentGold shadow-xl" : "bg-black/60 backdrop-blur-md border-white/20 text-white"
                                    )}>
                                        {horse.id}
                                    </div>
                                    {selectedHorseId === horse.id && (
                                        <div className="absolute top-4 right-4 z-20 bg-accentGold text-black px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shadow-xl">
                                            Selected
                                        </div>
                                    )}
                                    <div
                                        className="h-52 w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                        style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95), transparent 60%), url('${horse.image}')` }}
                                    />
                                    <div className="p-5 flex flex-col gap-1 -mt-14 relative z-10">
                                        <div className="flex justify-between items-end">
                                            <h3 className={cn(
                                                "text-xl font-black uppercase italic leading-none transition-colors",
                                                selectedHorseId === horse.id ? "text-accentGold" : "text-white"
                                            )}>{horse.name}</h3>
                                            <div className={cn(
                                                "px-2.5 py-1 rounded-lg text-xs font-black shadow-lg",
                                                selectedHorseId === horse.id ? "bg-accentGold text-black" : "bg-white/10 text-white"
                                            )}>{horse.odds}x</div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] mt-2 font-bold">
                                            <div className="flex items-center gap-1.5 text-white/50 uppercase tracking-widest">
                                                <span>Form:</span>
                                                <div className="flex gap-1">
                                                    {horse.form.map((win, i) => (
                                                        <span key={i} className={cn("size-1.5 rounded-full", win ? "bg-primary shadow-[0_0_5px_rgba(7,204,0,0.5)]" : "bg-white/10")} />
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-white/30 font-mono tracking-tighter">GEN {horse.gen}</span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase text-white/20 tracking-[0.2em]">Sponsor</span>
                                            <div className="flex items-center gap-1.5 text-white/60">
                                                <span className="material-symbols-outlined text-sm">{horse.sponsorIcon}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest">{horse.sponsor}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : gameState === 'RACING' ? (
                    <DerbyTrack horses={HORSES} onRaceEnd={handleRaceEnd} />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-8 py-20 glass-panel rounded-3xl border border-primary/20 bg-primary/5">
                        <div className="flex flex-col items-center gap-4">
                            <span className="material-symbols-outlined text-7xl text-accentGold animate-bounce">emoji_events</span>
                            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Race Results</h2>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <div className="size-32 rounded-2xl bg-cover bg-center border-4 border-accentGold shadow-[0_0_40px_rgba(245,158,11,0.3)]" style={{ backgroundImage: `url('${HORSES.find(h => h.id === winnerId)?.image}')` }} />
                            <h3 className="text-3xl font-black text-accentGold uppercase italic mt-4">{HORSES.find(h => h.id === winnerId)?.name} WINS!</h3>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setGameState('BETTING')}
                                className="px-8 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:bg-primaryHover transition-all shadow-xl"
                            >
                                Play Again
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: Betting Slip */}
            <aside className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4">
                <div className="glass-panel rounded-3xl flex flex-col overflow-hidden sticky top-24 shadow-2xl">
                    {/* Bet Type Tabs */}
                    <div className="flex border-b border-white/5 bg-black/40">
                        {['WIN', 'PLACE', 'SHOW', 'EXACTA'].map((tab, i) => (
                            <button
                                key={tab}
                                className={cn(
                                    "flex-1 py-4 text-[10px] font-black tracking-[0.2em] transition-all",
                                    i === 0
                                        ? "border-b-2 border-primary text-white bg-primary/5"
                                        : "text-white/30 hover:text-white/60 hover:bg-white/5"
                                )}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 flex flex-col gap-6">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                            <span>Your Selection</span>
                            <button className="hover:text-white transition-colors">Clear All</button>
                        </div>

                        {selectedHorse ? (
                            <div className="flex items-center gap-4 bg-white/5 border border-accentGold/20 rounded-2xl p-4 relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accentGold"></div>
                                <div className="size-14 rounded-xl bg-cover bg-center shrink-0 border border-white/10" style={{ backgroundImage: `url('${selectedHorse.image}')` }} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-black text-white truncate text-sm uppercase italic">#{selectedHorse.id} {selectedHorse.name}</h4>
                                        <button onClick={() => setSelectedHorseId(null)} className="text-white/20 hover:text-danger transition-colors">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] text-accentGold font-black uppercase tracking-widest">{selectedHorse.odds}x Odds</span>
                                        <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Win Market</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-28 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-white/20">
                                <span className="material-symbols-outlined text-3xl">sports_score</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Select a horse</span>
                            </div>
                        )}

                        {/* Betting Inputs */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Stake Amount</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={stake}
                                        onChange={(e) => setStake(parseFloat(e.target.value))}
                                        className="w-full bg-black/60 border border-white/10 rounded-xl py-4 pl-5 pr-14 text-white font-mono font-bold text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-50">
                                        <span className="text-[10px] font-black text-white">SOL</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {[0.1, 0.5, 1.0, 5.0].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setStake(val)}
                                            className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-black text-white/40 hover:text-white transition-all border border-white/5">
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Calculations */}
                            <div className="bg-black/40 rounded-2xl p-5 space-y-3 border border-white/5 shadow-inner">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-60">
                                    <span>Total Stake</span>
                                    <span className="font-mono text-white">{stake.toFixed(2)} SOL</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Est. Payout</span>
                                    <div className="text-right">
                                        <span className="font-mono text-primary font-black text-2xl tracking-tighter shadow-primaryHover">{estPayout} SOL</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                disabled={!selectedHorse || gameState !== 'BETTING'}
                                onClick={handlePlaceBet}
                                className={cn(
                                    "w-full h-16 text-sm font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 group border-b-4",
                                    selectedHorse && gameState === 'BETTING'
                                        ? "bg-primary border-[#058a00] hover:bg-primaryHover text-[#0A0A0F] shadow-[0_10px_30px_rgba(7,204,0,0.4)]"
                                        : "bg-neutral-800 border-neutral-900 text-gray-500 cursor-not-allowed opacity-50"
                                )}>
                                <span>{gameState === 'BETTING' ? 'Place Bet' : 'Race in Progress'}</span>
                                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                                    {gameState === 'BETTING' ? 'arrow_forward' : 'hourglass_bottom'}
                                </span>
                            </button>
                            <p className="text-center text-[9px] text-white/20 font-bold uppercase tracking-widest">By betting you agree to Degen Terms.</p>
                        </div>
                    </div>

                    {/* Footer Stats */}
                    <div className="bg-black/60 border-t border-white/5 p-5 flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">Total Pool</span>
                            <span className="text-sm font-mono font-black text-white">4,291.5 SOL</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">Active Bets</span>
                            <span className="text-sm font-mono font-black text-white">1,342</span>
                        </div>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 border border-white/10 bg-gradient-to-r from-accentGold/5 to-transparent">
                    <div className="size-10 rounded-xl bg-accentGold/20 flex items-center justify-center shrink-0 border border-accentGold/20">
                        <span className="material-symbols-outlined text-accentGold">emoji_events</span>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[11px] font-black text-white uppercase tracking-tight">Jackpot Multiplier Active!</p>
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Random 2x payout chance this race.</p>
                    </div>
                </div>
            </aside>
        </main>
    );
};
