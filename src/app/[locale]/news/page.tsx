import { getTranslations } from 'next-intl/server';
import { getArticles } from '@/lib/services/article-service';
import { ArticleCard } from '@/components/news/ArticleCard';

export default async function NewsPage() {
  const t = await getTranslations('News');
  const articles = await getArticles();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

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
  );
}
