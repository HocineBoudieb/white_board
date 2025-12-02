import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyIdToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api')) return NextResponse.next();
  if (pathname.startsWith('/_next')) return NextResponse.next();
  if (pathname === '/login') return NextResponse.next();
  if (pathname === '/favicon.ico') return NextResponse.next();

  const session = req.cookies.get('session')?.value || '';
  
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const payload = await verifyIdToken(session);
  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    const res = NextResponse.redirect(url);
    res.cookies.delete('session');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|login).*)'],
};
