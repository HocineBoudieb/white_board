import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get('uid')?.value;

    if (!uid) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { priceId } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user || !user.stripeSubscriptionId || !user.stripeCustomerId) {
      return new NextResponse('No active subscription found', { status: 404 });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    if (!subscription) {
         return new NextResponse('Subscription not found on Stripe', { status: 404 });
    }
    
    const items = [{
        id: subscription.items.data[0].id,
        price: priceId,
    }];

    const prorationDate = Math.floor(Date.now() / 1000);

    const invoice = await stripe.invoices.createPreview({
      customer: user.stripeCustomerId,
      subscription: user.stripeSubscriptionId,
      subscription_details: {
        items: items,
        proration_date: prorationDate,
      },
    });

    return NextResponse.json({ 
        amountDue: invoice.amount_due, 
        currency: invoice.currency,
        prorationDate 
    });
  } catch (error) {
    console.error('[STRIPE_SUBSCRIPTION_PREVIEW]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
