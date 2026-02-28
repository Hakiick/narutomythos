import { prisma } from '@/lib/prisma';
import type { Article } from '@prisma/client';

export async function getArticles(page = 1, limit = 10): Promise<Article[]> {
  return prisma.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  return prisma.article.findUnique({
    where: { slug },
  });
}

export async function getArticleCount(): Promise<number> {
  return prisma.article.count({
    where: { published: true },
  });
}
