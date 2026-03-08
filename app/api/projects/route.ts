import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/http';
import { projectSchema } from '@/lib/schemas';

export async function GET() {
  const projects = await prisma.project.findMany({ where: { isArchived: false }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  try {
    const payload = projectSchema.parse(await request.json());
    const project = await prisma.project.create({
      data: {
        ...payload,
        startDate: payload.startDate ? new Date(payload.startDate) : null,
        endDate: payload.endDate ? new Date(payload.endDate) : null
      }
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
