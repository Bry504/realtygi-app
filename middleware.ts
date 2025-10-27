import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  // Importante: usa la misma Response durante todo el middleware
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Crea cliente que sabe leer/renovar sesión y setear cookies
  const supabase = createMiddlewareClient({ req, res });

  // Forzamos lectura/refresh de sesión. Si el token expiró, aquí lo renueva y setea cookies.
  const { data: { session } } = await supabase.auth.getSession();

  const isAuth = !!session;
  const isAuthRoute = pathname.startsWith('/auth');
  const isPublic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico';

  // Sin sesión: bloquea todo excepto /auth y assets públicos
  if (!isAuth && !isAuthRoute && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('next', pathname || '/');
    return NextResponse.redirect(url);
  }

  // Con sesión: no permitas quedarse en /auth
  if (isAuth && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Pasa la respuesta con cookies refrescadas
  return res;
}

export const config = {
  // Protege todo menos los recursos estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};