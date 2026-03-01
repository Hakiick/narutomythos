import { getTranslations } from 'next-intl/server';
import { getArticles } from '@/lib/services/article-service';
import { ArticleCard } from '@/components/news/ArticleCard';
import { PageHeroBg } from '@/components/layout/PageHeroBg';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const heroCards = [
  { id: 'KS-007', alt: 'Jiraiya — Toad Sage' },
  { id: 'KS-132', alt: 'Jiraiya — Toad Mouth Trap' },
];

export default async function NewsPage() {
  const t = await getTranslations('News');
  const articles = await getArticles();

  return (
    <div>
      <PageHeroBg title={t('title')} subtitle={t('subtitle')} cards={heroCards}>
        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <a href="https://narutotcgmythos.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t('officialSite')}
            </a>
          </Button>
        </div>
      </PageHeroBg>
      <div className="container mx-auto px-4 py-8">
        {articles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-muted-foreground">
            {t('noArticles')}
          </p>
        )}
      </div>
    </div>
  );
}
