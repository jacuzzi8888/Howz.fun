'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface DemoModeContextType {
    isDemoMode: boolean;
    setIsDemoMode: (value: boolean) => void;
}

const DemoModeContext = createContext<DemoModeContextType>({
    isDemoMode: true, // Default to true for presentation
    setIsDemoMode: () => { },
});

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDemoMode, setIsDemoMode] = useState(true);
    const searchParams = useSearchParams();

    useEffect(() => {
        // URL override: ?demo=false to see real on-chain behavior
        const demoParam = searchParams.get('demo');
        if (demoParam === 'false') {
            setIsDemoMode(false);
            console.log('[DemoMode] Real On-Chain Mode Activated via URL');
        } else if (demoParam === 'true') {
            setIsDemoMode(true);
            console.log('[DemoMode] Presentation God-Mode Activated via URL');
        }
    }, [searchParams]);

    return (
        <DemoModeContext.Provider value={{ isDemoMode, setIsDemoMode }}>
            {children}
        </DemoModeContext.Provider>
    );
};

export const useDemoMode = () => useContext(DemoModeContext);
