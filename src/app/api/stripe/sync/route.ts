import { NextResponse } from 'next/server';
import { getUid } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST() {
  try {
    const uid = await getUid();

    if (!uid) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user || !user.stripeCustomerId) {
      return new NextResponse('User or Customer not found', { status: 404 });
    }

    // List active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      
      // Update DB with latest subscription info
      await prisma.user.update({
        where: { id: uid },
        data: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
      });

      return NextResponse.json({ updated: true, plan: subscription.items.data[0].price.id });
    } 

    return NextResponse.json({ updated: false, message: 'No active subscription found' });

  } catch (error) {
    console.error('[STRIPE_SYNC_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
