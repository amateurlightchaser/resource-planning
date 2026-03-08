import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/http';
import { timeOffSchema } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const peopleIds = searchParams.get('peopleIds')?.split(',').filter(Boolean);

  const timeOff = await prisma.timeOff.findMany({
    where: {
      startDateTime: from ? { gte: new Date(from) } : undefined,
      endDateTime: to ? { lte: new Date(to) } : undefined,
      personId: peopleIds?.length ? { in: peopleIds } : undefined
    },
    include: { person: true }
  });

  return NextResponse.json(timeOff);
}

export async function POST(request: NextRequest) {
  try {
    const payload = timeOffSchema.parse(await request.json());
    const timeOff = await prisma.timeOff.create({
      data: {
        ...payload,
        startDateTime: new Date(payload.startDateTime),
        endDateTime: new Date(payload.endDateTime)
      }
    });

    return NextResponse.json(timeOff, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
