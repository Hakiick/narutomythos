import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { getDeckBySlug } from '@/lib/services/deck-service';
import { getCards } from '@/lib/services/card-service';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { DeckBuilder } from '@/components/decks/DeckBuilder';
import { ArrowLeft } from 'lucide-react';

interface DeckPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { slug } = await params;
  const t = await getTranslations('Decks');

  const deck = await getDeckBySlug(slug);
  if (!deck) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === deck.userId;

  // Private deck: only owner can view
  if (!deck.isPublic && !isOwner) notFound();

  // Fetch all available cards for the builder
  const allCards = isOwner ? await getCards() : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/decks">
            <ArrowLeft className="h-4 w-4" />
            {t('backToDecks')}
          </Link>
        </Button>
      </div>

      <DeckBuilder deck={deck} allCards={allCards} isOwner={isOwner} />
    </div>
  );
}
