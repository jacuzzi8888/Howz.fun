import { ShadowPokerGame } from "~/components/games/ShadowPokerGame";

export default function ShadowPokerPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] overflow-hidden">
            <ShadowPokerGame />
        </div>
    );
}
