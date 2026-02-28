import { NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/services/article-service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article || !article.published) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ data: article });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
