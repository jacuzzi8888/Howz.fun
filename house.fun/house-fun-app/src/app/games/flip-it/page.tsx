import { FlipItGame } from "~/components/games/FlipItGame";

export default function FlipItPage() {
    return (
        <div className="flex flex-col h-[calc(100vh-80px)]">
            <FlipItGame />
        </div>
    );
}
