// /middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Deja públicas estas rutas
  if (pathname === '/' || pathname.startsWith('/auth')) {
    return NextResponse.next();
  }
  // (temporal) no bloquees nada más
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};