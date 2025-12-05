import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getUserSubscriptionPlan } from '@/utils/subscription';
import { getUid } from '@/lib/auth';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  const uid = await getUid();

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
    ...({ response_format: { type: 'json_object' } } as any),
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