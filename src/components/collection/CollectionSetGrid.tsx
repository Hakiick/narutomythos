'use client';

import type { Card } from '@prisma/client';
import { CollectionGridCard } from './CollectionGridCard';

interface CollectionSetGridProps {
  cards: Card[];
  ownedQuantities: Record<string, number>;
  prices: Record<string, number>;
}

export function CollectionSetGrid({ cards, ownedQuantities, prices }: CollectionSetGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((card) => {
        const quantity = ownedQuantities[card.id] ?? 0;
        return (
          <CollectionGridCard
            key={card.id}
            card={card}
            isOwned={quantity > 0}
            quantity={quantity}
            price={prices[card.id]}
          />
        );
      })}
    </div>
  );
}
