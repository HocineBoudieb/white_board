import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const bodyRaw = await req.json().catch(() => ({}));
  const body = bodyRaw as Record<string, unknown>;
  const uid = typeof body?.uid === 'string' ? (body.uid as string) : '';
  const email = typeof body?.email === 'string' ? body.email : undefined;
  const name = typeof body?.name === 'string' ? body.name : undefined;
  if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 });
  try {
    await prisma.user.upsert({ where: { id: uid }, update: { email, name }, create: { id: uid, email, name } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Database error';
    return NextResponse.json({ error: 'DB_AUTH_FAILED', message }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('uid', uid, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  return res;
}
