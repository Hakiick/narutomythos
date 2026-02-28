import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Article } from '@prisma/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const t = useTranslations('News');
  const locale = useLocale();
  const format = useFormatter();

  const title = locale === 'fr' ? article.titleFr : article.titleEn;
  const summary = locale === 'fr' ? article.summaryFr : article.summaryEn;

  return (
    <Link href={`/news/${article.slug}`} className="group">
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader>
          {article.publishedAt && (
            <time className="text-xs text-muted-foreground">
              {format.dateTime(new Date(article.publishedAt), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          )}
          <CardTitle className="text-lg group-hover:text-primary">
            {title}
          </CardTitle>
          <CardDescription className="line-clamp-3">
            {summary}
          </CardDescription>
          <span className="mt-2 text-sm font-medium text-primary">
            {t('readMore')} →
          </span>
        </CardHeader>
      </Card>
    </Link>
  );
}
