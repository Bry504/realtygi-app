// middleware desactivado temporalmente
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

// sin matcher = NO corre en ninguna ruta
export const config = { matcher: [] };