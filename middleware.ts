// /middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Rutas públicas (sin login)
const PUBLIC_PATHS = ['/auth', '/api', '/favicon.ico', '/_next', '/logo.png', '/auth-bg.jpg'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir rutas públicas
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Crear respuesta y cliente con helpers (lee/renueva cookies)
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Obtener sesión (si hay, helpers la sacan de cookies)
  const { data: { session } } = await supabase.auth.getSession();

  // Si NO hay sesión ⇒ a /auth
  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/auth';
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Hay sesión ⇒ permitir
  return res;
}

// Aplica a todo salvo estáticos
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|auth-bg.jpg).*)'],
};