// /middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas (no requieren login)
const PUBLIC_PATHS = [
  '/auth',          // login / registro
  '/_next',         // assets internos de Next.js
  '/api',           // funciones API
  '/favicon.ico',
  '/logo.png',
  '/auth-bg.jpg',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1️⃣ Permitir si es una ruta pública
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2️⃣ Leer cookie de sesión Supabase
  const access_token = req.cookies.get('sb-access-token')?.value;

  // 3️⃣ Si no hay sesión, redirigir a /auth
  if (!access_token) {
    const loginUrl = new URL('/auth', req.url);
    loginUrl.searchParams.set('redirectedFrom', pathname); // opcional: para volver luego
    return NextResponse.redirect(loginUrl);
  }

  // 4️⃣ Si hay sesión, permitir acceso
  return NextResponse.next();
}

// 5️⃣ Aplica a todas las rutas menos archivos estáticos
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|auth-bg.jpg).*)',
  ],
};