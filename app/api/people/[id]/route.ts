import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { personSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/http';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = personSchema.partial().parse(await request.json());
    const person = await prisma.person.update({
      where: { id: params.id },
      data: payload
    });

    return NextResponse.json(person);
  } catch (error) {
    return handleApiError(error);
  }
}
