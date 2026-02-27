import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateDeckSchema } from '@/lib/validators/deck';
import { getDeckById, updateDeck, deleteDeck } from '@/lib/services/deck-service';
import type { ApiResponse } from '@/types';
import type { Deck } from '@prisma/client';
import type { DeckWithCards } from '@/lib/services/deck-service';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const deck = await getDeckById(id);
    if (!deck) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    // Private decks: only owner can view
    if (!deck.isPublic) {
      const session = await auth();
      if (session?.user?.id !== deck.userId) {
        return NextResponse.json<ApiResponse<never>>(
          { error: 'Deck not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json<ApiResponse<DeckWithCards>>({ data: deck });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Failed to fetch deck' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateDeckSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Invalid input' },
      { status: 400 }
    );
  }

  try {
    const deck = await updateDeck(id, session.user.id, parsed.data);
    return NextResponse.json<ApiResponse<Deck>>({ data: deck });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update deck';
    const status = message === 'Not authorized' ? 403 : message === 'Deck not found' ? 404 : 500;
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    await deleteDeck(id, session.user.id);
    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({ data: { deleted: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete deck';
    const status = message === 'Not authorized' ? 403 : message === 'Deck not found' ? 404 : 500;
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status });
  }
}
