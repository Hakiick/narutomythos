import { NextRequest, NextResponse } from 'next/server';
import { priceQuerySchema } from '@/lib/validators/price';
import { getCardMarketPrice } from '@/lib/services/price-service';
import type { ApiResponse } from '@/types';
import type { CardMarketPrice } from '@/lib/services/price-service';

type RouteParams = { params: Promise<{ cardId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { cardId } = await params;
  const { searchParams } = new URL(request.url);

  const parsed = priceQuerySchema.safeParse({
    source: searchParams.get('source') || undefined,
    currency: searchParams.get('currency') || undefined,
    limit: searchParams.get('limit') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Invalid query parameters' },
      { status: 400 }
    );
  }

  try {
    const result = await getCardMarketPrice(cardId, parsed.data.currency);
    return NextResponse.json<ApiResponse<CardMarketPrice>>({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch price';
    const status = message === 'Card not found' ? 404 : 500;
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status });
  }
}
