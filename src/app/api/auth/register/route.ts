import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { registerSchema } from '@/lib/validators/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Invalid input' },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
      },
    });

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { data: { id: user.id } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Failed to register' },
      { status: 500 }
    );
  }
}
