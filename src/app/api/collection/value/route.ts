import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { collectionValueQuerySchema } from '@/lib/validators/price';
import { getCollectionValue } from '@/lib/services/price-service';
import type { ApiResponse } from '@/types';
import type { CollectionValue } from '@/lib/services/price-service';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = collectionValueQuerySchema.safeParse({
    currency: searchParams.get('currency') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Invalid query parameters' },
      { status: 400 }
    );
  }

  try {
    const value = await getCollectionValue(session.user.id, parsed.data.currency);
    return NextResponse.json<ApiResponse<CollectionValue>>({ data: value });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Failed to calculate collection value' },
      { status: 500 }
    );
  }
}
