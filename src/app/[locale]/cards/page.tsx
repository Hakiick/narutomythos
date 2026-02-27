import { getTranslations } from 'next-intl/server';
import { getCards, getCardGroups } from '@/lib/services/card-service';
import type { CardType, Rarity } from '@prisma/client';
import { CardGrid } from '@/components/cards/CardGrid';
import { CardFilters } from '@/components/cards/CardFilters';

interface CardsPageProps {
  searchParams: Promise<{
    type?: string;
    rarity?: string;
    search?: string;
    group?: string;
  }>;
}

export default async function CardsPage({ searchParams }: CardsPageProps) {
  const sp = await searchParams;
  const t = await getTranslations('Cards');

  const filters = {
    type: sp.type as CardType | undefined,
    rarity: sp.rarity as Rarity | undefined,
    search: sp.search,
    group: sp.group,
  };

  const [cards, groups] = await Promise.all([
    getCards(filters),
    getCardGroups(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <CardFilters groups={groups} />

      <div className="mt-2 mb-6 text-sm text-muted-foreground">
        {t('cardCount', { count: cards.length })}
      </div>

      {cards.length > 0 ? (
        <CardGrid cards={cards} />
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {t('noCards')}
        </p>
      )}
    </div>
  );
}
