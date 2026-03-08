import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/http';
import { personSchema } from '@/lib/schemas';

export async function GET() {
  const people = await prisma.person.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(people);
}

export async function POST(request: NextRequest) {
  try {
    const payload = personSchema.parse(await request.json());
    const person = await prisma.person.create({
      data: {
        ...payload,
        avatarUrl: payload.avatarUrl || null
      }
    });
    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
