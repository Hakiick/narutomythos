import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { getUserDecks } from '@/lib/services/deck-service';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { CreateDeckButton } from '@/components/decks/CreateDeckButton';
import { LogIn } from 'lucide-react';

export default async function DecksPage() {
  const t = await getTranslations('Decks');
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
            <Link href="/auth/signin">
              <LogIn className="h-4 w-4" />
              {t('signInButton')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const decks = await getUserDecks(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <div className="mb-6">
        <CreateDeckButton />
      </div>

      {decks.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {t('noDecks')}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/decks/${deck.slug}`} className="group">
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="group-hover:text-primary">
                      {deck.name}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {deck.isPublic ? t('public') : t('private')}
                    </Badge>
                  </div>
                  {deck.description && (
                    <CardDescription className="line-clamp-2">
                      {deck.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-xs">
                    {t('deckCardCount', { count: deck.totalCardQuantity })}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
