import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateCollectionCardSchema } from '@/lib/validators/collection';
import { updateCollectionCard, removeFromCollection } from '@/lib/services/collection-service';
import type { ApiResponse } from '@/types';
import type { CollectionCard } from '@prisma/client';

type RouteParams = { params: Promise<{ id: string }> };

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
  const parsed = updateCollectionCardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Invalid input' },
      { status: 400 }
    );
  }

  try {
    const entry = await updateCollectionCard(id, session.user.id, parsed.data);
    return NextResponse.json<ApiResponse<CollectionCard>>({ data: entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update collection entry';
    const status = message === 'Not authorized' ? 403 : message === 'Collection entry not found' ? 404 : 500;
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
    await removeFromCollection(id, session.user.id);
    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({ data: { deleted: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove from collection';
    const status = message === 'Not authorized' ? 403 : message === 'Collection entry not found' ? 404 : 500;
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status });
  }
}
