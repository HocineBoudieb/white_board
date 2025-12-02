import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserSubscriptionPlan } from '@/utils/subscription';
import { getUid } from '@/lib/auth';

export async function GET() {
  const uid = await getUid();

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
    email: user.email,
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
