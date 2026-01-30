export { };

declare global {
    interface Window {
        Jupiter: {
            init: (config: {
                displayMode?: 'modal' | 'integrated' | 'widget';
                integratedTargetId?: string;
                endpoint: string;
                strictTokenList?: boolean;
                defaultExplorer?: string;
                formProps?: {
                    fixedInputMint?: boolean;
                    fixedOutputMint?: boolean;
                    swapMode?: 'ExactIn' | 'ExactOut';
                    initialAmount?: string;
                    initialInputMint?: string;
                    initialOutputMint?: string;
                };
            }) => void;
            close: () => void;
        };
    }
}
