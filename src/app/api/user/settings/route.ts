import { NextResponse } from 'next/server';
import { getUid } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const uid = await getUid();

  if (!uid) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { preferences: true },
  });

  return NextResponse.json(user?.preferences || {});
}

export async function POST(req: Request) {
  const uid = await getUid();

  if (!uid) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const user = await prisma.user.update({
      where: { id: uid },
      data: { preferences: body },
      select: { preferences: true },
    });
    return NextResponse.json(user.preferences);
  } catch (error) {
    console.error('[SETTINGS_UPDATE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
