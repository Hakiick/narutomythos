import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export default function HomePage() {
  const t = useTranslations('Home');

  const features = [
    {
      title: t('features.cardDatabase'),
      description: t('features.cardDatabaseDesc'),
      href: '/cards',
      icon: '🃏',
    },
    {
      title: t('features.deckBuilder'),
      description: t('features.deckBuilderDesc'),
      href: '/decks',
      icon: '🏗️',
    },
    {
      title: t('features.collectionManager'),
      description: t('features.collectionManagerDesc'),
      href: '/collection',
      icon: '📦',
    },
    {
      title: t('features.pricing'),
      description: t('features.pricingDesc'),
      href: '/pricing',
      icon: '💰',
    },
    {
      title: t('features.news'),
      description: t('features.newsDesc'),
      href: '/news',
      icon: '📰',
    },
    {
      title: t('features.organizedPlay'),
      description: t('features.organizedPlayDesc'),
      href: '/events',
      icon: '🏆',
    },
    {
      title: t('features.rulebook'),
      description: t('features.rulebookDesc'),
      href: '/rules',
      icon: '📖',
    },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
          {t('title')}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
          {t('subtitle')}
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/cards">
              {t('exploreCards')}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/decks">
              {t('buildDeck')}
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Link key={feature.href} href={feature.href} className="group">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mb-2 text-4xl">{feature.icon}</div>
                <CardTitle className="group-hover:text-primary">
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
