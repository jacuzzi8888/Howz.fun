'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * useGameSounds — Sound effects for the FlipIt game
 * 
 * Plays short, punchy sounds for flip, win, and loss events.
 * Uses the Web Audio API for zero-latency playback.
 * Persists mute preference in localStorage.
 */

type SoundType = 'flip' | 'win' | 'loss' | 'click';

// Generate sounds procedurally via Web Audio API (no external files needed)
function createOscillator(
    ctx: AudioContext,
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3
) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}

function playFlipSound(ctx: AudioContext) {
    // Quick whoosh — rising pitch
    createOscillator(ctx, 200, 0.15, 'sawtooth', 0.1);
    setTimeout(() => createOscillator(ctx, 400, 0.1, 'sawtooth', 0.08), 50);
    setTimeout(() => createOscillator(ctx, 600, 0.08, 'sawtooth', 0.05), 100);
}

function playWinSound(ctx: AudioContext) {
    // Triumphant arpeggio — C E G C
    createOscillator(ctx, 523.25, 0.2, 'sine', 0.2);  // C5
    setTimeout(() => createOscillator(ctx, 659.25, 0.2, 'sine', 0.2), 100);  // E5
    setTimeout(() => createOscillator(ctx, 783.99, 0.2, 'sine', 0.2), 200);  // G5
    setTimeout(() => createOscillator(ctx, 1046.5, 0.3, 'sine', 0.25), 300); // C6
}

function playLossSound(ctx: AudioContext) {
    // Descending tone — sad trombone lite
    createOscillator(ctx, 400, 0.3, 'sine', 0.15);
    setTimeout(() => createOscillator(ctx, 350, 0.3, 'sine', 0.12), 150);
    setTimeout(() => createOscillator(ctx, 280, 0.4, 'sine', 0.1), 300);
}

function playClickSound(ctx: AudioContext) {
    // Quick click
    createOscillator(ctx, 800, 0.05, 'square', 0.08);
}

export function useGameSounds() {
    const ctxRef = useRef<AudioContext | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    // Load mute preference
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('house.fun:muted');
            if (saved === 'true') setIsMuted(true);
        }
    }, []);

    const getContext = useCallback(() => {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return ctxRef.current;
    }, []);

    const play = useCallback((sound: SoundType) => {
        if (isMuted) return;
        try {
            const ctx = getContext();
            switch (sound) {
                case 'flip': playFlipSound(ctx); break;
                case 'win': playWinSound(ctx); break;
                case 'loss': playLossSound(ctx); break;
                case 'click': playClickSound(ctx); break;
            }
        } catch (err) {
            // Silently fail — sounds are non-critical
            console.warn('[Sound] Failed to play:', err);
        }
    }, [isMuted, getContext]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newVal = !prev;
            localStorage.setItem('house.fun:muted', String(newVal));
            return newVal;
        });
    }, []);

    return { play, isMuted, toggleMute };
}
