// /middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Rutas públicas (sin sesión)
  const PUBLIC = new Set<string>([
    '/auth',
    // agrega aquí otras públicas si necesitas
  ]);

  // Si la ruta es pública: deja pasar
  if (PUBLIC.has(pathname)) return NextResponse.next();

  // Lee el token de Supabase: cookie 'sb-*-auth-token'
  const hasToken = Array.from(req.cookies.getAll()).some((c) =>
    c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  // Si NO hay token y la ruta es privada -> manda a /auth
  if (!hasToken) {
    const loginUrl = new URL('/auth', req.url);
    loginUrl.searchParams.set('next', pathname); // opcional: volver después de login
    return NextResponse.redirect(loginUrl);
  }

  // Hay sesión -> deja pasar
  return NextResponse.next();
}

// ⚠️ Lista explícitamente rutas privadas, sin regex complejos
export const config = {
  matcher: [
    '/',                          // tu página principal (privada)
    '/orden-de-requerimiento',    // otra privada (ejemplo)
    // agrega aquí más rutas privadas si aplican
  ],
};