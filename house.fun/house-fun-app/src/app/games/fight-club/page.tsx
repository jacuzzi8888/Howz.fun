import { FightClubGame } from "~/components/games/FightClubGame";

export default function FightClubPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)]">
            <FightClubGame />
        </div>
    );
}
