import { getTranslations, getLocale } from 'next-intl/server';
import { getFormatter } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getArticleBySlug } from '@/lib/services/article-service';
import { ArticleContent } from '@/components/news/ArticleContent';
import { ChevronLeft } from 'lucide-react';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const t = await getTranslations('News');
  const locale = await getLocale();
  const format = await getFormatter();

  const article = await getArticleBySlug(slug);

  if (!article || !article.published) {
    notFound();
  }

  const title = locale === 'fr' ? article.titleFr : article.titleEn;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/news"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('backToNews')}
      </Link>

      <article className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
          {article.publishedAt && (
            <time className="mt-3 block text-sm text-muted-foreground">
              {t('publishedOn', {
                date: format.dateTime(new Date(article.publishedAt), {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
              })}
            </time>
          )}
        </header>

        <ArticleContent article={article} />
      </article>
    </div>
  );
}
