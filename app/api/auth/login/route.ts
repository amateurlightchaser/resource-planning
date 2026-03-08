import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setSession, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  setSession(user.id);
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
}
