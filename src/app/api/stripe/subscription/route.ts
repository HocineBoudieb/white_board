import { NextResponse } from 'next/server';
import { getUid } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function PUT(req: Request) {
  try {
    const uid = await getUid();

    if (!uid) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { priceId } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user || !user.stripeSubscriptionId) {
      return new NextResponse('No active subscription found', { status: 404 });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    // Update the subscription to the new price
    const updatedSubscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: priceId,
      }],
      proration_behavior: 'always_invoice',
    });

    // Update user record with new price ID immediately for UI consistency
    // Webhook will confirm it later
    await prisma.user.update({
      where: { id: uid },
      data: {
        stripePriceId: priceId,
      }
    });

    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('[STRIPE_SUBSCRIPTION_UPDATE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const uid = await getUid();

    if (!uid) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user || !user.stripeSubscriptionId) {
      return new NextResponse('No active subscription found', { status: 404 });
    }

    // Cancel immediately to allow full downgrade
    const canceledSubscription = await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    // Update user record to remove subscription details immediately
    await prisma.user.update({
      where: { id: uid },
      data: {
        stripeSubscriptionId: null,
        stripePriceId: 'free',
        stripeCurrentPeriodEnd: null,
      }
    });

    return NextResponse.json({ subscription: canceledSubscription });
  } catch (error) {
    console.error('[STRIPE_SUBSCRIPTION_CANCEL]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
