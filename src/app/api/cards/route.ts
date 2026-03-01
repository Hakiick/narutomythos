import { NextRequest, NextResponse } from 'next/server';
import type { Card } from '@prisma/client';
import { cardFiltersSchema } from '@/lib/validators/card';
import { getCards } from '@/lib/services/card-service';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawParams: Record<string, unknown> = Object.fromEntries(searchParams);
  // Convert comma-separated array params
  if (typeof rawParams.keywords === 'string') rawParams.keywords = rawParams.keywords.split(',').filter(Boolean);
  if (typeof rawParams.effectTypes === 'string') rawParams.effectTypes = rawParams.effectTypes.split(',').filter(Boolean);
  if (typeof rawParams.effectActions === 'string') rawParams.effectActions = rawParams.effectActions.split(',').filter(Boolean);
  const parsed = cardFiltersSchema.safeParse(rawParams);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Invalid query parameters' },
      { status: 400 }
    );
  }

  try {
    const cards = await getCards(parsed.data);
    return NextResponse.json<ApiResponse<Card[]>>({ data: cards });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}
