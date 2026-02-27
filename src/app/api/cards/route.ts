import { NextRequest, NextResponse } from 'next/server';
import { cardFiltersSchema } from '@/lib/validators/card';
import { getCards } from '@/lib/services/card-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams);
  const parsed = cardFiltersSchema.safeParse(rawParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters' },
      { status: 400 }
    );
  }

  try {
    const cards = await getCards(parsed.data);
    return NextResponse.json(cards);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}
