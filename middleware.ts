// /middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Cookies que pone Supabase Auth en el navegador
  const hasAccess = req.cookies.get('sb-access-token') || req.cookies.get('supabase-auth-token');

  // Rutas públicas
  const isPublic = pathname.startsWith('/auth') || pathname.startsWith('/_next') || pathname.startsWith('/public');

  if (!hasAccess && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('next', pathname || '/');
    return NextResponse.redirect(url);
  }

  // Si YA está autenticado y está en /auth, mándalo a la home
  if (hasAccess && pathname === '/auth') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};