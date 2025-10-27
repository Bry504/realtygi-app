import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const isAuth = !!session;
  const isAuthRoute = pathname.startsWith('/auth');
  const isPublic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico';

  if (!isAuth && !isAuthRoute && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('next', pathname || '/');
    return NextResponse.redirect(url);
  }

  if (isAuth && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return res; // 👈 importante devolver el mismo res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
