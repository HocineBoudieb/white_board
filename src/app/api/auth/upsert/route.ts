import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const uid = typeof body?.uid === 'string' ? body.uid : '';
  const email = typeof body?.email === 'string' ? body.email : undefined;
  const name = typeof body?.name === 'string' ? body.name : undefined;
  if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 });
  await prisma.user.upsert({ where: { id: uid }, update: { email, name }, create: { id: uid, email, name } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('uid', uid, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  return res;
}
