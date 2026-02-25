'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '~/lib/utils';

export interface GameResultProps {
    isOpen: boolean;
    playerWon: boolean;
    title?: string;          // e.g. "You Won!" / "House Wins"
    subtitle?: string;       // e.g. "Outcome: HEADS" / "PEPE wins the match"
    amount?: number;         // SOL payout for wins
    betAmount?: number;      // Original bet for context on losses
    gameName?: string;       // "Flip It" / "Fight Club" / "Degen Derby"
    onPlayAgain: () => void;
    onClose?: () => void;    // Optional if different from play again
    ctaLabel?: string;       // Custom CTA text, default: "Play Again"
    secondaryCta?: {         // e.g. "Claim Winnings" for Fight Club
        label: string;
        onClick: () => void;
        loading?: boolean;
    };
}

export function GameResultModal({
    isOpen,
    playerWon,
    title,
    subtitle,
    amount,
    betAmount,
    gameName,
    onPlayAgain,
    onClose,
    ctaLabel = 'Play Again',
    secondaryCta,
}: GameResultProps) {
    const [showContent, setShowContent] = useState(false);
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);

    useEffect(() => {
        if (isOpen) {
            // Stagger the content reveal
            const timer = setTimeout(() => setShowContent(true), 150);
            // Generate celebration particles for wins
            if (playerWon) {
                const newParticles = Array.from({ length: 20 }, (_, i) => ({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    delay: Math.random() * 0.5,
                    size: Math.random() * 6 + 3,
                }));
                setParticles(newParticles);
            }
            return () => clearTimeout(timer);
        } else {
            setShowContent(false);
            setParticles([]);
        }
    }, [isOpen, playerWon]);

    if (!isOpen) return null;

    const handleClose = onClose || onPlayAgain;
    const displayTitle = title || (playerWon ? 'You Won!' : 'Better Luck Next Time');

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={handleClose}
        >
            {/* Backdrop */}
            <div className={cn(
                "absolute inset-0 transition-opacity duration-300",
                playerWon
                    ? "bg-black/70 backdrop-blur-sm"
                    : "bg-black/80 backdrop-blur-sm"
            )} />

            {/* Win particles */}
            {playerWon && particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full animate-ping pointer-events-none"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: ['#BBFF00', '#FFD700', '#00FF88', '#FF6B35'][p.id % 4],
                        animationDelay: `${p.delay}s`,
                        animationDuration: '1.5s',
                        opacity: 0.6,
                    }}
                />
            ))}

            {/* Modal Card */}
            <div
                className={cn(
                    "relative w-full max-w-sm rounded-3xl border-2 p-8 text-center transition-all duration-500 shadow-2xl",
                    showContent ? "scale-100 opacity-100" : "scale-90 opacity-0",
                    playerWon
                        ? "bg-gradient-to-b from-primary/20 via-black/95 to-black/95 border-primary/40 shadow-[0_0_60px_-10px_rgba(7,204,0,0.3)]"
                        : "bg-gradient-to-b from-danger/10 via-black/95 to-black/95 border-white/10"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>

                {/* Game badge */}
                {gameName && (
                    <div className="mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
                            {gameName}
                        </span>
                    </div>
                )}

                {/* Result icon */}
                <div className={cn(
                    "size-20 rounded-full flex items-center justify-center mx-auto mb-5 transition-all duration-700",
                    showContent ? "scale-100" : "scale-50",
                    playerWon
                        ? "bg-primary/20 shadow-[0_0_30px_rgba(7,204,0,0.3)]"
                        : "bg-white/5"
                )}>
                    <span className={cn(
                        "material-symbols-outlined text-5xl",
                        playerWon ? "text-primary" : "text-gray-500"
                    )}>
                        {playerWon ? 'celebration' : 'sentiment_dissatisfied'}
                    </span>
                </div>

                {/* Title */}
                <h2 className={cn(
                    "text-3xl font-black uppercase tracking-tight mb-2 transition-all duration-500",
                    showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                    playerWon ? "text-primary" : "text-white"
                )}>
                    {displayTitle}
                </h2>

                {/* Subtitle */}
                {subtitle && (
                    <p className={cn(
                        "text-white/60 text-sm mb-5 transition-all duration-500 delay-100",
                        showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    )}>
                        {subtitle}
                    </p>
                )}

                {/* Payout amount (for wins) */}
                {playerWon && amount !== undefined && amount > 0 && (
                    <div className={cn(
                        "mb-6 transition-all duration-500 delay-200",
                        showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    )}>
                        <p className="text-4xl font-black text-primary tracking-tight">
                            +{amount.toFixed(4)} <span className="text-xl">SOL</span>
                        </p>
                    </div>
                )}

                {/* Loss amount */}
                {!playerWon && betAmount !== undefined && betAmount > 0 && (
                    <div className={cn(
                        "mb-6 transition-all duration-500 delay-200",
                        showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    )}>
                        <p className="text-2xl font-black text-gray-500 tracking-tight">
                            -{betAmount.toFixed(4)} <span className="text-base">SOL</span>
                        </p>
                    </div>
                )}

                {/* Action buttons */}
                <div className={cn(
                    "flex flex-col gap-3 transition-all duration-500 delay-300",
                    showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                )}>
                    {/* Secondary CTA (e.g. "Claim Winnings") */}
                    {secondaryCta && (
                        <button
                            onClick={secondaryCta.onClick}
                            disabled={secondaryCta.loading}
                            className="w-full px-8 py-3.5 bg-primary hover:bg-primaryHover text-black font-black rounded-xl transition-all disabled:opacity-50 uppercase tracking-wider text-sm"
                        >
                            {secondaryCta.loading ? 'Processing...' : secondaryCta.label}
                        </button>
                    )}

                    {/* Primary CTA */}
                    <button
                        onClick={onPlayAgain}
                        className={cn(
                            "w-full px-8 py-3.5 font-black rounded-xl transition-all uppercase tracking-wider text-sm",
                            secondaryCta
                                ? "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                                : playerWon
                                    ? "bg-primary hover:bg-primaryHover text-black"
                                    : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        )}
                    >
                        {ctaLabel}
                    </button>
                </div>

                {/* Transaction link placeholder */}
                <button
                    className="mt-4 text-[10px] text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-widest font-bold"
                    onClick={handleClose}
                >
                    View on Solscan →
                </button>
            </div>
        </div>
    );
}
