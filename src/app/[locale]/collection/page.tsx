import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { getUserCollection, getCollectionStats } from '@/lib/services/collection-service';
import { getCards } from '@/lib/services/card-service';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { CollectionManager } from '@/components/collection/CollectionManager';
import { LogIn } from 'lucide-react';

export default async function CollectionPage() {
  const t = await getTranslations('Collection');
  const session = await auth();

  // Unauthenticated: sign-in prompt
  if (!session?.user?.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">{t('signInPrompt')}</p>
          <Button asChild>
            <Link href="/api/auth/signin">
              <LogIn className="h-4 w-4" />
              {t('signInButton')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const [cards, stats, allCards] = await Promise.all([
    getUserCollection(session.user.id),
    getCollectionStats(session.user.id),
    getCards(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <CollectionManager
        initialCards={cards}
        initialStats={stats}
        allCards={allCards}
      />
    </div>
  );
}
