'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CashierModal } from '~/components/wallet/CashierModal';

export const Header: React.FC = () => {
    const [isCashierOpen, setIsCashierOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 group-hover:border-primary/50 transition-colors">
                                <span className="material-symbols-outlined text-primary text-2xl">house</span>
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-white group-hover:text-glow transition-all">house.fun</span>
                        </Link>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex flex-col items-end mr-4">
                                <span className="text-[10px] text-gray-400 font-bold tracking-[0.2em]">BALANCE</span>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-lg">142.05</span>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">SOL</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCashierOpen(true)}
                                className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-[#0A0A0F] px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(7,204,0,0.3)] hover:shadow-[0_0_25px_rgba(7,204,0,0.5)] cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                                <span>Connect Wallet</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <CashierModal isOpen={isCashierOpen} onClose={() => setIsCashierOpen(false)} />
        </>
    );
};
