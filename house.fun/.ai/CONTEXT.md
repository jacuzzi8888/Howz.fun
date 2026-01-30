# house.fun — Current Context

## Tech Stack
- Next.js 14 (App Router)
- TypeScript (strict mode)
- tRPC for API
- Drizzle ORM + Supabase (Postgres)
- Tailwind CSS + shadcn/ui
- Zustand for state
- Solana wallet-adapter

## Design Tool
- Google Stitch (MCP integrated)
- Project ID: house-fun

## Current Task
Project scaffold and configuration

## Key Decisions
- All prices from Jupiter API
- Real-time game state via MagicBlock
- Encrypted randomness via Arcium
- Wallet-only auth (no email)

## Color Palette
- Background: #0A0A0F
- Surface: #141420
- Primary: #8B5CF6 (purple)
- Secondary: #06B6D4 (cyan)
- Accent: #F59E0B (gold)

## DO NOT
- Use Prisma (we use Drizzle)
- Create new utility files without checking existing
- Install dependencies without asking
- Use any other ORM
