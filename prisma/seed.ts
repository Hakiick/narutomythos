import { PrismaClient } from '@prisma/client';
import cardData from './data/cards.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  for (const card of cardData) {
    await prisma.card.upsert({
      where: { id: card.id },
      update: {
        nameEn: card.nameEn,
        nameFr: card.nameFr,
        type: card.type as 'CHARACTER' | 'MISSION' | 'JUTSU',
        rarity: card.rarity as 'C' | 'UC' | 'R' | 'AR' | 'S' | 'L',
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
        type: card.type as 'CHARACTER' | 'MISSION' | 'JUTSU',
        rarity: card.rarity as 'C' | 'UC' | 'R' | 'AR' | 'S' | 'L',
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

  console.log(`Seeded ${cardData.length} cards successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
