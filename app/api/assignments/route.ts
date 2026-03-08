import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/http';
import { assignmentSchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const peopleIds = searchParams.get('peopleIds')?.split(',').filter(Boolean);
  const projectIds = searchParams.get('projectIds')?.split(',').filter(Boolean);

  const assignments = await prisma.assignment.findMany({
    where: {
      startDateTime: from ? { gte: new Date(from) } : undefined,
      endDateTime: to ? { lte: new Date(to) } : undefined,
      personId: peopleIds?.length ? { in: peopleIds } : undefined,
      projectId: projectIds?.length ? { in: projectIds } : undefined
    },
    include: { person: true, project: true },
    orderBy: { startDateTime: 'asc' }
  });

  return NextResponse.json(assignments);
}

export async function POST(request: NextRequest) {
  try {
    const payload = assignmentSchema.parse(await request.json());
    const assignment = await prisma.assignment.create({
      data: {
        ...payload,
        startDateTime: new Date(payload.startDateTime),
        endDateTime: new Date(payload.endDateTime)
      },
      include: { person: true, project: true }
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
