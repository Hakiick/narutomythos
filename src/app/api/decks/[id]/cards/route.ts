import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addCardSchema } from '@/lib/validators/deck';
import { addCardToDeck } from '@/lib/services/deck-service';
import type { ApiResponse } from '@/types';
import type { DeckCard } from '@prisma/client';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = addCardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Invalid input' },
      { status: 400 }
    );
  }

  try {
    const deckCard = await addCardToDeck(id, session.user.id, parsed.data.cardId, parsed.data.quantity);
    return NextResponse.json<ApiResponse<DeckCard>>({ data: deckCard }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add card';
    const status =
      message === 'Not authorized' ? 403 :
      message === 'Deck not found' || message === 'Card not found' ? 404 :
      message.includes('full') || message.includes('Maximum') ? 400 :
      500;
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status });
  }
}
