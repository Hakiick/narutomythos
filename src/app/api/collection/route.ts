import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addToCollectionSchema, collectionFiltersSchema } from '@/lib/validators/collection';
import { getUserCollection, getCollectionStats, addToCollection, getOwnedCardIdsForSet } from '@/lib/services/collection-service';
import type { ApiResponse } from '@/types';
import type { CollectionCard } from '@prisma/client';
import type { CollectionCardWithCard, CollectionStats } from '@/lib/services/collection-service';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);

  // If ?set= is provided, return owned quantities for that set
  const setCode = searchParams.get('set');
  if (setCode) {
    try {
      const owned = await getOwnedCardIdsForSet(session.user.id, setCode);
      const ownedQuantities: Record<string, number> = {};
      for (const [cardId, qty] of owned) {
        ownedQuantities[cardId] = qty;
      }
      return NextResponse.json<ApiResponse<{ ownedQuantities: Record<string, number> }>>({
        data: { ownedQuantities },
      });
    } catch {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'Failed to fetch owned cards' },
        { status: 500 }
      );
    }
  }

  const parsed = collectionFiltersSchema.safeParse({
    status: searchParams.get('status') || undefined,
    search: searchParams.get('search') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Invalid filters' },
      { status: 400 }
    );
  }

  try {
    const [cards, stats] = await Promise.all([
      getUserCollection(session.user.id, parsed.data.status, parsed.data.search),
      getCollectionStats(session.user.id),
    ]);

    return NextResponse.json<ApiResponse<{ cards: CollectionCardWithCard[]; stats: CollectionStats }>>({
      data: { cards, stats },
    });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = addToCollectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Invalid input' },
      { status: 400 }
    );
  }

  try {
    const entry = await addToCollection(session.user.id, parsed.data);
    return NextResponse.json<ApiResponse<CollectionCard>>({ data: entry }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add to collection';
    const status = message === 'Card not found' ? 404 : 500;
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status });
  }
}
