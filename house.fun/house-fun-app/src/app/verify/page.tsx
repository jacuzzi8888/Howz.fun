'use client';

import React, { useState } from 'react';
import { api } from '~/trpc/react';

/**
 * /verify — Provably Fair Verification Page
 * 
 * Players can independently verify any bet result by inputting:
 * - Server Seed (revealed after bet resolves)
 * - Client Seed (player's own seed)
 * - Nonce (bet number)
 * - Expected Result (HEADS or TAILS)
 * 
 * The page computes HMAC_SHA256(serverSeed, clientSeed:nonce)
 * and shows whether the expected result matches.
 */
export default function VerifyPage() {
    const [serverSeed, setServerSeed] = useState('');
    const [clientSeed, setClientSeed] = useState('');
    const [nonce, setNonce] = useState(0);
    const [expectedResult, setExpectedResult] = useState<'HEADS' | 'TAILS'>('HEADS');
    const [showResult, setShowResult] = useState(false);

    const verifyQuery = api.fairness.verify.useQuery(
        { serverSeed, clientSeed, nonce, expectedResult },
        { enabled: showResult && serverSeed.length > 0 && clientSeed.length > 0 }
    );

    const handleVerify = () => {
        if (serverSeed && clientSeed) {
            setShowResult(true);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
                        <span className="material-symbols-outlined text-primary text-sm">verified</span>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Provably Fair</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        Verify Your Bet
                    </h1>
                    <p className="text-gray-400 text-sm max-w-md mx-auto">
                        Enter the seeds and nonce from your bet to independently verify the result.
                        The same inputs will always produce the same output — <span className="text-white font-bold">guaranteed.</span>
                    </p>
                </div>

                {/* Verification Form */}
                <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
                    {/* Server Seed */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Server Seed
                            <span className="text-gray-600 normal-case tracking-normal ml-2">(revealed after bet)</span>
                        </label>
                        <input
                            type="text"
                            value={serverSeed}
                            onChange={(e) => { setServerSeed(e.target.value); setShowResult(false); }}
                            placeholder="e.g. a3f8b2c1d4e5f6..."
                            className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>

                    {/* Client Seed */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Client Seed
                            <span className="text-gray-600 normal-case tracking-normal ml-2">(your seed)</span>
                        </label>
                        <input
                            type="text"
                            value={clientSeed}
                            onChange={(e) => { setClientSeed(e.target.value); setShowResult(false); }}
                            placeholder="e.g. b7d9e1f3a2c4..."
                            className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>

                    {/* Nonce + Expected Result */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nonce</label>
                            <input
                                type="number"
                                value={nonce}
                                onChange={(e) => { setNonce(parseInt(e.target.value) || 0); setShowResult(false); }}
                                min={0}
                                className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expected Result</label>
                            <div className="grid grid-cols-2 gap-2 h-12">
                                <button
                                    onClick={() => { setExpectedResult('HEADS'); setShowResult(false); }}
                                    className={`rounded-xl border-2 font-bold text-sm transition-all ${expectedResult === 'HEADS'
                                            ? 'bg-primary border-primary/50 text-black'
                                            : 'border-white/10 text-white/50 hover:text-white'
                                        }`}
                                >
                                    HEADS
                                </button>
                                <button
                                    onClick={() => { setExpectedResult('TAILS'); setShowResult(false); }}
                                    className={`rounded-xl border-2 font-bold text-sm transition-all ${expectedResult === 'TAILS'
                                            ? 'bg-red-500 border-red-500/50 text-white'
                                            : 'border-white/10 text-white/50 hover:text-white'
                                        }`}
                                >
                                    TAILS
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Verify Button */}
                    <button
                        onClick={handleVerify}
                        disabled={!serverSeed || !clientSeed}
                        className="w-full h-14 bg-primary hover:bg-primaryHover text-black text-xl font-black tracking-wider uppercase rounded-xl transition-all transform active:scale-[0.98] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(7,204,0,0.3)] disabled:shadow-none"
                    >
                        VERIFY
                    </button>
                </div>

                {/* Result Display */}
                {showResult && verifyQuery.data && (
                    <div className={`glass-panel rounded-2xl p-6 md:p-8 border-2 text-center space-y-4 ${verifyQuery.data.verified
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-red-500/30 bg-red-500/5'
                        }`}>
                        <div className={`size-16 rounded-full flex items-center justify-center mx-auto ${verifyQuery.data.verified ? 'bg-primary/20' : 'bg-red-500/20'
                            }`}>
                            <span className={`material-symbols-outlined text-3xl ${verifyQuery.data.verified ? 'text-primary' : 'text-red-500'
                                }`}>
                                {verifyQuery.data.verified ? 'check_circle' : 'error'}
                            </span>
                        </div>

                        <h2 className={`text-2xl font-black ${verifyQuery.data.verified ? 'text-primary' : 'text-red-500'
                            }`}>
                            {verifyQuery.data.verified ? 'VERIFIED ✓' : 'MISMATCH ✗'}
                        </h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between p-3 bg-black/40 rounded-xl">
                                <span className="text-gray-400">Computed Result:</span>
                                <span className="text-white font-bold">{verifyQuery.data.result}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-black/40 rounded-xl">
                                <span className="text-gray-400">Float Value:</span>
                                <span className="text-white font-mono">{verifyQuery.data.float.toFixed(10)}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-black/40 rounded-xl">
                                <span className="text-gray-400">HMAC Hash:</span>
                                <span className="text-white font-mono text-xs break-all">{verifyQuery.data.hmac.substring(0, 32)}...</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* How It Works */}
                <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">help</span>
                        How It Works
                    </h3>
                    <div className="space-y-3 text-sm text-gray-400">
                        <div className="flex gap-3">
                            <span className="text-primary font-bold shrink-0">1.</span>
                            <p>Before your bet, the server generates a random <span className="text-white">server seed</span> and shows you its SHA-256 hash (commitment).</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-primary font-bold shrink-0">2.</span>
                            <p>You place your bet with your own <span className="text-white">client seed</span>. The server can&apos;t change its seed after seeing your bet.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-primary font-bold shrink-0">3.</span>
                            <p>The result is computed: <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">HMAC_SHA256(serverSeed, clientSeed:nonce)</code></p>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-primary font-bold shrink-0">4.</span>
                            <p>After the bet resolves, the server reveals the original seed. You can verify it matches the commitment hash and produces the correct result.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
