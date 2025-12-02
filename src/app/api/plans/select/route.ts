import { NextResponse } from 'next/server';
import { getUid } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const uid = await getUid();

    if (!uid) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { planSlug } = await req.json();

    if (planSlug === 'free') {
      await prisma.user.update({
        where: { id: uid },
        data: { stripePriceId: 'free' },
      });
      return NextResponse.json({ ok: true });
    }

    return new NextResponse('Invalid plan', { status: 400 });
  } catch (error) {
    console.error('[PLAN_SELECT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
