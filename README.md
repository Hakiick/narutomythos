# Naruto Mythos

Web companion app for the **Naruto Mythos TCG** (first set: *Konoha Shido*, release March 13, 2026).

## Features

- **Card Database** — Browse all 152 cards with advanced filters (type, rarity, chakra range, power range, keywords, effect type)
- **Deck Builder** — Create, save, and share 30-card decks with validation and statistics
- **Collection Manager** — Track owned cards, wishlist, and trades with completion stats
- **Market Prices** — Estimated values from eBay and Cardmarket with currency conversion (EUR/USD/GBP)
- **News** — Articles and announcements from the Naruto Mythos TCG universe
- **Organized Play** — Upcoming tournaments, Pre-Releases, and competitive events
- **Rulebook** — Interactive rulebook with all game mechanics explained

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript strict |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 (credentials, Google, Discord) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| i18n | next-intl (FR/EN) |
| Validation | Zod |
| Tests | Vitest |
| Package manager | pnpm |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (for PostgreSQL)

### 1. Clone and install

```bash
git clone https://github.com/Hakiick/narutomythos.git
cd narutomythos
pnpm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://narutomythos:narutomythos@localhost:5432/narutomythos?schema=public"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
```

### 3. Start PostgreSQL

```bash
docker run -d --name narutomythos-db -p 5432:5432 \
  -e POSTGRES_USER=narutomythos \
  -e POSTGRES_PASSWORD=narutomythos \
  -e POSTGRES_DB=narutomythos \
  postgres:16-alpine
```

### 4. Set up the database

```bash
pnpm prisma migrate deploy   # Apply migrations
pnpm db:seed                  # Seed cards, articles, events
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run tests (Vitest) |
| `pnpm validate` | lint + typecheck + build |
| `pnpm db:push` | Push Prisma schema to DB (dev only) |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed database (162 cards, 5 articles, 4 events) |
| `pnpm db:studio` | Open Prisma Studio |

## Project Structure

```
src/
├── app/[locale]/           # Pages (locale routing: /en, /fr)
│   ├── cards/              # Card database
│   ├── decks/              # Deck builder
│   ├── collection/         # Collection manager
│   ├── news/               # Articles
│   ├── events/             # Organized play
│   └── rules/              # Rulebook
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── cards/              # Card components
│   ├── decks/              # Deck components
│   ├── collection/         # Collection components
│   ├── news/               # Article components
│   ├── events/             # Event components
│   ├── rules/              # Rulebook components
│   └── layout/             # Navbar, Footer
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # NextAuth config
│   ├── validators/         # Zod schemas
│   └── services/           # Business logic services
├── messages/
│   ├── en.json             # English translations
│   └── fr.json             # French translations
└── types/                  # Shared TypeScript types
prisma/
├── schema.prisma           # Database schema
├── migrations/             # SQL migrations
├── seed.ts                 # Seed script
└── data/                   # Seed data (JSON)
    ├── cards.json          # 162 cards
    ├── articles.json       # 5 articles
    └── events.json         # 4 events
```

## Database Schema

### Models

- **Card** — 162 cards (KS-001 to KS-152 + missions) with bilingual names/effects
- **User** / Account / Session — NextAuth.js authentication
- **Deck** / DeckCard — Deck building (30 cards, max 2 copies)
- **CollectionCard** — Collection tracking (owned, wishlist, trade)
- **Article** — Bilingual news articles
- **Event** — Tournament and event listings
- **CardPrice** — Market price data (eBay, Cardmarket)

### Enums

- `CardType`: CHARACTER, MISSION, JUTSU
- `Rarity`: C, UC, R, AR, S, L, MYTHOS
- `EventFormat`: LOCAL, REGIONAL, NATIONAL, EUROPEAN, PRERELEASE, CASUAL

## License

This is a fan-made companion app. Naruto Mythos TCG is a trademark of its respective owners.
