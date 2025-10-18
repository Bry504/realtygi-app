import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 🔓 Rutas públicas
  const publicPaths = ['/auth', '/_next', '/favicon.ico'];
  if (publicPaths.some((p) => req.nextUrl.pathname.startsWith(p))) {
    return res;
  }

  // 🔒 Si no hay sesión activa, redirige al login
  if (!session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    // Protege todo MENOS APIs, assets de Next y archivos estáticos del /public
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)',
  ],
};