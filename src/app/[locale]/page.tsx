import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

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
          <Link
            href="/cards"
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('exploreCards')}
          </Link>
          <Link
            href="/decks"
            className="rounded-lg border border-border px-6 py-3 font-semibold transition-colors hover:bg-secondary"
          >
            {t('buildDeck')}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-card/80"
          >
            <div className="mb-4 text-4xl">{feature.icon}</div>
            <h2 className="mb-2 text-xl font-semibold group-hover:text-primary">
              {feature.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
