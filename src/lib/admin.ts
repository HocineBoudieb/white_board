import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

// Replace with actual admin emails or use env var
const ADMIN_EMAILS = process.env.ADMIN_EMAILS 
  ? process.env.ADMIN_EMAILS.split(',') 
  : ['admin@example.com']; 

export async function checkIsAdmin() {
  const cookieStore = await cookies();
  const uid = cookieStore.get('uid')?.value;

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
