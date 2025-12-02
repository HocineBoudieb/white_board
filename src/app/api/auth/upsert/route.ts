import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyIdToken } from '@/lib/auth';

export async function POST(req: Request) {
  const bodyRaw = await req.json().catch(() => ({}));
  const body = bodyRaw as Record<string, unknown>;
  
  const idToken = typeof body?.idToken === 'string' ? body.idToken : '';
  
  if (!idToken) {
      return NextResponse.json({ error: 'idToken required' }, { status: 401 });
  }

  const payload = await verifyIdToken(idToken);
  if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const uid = payload.sub;
  if (!uid) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
  }

  const email = typeof body?.email === 'string' ? body.email : undefined;
  const name = typeof body?.name === 'string' ? body.name : undefined;

  let user;
  try {
    user = await prisma.user.upsert({ 
      where: { id: uid }, 
      update: { email, name }, 
      create: { id: uid, email, name } 
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Database error';
    return NextResponse.json({ error: 'DB_AUTH_FAILED', message }, { status: 500 });
  }
  
  const hasSubscription = !!(user.stripePriceId || user.stripeSubscriptionId);
  const res = NextResponse.json({ ok: true, hasSubscription });
  
  // Set secure session cookie
  res.cookies.set('session', idToken, { 
      path: '/', 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 // 1 hour matches ID token expiry
  });
  
  // Remove the insecure cookie
  res.cookies.delete('uid');
  
  return res;
}
