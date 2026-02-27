import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { removeCardFromDeck } from '@/lib/services/deck-service';
import type { ApiResponse } from '@/types';

type RouteParams = { params: Promise<{ id: string; cardId: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { id, cardId } = await params;

  try {
    await removeCardFromDeck(id, session.user.id, cardId);
    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({ data: { deleted: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove card';
    const status = message === 'Not authorized' ? 403 : message === 'Deck not found' ? 404 : 500;
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status });
  }
}
