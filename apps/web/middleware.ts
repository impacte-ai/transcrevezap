import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const publicPaths = ['/login', '/api/auth'];
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Verify session cookie exists and has reasonable format
  const sessionCookie = request.cookies.get('better-auth.session_token');
  if (!sessionCookie?.value || sessionCookie.value.length < 20) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For API routes, also check the cookie
  if (request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/auth')) {
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|static|favicon|manifest).*)'],
};
