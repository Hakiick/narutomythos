import { useTranslations } from 'next-intl';

export default function DecksPage() {
  const t = useTranslations('Decks');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <p className="py-12 text-center text-muted-foreground">
        {t('noDecks')}
      </p>
    </div>
  );
}
