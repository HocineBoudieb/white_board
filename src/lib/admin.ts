import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getUid } from '@/lib/auth';

// Replace with actual admin emails or use env var
const ADMIN_EMAILS = process.env.ADMIN_EMAILS 
  ? process.env.ADMIN_EMAILS.split(',') 
  : ['admin@example.com']; 

export async function checkIsAdmin() {
  const uid = await getUid();

  if (!uid) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { email: true }
  });

  if (!user || !user.email) {
    return false;
  }

  return ADMIN_EMAILS.includes(user.email);
}

export async function requireAdmin() {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect('/');
  }
}
