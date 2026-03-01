import { NextRequest, NextResponse } from 'next/server';
import type { Card } from '@prisma/client';
import { scannerLookupSchema } from '@/lib/validators/scanner';
import { getCardByCode } from '@/lib/services/scanner-service';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = scannerLookupSchema.safeParse({
    code: searchParams.get('code'),
  });

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Invalid card code. Expected format: KS-XXX' },
      { status: 400 }
    );
  }

  try {
    const card = await getCardByCode(parsed.data.code);

    if (!card) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Card>>({ data: card });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Failed to look up card' },
      { status: 500 }
    );
  }
}
