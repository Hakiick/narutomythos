import type { Card } from '@prisma/client';
import { CardItem } from './CardItem';

interface CardGridProps {
  cards: Card[];
}

export function CardGrid({ cards }: CardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  );
}
