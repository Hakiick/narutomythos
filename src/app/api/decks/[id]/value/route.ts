import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deckValueQuerySchema } from '@/lib/validators/price';
import { getDeckById } from '@/lib/services/deck-service';
import { getDeckValue } from '@/lib/services/price-service';
import type { ApiResponse } from '@/types';
import type { DeckValue } from '@/lib/services/price-service';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const { searchParams } = new URL(request.url);
  const parsed = deckValueQuerySchema.safeParse({
    currency: searchParams.get('currency') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Invalid query parameters' },
      { status: 400 }
    );
  }

  try {
    const deck = await getDeckById(id);
    if (!deck) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    // Private decks: only owner can view value
    if (!deck.isPublic) {
      const session = await auth();
      if (session?.user?.id !== deck.userId) {
        return NextResponse.json<ApiResponse<never>>(
          { error: 'Deck not found' },
          { status: 404 }
        );
      }
    }

    const value = await getDeckValue(id, parsed.data.currency);
    return NextResponse.json<ApiResponse<DeckValue>>({ data: value });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Failed to calculate deck value' },
      { status: 500 }
    );
  }
}
