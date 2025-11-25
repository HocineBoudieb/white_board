import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getUserSubscriptionPlan } from '@/utils/subscription';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const uid = cookieStore.get('uid')?.value;

  if (!uid) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
  });

  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  const plan = getUserSubscriptionPlan(user);

  if (plan.aiTokens === 0) {
    return new Response('Upgrade your plan to use AI', { status: 403 });
  }

  if (user.aiTokensUsed >= plan.aiTokens) {
    return new Response('AI Token limit reached', { status: 403 });
  }

  const { messages } = await req.json();

  const result = await streamText({
    model: groq('qwen/qwen3-32b'),
    messages,
    onFinish: async ({ usage }) => {
      const tokens = usage?.totalTokens || 500; // Estimate if usage not provided
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { aiTokensUsed: { increment: tokens } },
        });
      } catch (error) {
        console.error('Failed to update token usage:', error);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}