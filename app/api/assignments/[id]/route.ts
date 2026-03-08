import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assignmentSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/http';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = assignmentSchema.partial().parse(await request.json());
    const assignment = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        ...payload,
        startDateTime: payload.startDateTime ? new Date(payload.startDateTime) : undefined,
        endDateTime: payload.endDateTime ? new Date(payload.endDateTime) : undefined
      },
      include: { person: true, project: true }
    });

    return NextResponse.json(assignment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.assignment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
