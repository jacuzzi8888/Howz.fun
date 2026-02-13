import Link from "next/link";
import { GameCard } from "~/components/games/GameCard";
import { LOBBY_GAMES, LOBBY_STATS } from "~/data/mockData";
import { colors } from "~/lib/design-tokens";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-80px)] text-white flex flex-col relative overflow-x-hidden">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="bg-scanlines pointer-events-none absolute inset-0 z-0 opacity-15"></div>
      </div>


      {/* Main Content */}
      <main className="flex-grow z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center py-10 gap-6 relative">
          <h1 className="text-4xl md:text-6xl font-black tracking-[-0.03em] uppercase max-w-4xl leading-tight">
            The House Always Wins. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">So Can You.</span>
          </h1>
          <div className="glass-panel px-8 py-4 rounded-2xl flex flex-col items-center gap-1 mt-4 border-t border-accentGold/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <span className="text-xs font-bold text-accentGold tracking-[0.3em] uppercase">Current Jackpot</span>
            <div className="text-4xl md:text-5xl font-mono font-bold text-accentGold text-glow-gold tracking-tighter">
              $1,420,069.00
            </div>
          </div>
        </div>

        <section className="w-full">
          <div className="flex items-center justify-between mb-8 px-2 sm:px-0">
            <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight">
              <span className="material-symbols-outlined text-primary">casino</span>
              FEATURED GAMES
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-2 sm:px-0">
            {LOBBY_GAMES.map((game) => (
              <GameCard
                key={game.id}
                title={game.title}
                description={game.description}
                status={game.status}
                players={game.players}
                maxBet={game.maxBet}
                image={game.image}
                icon={game.icon}
                href={game.href}
                accent={game.accent}
                comingSoon={game.comingSoon}
              />
            ))}
          </div>
        </section>

        {/* Stats Bar */}
        <section className="glass-panel rounded-xl p-4 sm:p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 mt-8 w-full overflow-hidden">
          {LOBBY_STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center md:items-start flex-1 ${i < LOBBY_STATS.length - 1 ? "border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-10" : "md:pl-10"
                } ${i > 0 && i < LOBBY_STATS.length - 1 ? "md:px-10" : ""}`}
            >
              <span className="text-gray-400 text-xs font-bold tracking-[0.2em] mb-2 uppercase flex items-center gap-2">
                {stat.label}
                {stat.online && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </span>
              <span className="text-4xl font-black tracking-tighter text-white">{stat.value}</span>
            </div>
          ))}
        </section>
        <section className="flex justify-center py-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 group-hover:border-primary/50 transition-colors">
              <span className="material-symbols-outlined text-primary text-2xl">house</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-white group-hover:text-glow transition-all">Howz.fun</span>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-white/5 mt-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
            </Link>
          </div>
          <div className="text-xs font-bold text-gray-500 tracking-[0.1em] uppercase">
            © 2026 house.fun. All rights reserved. 18+ Only.
          </div>
          <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
            Solana Hackathon Build
          </div>
        </div>
      </footer>
    </main>
  );
}
