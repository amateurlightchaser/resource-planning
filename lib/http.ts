import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Validation error', details: error.flatten() }, { status: 400 });
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
