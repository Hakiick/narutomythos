import { PrismaClient } from '@prisma/client';
import type { CardType, Rarity, EventFormat } from '@prisma/client';
import cardData from './data/cards.json';
import articleData from './data/articles.json';
import eventData from './data/events.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed cards
  for (const card of cardData) {
    await prisma.card.upsert({
      where: { id: card.id },
      update: {
        nameEn: card.nameEn,
        nameFr: card.nameFr,
        type: card.type as CardType,
        rarity: card.rarity as Rarity,
        chakra: card.chakra,
        power: card.power,
        keywords: card.keywords,
        group: card.group,
        effectEn: card.effectEn,
        effectFr: card.effectFr,
        imageUrl: card.imageUrl,
        set: card.set,
        cardNumber: card.cardNumber,
      },
      create: {
        id: card.id,
        nameEn: card.nameEn,
        nameFr: card.nameFr,
        type: card.type as CardType,
        rarity: card.rarity as Rarity,
        chakra: card.chakra,
        power: card.power,
        keywords: card.keywords,
        group: card.group,
        effectEn: card.effectEn,
        effectFr: card.effectFr,
        imageUrl: card.imageUrl,
        set: card.set,
        cardNumber: card.cardNumber,
      },
    });
  }
  console.log(`Seeded ${cardData.length} cards.`);

  // Clean up old articles and events before re-seeding
  await prisma.article.deleteMany({});
  await prisma.event.deleteMany({});

  // Seed articles
  for (const article of articleData) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        titleEn: article.titleEn,
        titleFr: article.titleFr,
        summaryEn: article.summaryEn,
        summaryFr: article.summaryFr,
        contentEn: article.contentEn,
        contentFr: article.contentFr,
        imageUrl: article.imageUrl,
        published: article.published,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      },
      create: {
        slug: article.slug,
        titleEn: article.titleEn,
        titleFr: article.titleFr,
        summaryEn: article.summaryEn,
        summaryFr: article.summaryFr,
        contentEn: article.contentEn,
        contentFr: article.contentFr,
        imageUrl: article.imageUrl,
        published: article.published,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      },
    });
  }
  console.log(`Seeded ${articleData.length} articles.`);

  // Seed events
  for (const event of eventData) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: {
        nameEn: event.nameEn,
        nameFr: event.nameFr,
        descriptionEn: event.descriptionEn,
        descriptionFr: event.descriptionFr,
        format: event.format as EventFormat,
        date: new Date(event.date),
        endDate: event.endDate ? new Date(event.endDate) : null,
        location: event.location,
        city: event.city,
        country: event.country,
        isOnline: event.isOnline,
        registrationUrl: event.registrationUrl,
        maxPlayers: event.maxPlayers,
        imageUrl: event.imageUrl,
      },
      create: {
        slug: event.slug,
        nameEn: event.nameEn,
        nameFr: event.nameFr,
        descriptionEn: event.descriptionEn,
        descriptionFr: event.descriptionFr,
        format: event.format as EventFormat,
        date: new Date(event.date),
        endDate: event.endDate ? new Date(event.endDate) : null,
        location: event.location,
        city: event.city,
        country: event.country,
        isOnline: event.isOnline,
        registrationUrl: event.registrationUrl,
        maxPlayers: event.maxPlayers,
        imageUrl: event.imageUrl,
      },
    });
  }
  console.log(`Seeded ${eventData.length} events.`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
