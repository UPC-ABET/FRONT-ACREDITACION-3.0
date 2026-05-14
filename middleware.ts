import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('bearerToken')?.value
  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/auth')

  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Configuración para que el middleware no afecte a archivos estáticos o imágenes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}