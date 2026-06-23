// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const referer = request.headers.get('referer');

  // 1. List of protected routes that should ONLY be accessible via button clicks
  const protectedRoutes = ['/arena', '/forum', '/chat', '/profile', '/admin'];

  // Check if the current request is targeting one of these routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // If the referer header is missing, they typed the URL directly or bookmarked it
    if (!referer) {
      console.log(`⚠️ Blocked direct access attempt to: ${pathname}`);
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Double check that the referer came from our own domain (prevents direct links from external sites)
    const host = request.headers.get('host') || '';
    if (!referer.includes(host)) {
      console.log(`⚠️ Blocked external link access to: ${pathname}`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Ensure the middleware runs only on page routes (ignores assets, images, and API calls)
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. _next/static (static files)
     * 3. _next/image (image optimization files)
     * 4. favicon.ico, public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};