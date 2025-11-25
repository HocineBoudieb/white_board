import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get('uid')?.value;

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
