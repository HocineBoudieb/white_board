import { User } from '@prisma/client';

export const PLANS = [
  {
    name: 'Gratuit',
    slug: 'free',
    quota: 3, // 3 boards
    aiTokens: 0,
    price: {
      amount: 0,
      priceIds: {
        test: '',
        production: '',
      },
    },
  },
  {
    name: 'Pro',
    slug: 'pro',
    quota: 10, // 10 boards
    aiTokens: 100000,
    price: {
      amount: 5,
      priceIds: {
        test: 'price_1SXTxaRxxcmCKpcfLXfY84V1',
        production: '',
      },
    },
  },
  {
    name: 'Team',
    slug: 'team',
    quota: 9999, 
    aiTokens: 500000,
    price: {
      amount: 15,
      priceIds: {
        test: 'price_1SXTxzRxxcmCKpcf09cXWyYL',
        production: '',
      },
    },
  },
];

export function getUserSubscriptionPlan(user: User | null) {
  if (!user || !user.stripePriceId) {
    return PLANS[0];
  }

  const plan = PLANS.find((plan) => plan.price.priceIds.test === user.stripePriceId) || PLANS[0];

  return {
    ...plan,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd?.getTime(),
    stripeCustomerId: user.stripeCustomerId,
    isSubscribed: !!user.stripePriceId && user.stripeCurrentPeriodEnd?.getTime()! + 86_400_000 > Date.now(),
  };
}
