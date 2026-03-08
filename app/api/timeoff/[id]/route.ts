import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { timeOffSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/http';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = timeOffSchema.partial().parse(await request.json());
    const timeOff = await prisma.timeOff.update({
      where: { id: params.id },
      data: {
        ...payload,
        startDateTime: payload.startDateTime ? new Date(payload.startDateTime) : undefined,
        endDateTime: payload.endDateTime ? new Date(payload.endDateTime) : undefined
      }
    });

    return NextResponse.json(timeOff);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.timeOff.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
