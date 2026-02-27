import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createDeckSchema } from '@/lib/validators/deck';
import { getUserDecks, createDeck } from '@/lib/services/deck-service';
import type { ApiResponse } from '@/types';
import type { Deck } from '@prisma/client';
import type { DeckWithCardCount } from '@/lib/services/deck-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const decks = await getUserDecks(session.user.id);
    return NextResponse.json<ApiResponse<DeckWithCardCount[]>>({ data: decks });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Failed to fetch decks' },
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
  const parsed = createDeckSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Invalid input' },
      { status: 400 }
    );
  }

  try {
    const deck = await createDeck(session.user.id, parsed.data);
    return NextResponse.json<ApiResponse<Deck>>({ data: deck }, { status: 201 });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Failed to create deck' },
      { status: 500 }
    );
  }
}
