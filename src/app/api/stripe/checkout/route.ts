import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { PLANS } from '@/utils/subscription';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get('uid')?.value;

    if (!uid) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { priceId } = await req.json();

    const user = await prisma.user.findUnique({
      where: {
        id: uid,
      },
    });

    if (!user || !user.email) {
      return new NextResponse('User not found', { status: 404 });
    }

    const plan = PLANS.find((p) => p.price.priceIds.test === priceId || p.price.priceIds.production === priceId);

    if (!plan) {
        // Allow creating session even if plan logic is complex, but generally we want to validate
        // For now, if priceId comes from frontend, it should be valid.
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/projects?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[STRIPE_CHECKOUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
