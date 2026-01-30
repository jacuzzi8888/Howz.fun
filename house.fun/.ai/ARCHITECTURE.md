# house.fun — Architecture

## Project Structure
```
house.fun/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Lobby
│   │   ├── flip/               # Flip It game
│   │   ├── mfc/                # Memecoin Fight Club
│   │   ├── derby/              # Degen Derby
│   │   ├── poker/              # Shadow Poker
│   │   └── api/trpc/[trpc]/    # tRPC handler
│   ├── server/
│   │   ├── api/routers/        # tRPC routers
│   │   └── db/                 # Drizzle schema
│   ├── components/
│   │   ├── ui/                 # shadcn components
│   │   ├── layout/             # Header, Footer
│   │   ├── wallet/             # Wallet connect
│   │   └── games/              # Game components
│   ├── hooks/                  # React hooks
│   ├── lib/                    # Utilities
│   └── styles/
├── .ai/                        # AI context files
├── .mcp/                       # MCP server configs
├── drizzle/                    # Migrations
└── public/                     # Static assets
```

## Patterns

### Components
- Stitch-generated → src/components/games/
- shadcn UI → src/components/ui/
- Layout → src/components/layout/

### API
- tRPC routers per game
- Server actions for mutations

### State
- Zustand stores per game
- TanStack Query for server state

### Styling
- Tailwind utility classes
- CSS variables for tokens
- Glassmorphism: bg-white/5 backdrop-blur-xl
