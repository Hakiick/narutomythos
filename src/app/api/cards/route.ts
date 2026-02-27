import { NextRequest, NextResponse } from 'next/server';
import type { Card } from '@prisma/client';
import { cardFiltersSchema } from '@/lib/validators/card';
import { getCards } from '@/lib/services/card-service';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams);
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
