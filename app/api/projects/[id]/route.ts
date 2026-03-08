import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { projectSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/http';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = projectSchema.partial().parse(await request.json());
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...payload,
        startDate: payload.startDate ? new Date(payload.startDate) : undefined,
        endDate: payload.endDate ? new Date(payload.endDate) : undefined
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error);
  }
}
