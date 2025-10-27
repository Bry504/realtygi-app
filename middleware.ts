// /middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_FILE = /\.(.*)$/;

// Rutas públicas (no autenticadas)
const PUBLIC_ROUTES = new Set<string>([
  '/auth',
]);

export async function middleware(req: NextRequest) {
  // Ignora assets/estáticos para no romperlos
  const { pathname } = req.nextUrl;
  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Crea un cliente Supabase de servidor con cookies legibles por el edge
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          res.cookies.set(name, '', { ...options, expires: new Date(0) });
        },
      },
    }
  );

  // Obtén al usuario desde la cookie (si no hay cookie => sin sesión)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = PUBLIC_ROUTES.has(pathname);

  // 1) Si NO hay sesión y NO es ruta pública => a /auth
  if (!user && !isAuthRoute) {
    const url = new URL('/auth', req.url);
    url.searchParams.set('redirect', pathname); // opcional: para volver luego
    return NextResponse.redirect(url);
  }

  // 2) Si SÍ hay sesión y está yendo a /auth => mándalo a /
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // 3) (opcional) Chequea estado ACTIVO en tu tabla de negocio.
  //    Esto añade ~1 consulta, pero te deja bloquear usuarios no activos desde el edge.
  //    Descomenta si quieres bloquear aquí (RLS debe permitir SELECT por usuario autenticado).
  /*
  if (user && !isAuthRoute) {
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('estado')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!perfil || perfil.estado !== 'ACTIVO') {
      // si no está activo, lo sacamos a /auth (o muestra una página /no-autorizado)
      return NextResponse.redirect(new URL('/auth', req.url));
    }
  }
  */

  return res;
}

// Dónde se ejecuta el middleware
export const config = {
  matcher: [
    // todo lo que no sea estático ni imágenes:
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(png|jpg|gif|svg|ico|css|js|map)$).*)',
  ],
};