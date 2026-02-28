'use client';

import { useLocale } from 'next-intl';
import type { Article } from '@prisma/client';

interface ArticleContentProps {
  article: Article;
}

export function ArticleContent({ article }: ArticleContentProps) {
  const locale = useLocale();
  const content = locale === 'fr' ? article.contentFr : article.contentEn;

  return (
    <div className="prose prose-sm prose-invert max-w-none sm:prose-base">
      {content.split('\n').map((line: string, i: number) => {
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="mt-6 mb-3 text-lg font-bold">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="mt-8 mb-4 text-xl font-bold">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h1 key={i} className="mt-8 mb-4 text-2xl font-bold">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        // Handle bold markers
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="mb-3 leading-relaxed text-muted-foreground">
            {parts.map((part: string, j: number) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={j} className="font-semibold text-foreground">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}
