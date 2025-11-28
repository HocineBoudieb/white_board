'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { 
      _count: { 
        select: { projects: true } 
      } 
    }
  });
  return users;
}

export async function getStats() {
  await requireAdmin();
  const [userCount, projectCount, proUsers] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.user.count({ 
      where: { 
        stripePriceId: { not: null } 
      } 
    }),
  ]);
  
  return {
    userCount,
    projectCount,
    proUsers
  };
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  try {
    // Delete projects first to ensure clean removal
    await prisma.project.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

export async function resetAiUsage(userId: string) {
  await requireAdmin();
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { aiTokensUsed: 0 }
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to reset usage' };
  }
}
