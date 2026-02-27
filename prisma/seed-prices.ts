import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rarity-based price ranges in EUR
const RARITY_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  C:  { min: 0.10, max: 0.50 },
  UC: { min: 0.30, max: 1.50 },
  R:  { min: 1.00, max: 5.00 },
  AR: { min: 3.00, max: 15.00 },
  S:  { min: 8.00, max: 30.00 },
  L:  { min: 50.00, max: 200.00 },
};

const SOURCES = ['EBAY', 'CARDMARKET'] as const;
const CURRENCIES = ['EUR', 'USD', 'GBP'] as const;
const CONDITIONS = ['MINT', 'NEAR_MINT', 'EXCELLENT', 'GOOD', 'PLAYED'] as const;

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

async function main() {
  console.log('Seeding price data...');

  const cards = await prisma.card.findMany();
  let totalPrices = 0;

  for (const card of cards) {
    const range = RARITY_PRICE_RANGES[card.rarity] || { min: 1, max: 5 };
    const basePrice = (range.min + range.max) / 2;

    // Generate 15-20 normal price entries
    const count = 15 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
      const currency = Math.random() > 0.3 ? 'EUR' : CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];
      const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];

      // Normal price with +/- 30% variance
      const variance = 0.7 + Math.random() * 0.6;
      const price = Math.round(basePrice * variance * 100) / 100;

      const soldAt = randomDate(30);
      const createdAt = new Date(soldAt.getTime() + Math.random() * 86400000); // 0-1 day after sold

      await prisma.cardPrice.create({
        data: {
          cardId: card.id,
          source,
          price,
          currency,
          condition,
          variant: 'standard',
          confidence: randomBetween(0.75, 0.98),
          url: `https://example.com/${source.toLowerCase()}/${card.id}/${i}`,
          soldAt,
          createdAt,
        },
      });
      totalPrices++;
    }

    // Add 1-2 intentional outliers (for testing outlier filtering)
    const outlierCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < outlierCount; i++) {
      const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
      const outlierPrice = basePrice * (5 + Math.random() * 10); // 5-15x the base price

      await prisma.cardPrice.create({
        data: {
          cardId: card.id,
          source,
          price: Math.round(outlierPrice * 100) / 100,
          currency: 'EUR',
          condition: 'MINT',
          variant: 'standard',
          confidence: randomBetween(0.5, 0.65), // Low confidence for outliers
          url: `https://example.com/${source.toLowerCase()}/${card.id}/outlier-${i}`,
          soldAt: randomDate(30),
        },
      });
      totalPrices++;
    }
  }

  console.log(`Seeded ${totalPrices} price entries for ${cards.length} cards.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
