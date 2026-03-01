# Naruto Mythos — CLAUDE.md

## Project Overview

**narutomythos.com** — Web companion app for the Naruto Mythos TCG (release March 13, 2026).
Inspired by optcg.app. Web-first, future mobile via Capacitor. Multilingual FR/EN via subdomains.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript strict
- **ORM**: Prisma + PostgreSQL (Docker local dev, VPS OVH prod)
- **Auth**: NextAuth.js (Auth.js v5) — credentials, Google, Discord
- **Styling**: Tailwind CSS + shadcn/ui
- **i18n**: next-intl (FR/EN, locale routing)
- **Validation**: Zod
- **Tests**: Vitest
- **Package manager**: pnpm
- **Mobile (future)**: Capacitor
- **Scanner (future)**: TensorFlow.js

## Project Structure

```
src/
├── app/
│   └── [locale]/          # next-intl locale routing
│       ├── layout.tsx      # Root layout with providers
│       ├── page.tsx        # Home page
│       ├── cards/          # Card database
│       ├── decks/          # Deck builder
│       ├── collection/     # Collection manager
│       └── api/            # API routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── cards/              # Card-specific components
│   ├── decks/              # Deck-specific components
│   ├── collection/         # Collection components
│   └── layout/             # Navbar, Footer, etc.
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # NextAuth config
│   ├── validators/         # Zod schemas
│   └── services/           # Pluggable service abstractions
├── messages/
│   ├── en.json             # English translations
│   └── fr.json             # French translations
└── types/                  # Shared TypeScript types
```

## Architecture Principles

1. **Server Components by default** — Only add `"use client"` when interactivity is needed
2. **Mobile-first CSS** — Design for 375px first, scale up
3. **i18n native** — All user-facing text via next-intl, NEVER hardcode strings
4. **Pluggable services** — Business logic behind abstractions in `src/lib/services/`
5. **Zero vendor lock-in** — Standard PostgreSQL, standard auth
6. **Zod everywhere** — Validate all inputs at API boundaries

## Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm start                  # Start production server

# Database
pnpm db:push                # Push Prisma schema to DB
pnpm db:migrate             # Run migrations
pnpm db:seed                # Seed database
pnpm db:studio              # Open Prisma Studio

# Quality
pnpm lint                   # ESLint
pnpm typecheck              # TypeScript check
pnpm test                   # Vitest
pnpm validate               # lint + typecheck + build

# Docker
docker compose up -d        # Start PostgreSQL
docker compose down         # Stop PostgreSQL
```

## Validation Checklist

Before committing, ALWAYS run:
```bash
pnpm lint && pnpm typecheck && pnpm build
```

## Prisma Schema Overview

### Enums
- `CardType`: CHARACTER, MISSION, JUTSU
- `Rarity`: C, UC, R, AR, S, L
- `CollectionStatus`: OWNED, WISHLIST, TRADE
- `CardCondition`: MINT, NEAR_MINT, EXCELLENT, GOOD, PLAYED, POOR
- `PriceSource`: EBAY, CARDMARKET
- `Currency`: EUR, USD, GBP

### Models
- **Card** — id (KS-001), nameEn/Fr, type, rarity, chakra, power, keywords, group, effectEn/Fr, imageUrl, set, cardNumber
- **User** + Account + Session — NextAuth.js standard
- **Deck** + DeckCard — slug for public sharing, quantity max 2
- **CollectionCard** — status owned/wishlist/trade, condition, language
- **CardPrice** — source, price, currency, confidence, variant

## Naruto Mythos TCG Rules

### Deck Construction
- Deck: exactly 30 cards, max 2 copies per card
- 3 personal Mission cards (outside deck)
- Match: 4 rounds, missions D → C → B → A

### Card Types
- **Character**: Chakra (cost), Power (strength), Keywords, Group (village)
- **Mission**: Rank D/C/B/A, special effects
- **Jutsu**: Activatable techniques, pay Chakra cost

### Key Mechanics
- **Hidden**: Deploy face-down (cost 1) for bluffing
- **Upgrade**: Activate techniques by paying Chakra
- **Movement**: Ninjas move between missions

## Card Attributes
- id, nameEn, nameFr, type, rarity, chakra, power, keywords[], group, effectEn, effectFr, imageUrl, set, cardNumber

## First Set: Konoha Shidō — 152 cards
- Characters: Naruto, Sasuke, Sakura, Kakashi, Zabuza, Haku, Iruka...
- Villages: Leaf Village, Hidden Mist Village
- Rarities: Common → Legendary (22 carat gold, 2000 worldwide)

## Subagent Routing

Use the appropriate subagent for specialized tasks:
- `frontend-dev` → UI, pages, layouts, Tailwind, shadcn, i18n
- `backend-dev` → API routes, Prisma, auth, service abstractions
- `data-specialist` → Card data, seed JSON, imports
- `deck-validator` → Deck validation logic, stats, game rules
- `pricing-agent` → Price scraping, LLM extraction, normalization
- `naruto-creative-designer` → Visual design, themes, animations, Naruto-universe atmosphere, CSS effects
- `game-rules-expert` → Game engine logic, rules enforcement, phase flow, edge cases, AI behavior
- `card-effects-expert` → All 162 cards, effect parsing/execution, card balance, synergy patterns

## Commit Convention

Use conventional commits:
- `feat:` — New feature
- `fix:` — Bug fix
- `chore:` — Maintenance, config, dependencies
- `refactor:` — Code restructuring
- `test:` — Tests
- `docs:` — Documentation
