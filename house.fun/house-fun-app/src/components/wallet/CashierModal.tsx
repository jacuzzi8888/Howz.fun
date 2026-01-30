'use client';

import React from 'react';
import JupiterTerminal from './JupiterTerminal';

interface CashierModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CashierModal: React.FC<CashierModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#191e29] border border-white/10 rounded-3xl w-full max-w-[420px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                        </div>
                        <span className="font-bold text-white tracking-wide">CASHIER</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full bg-black/20 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Body - Jupiter Terminal */}
                <div className="h-[520px]">
                    <JupiterTerminal />
                </div>
            </div>
        </div>
    );
};
