import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getUserSubscriptionPlan } from '@/utils/subscription';

export async function GET() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('uid')?.value;

  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const projectCount = await prisma.project.count({
    where: { userId: uid },
  });

  const plan = getUserSubscriptionPlan(user);
  const hasSelectedPlan = !!(user.stripePriceId || user.stripeSubscriptionId);

  return NextResponse.json({
    hasSelectedPlan,
    plan: {
      name: plan.name,
      slug: plan.slug,
      quota: plan.quota,
      aiTokens: plan.aiTokens,
    },
    usage: {
      projects: projectCount,
      aiTokens: user.aiTokensUsed,
    },
  });
}
