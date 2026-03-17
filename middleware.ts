import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware multi-tenant:
 * - Redirige /admin y /conserje a /default/admin y /default/conserje para compatibilidad.
 * - El resto de validaciones (sesión, cuenta activa) se hacen en las páginas.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(new URL('/default/admin', request.url))
  }
  if (pathname === '/conserje' || pathname === '/conserje/') {
    return NextResponse.redirect(new URL('/default/conserje', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/', '/conserje', '/conserje/'],
}
