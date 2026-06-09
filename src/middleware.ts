import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from './lib/auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that bypass cookie authentication
  const isPublicPath = pathname === '/login' || 
                        pathname.startsWith('/api/auth/login') ||
                        pathname.startsWith('/api/auth/setup-admin');

  // Cron paths are validated with CRON_SECRET header in the route handlers
  const isCronPath = pathname.startsWith('/api/cron/');

  if (isCronPath) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get('seo_auth')?.value;
  const payload = token ? await verifyTokenEdge(token) : null;

  // 1. If not logged in and path is NOT public, redirect to /login
  if (!payload && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If logged in:
  if (payload) {
    // Check if password change is forced
    // To do this, we need to inspect the payload. We can embed mustChangePassword in the JWT payload!
    // Let's check if the token payloads has mustChangePassword. 
    // Wait, let's look at the database. If must_change_password is true, the user should be redirected to /change-password.
    // In our JWT token, let's include mustChangePassword so we don't have to hit the database on every middleware execution.
    // Let's add mustChangePassword to the JWT payload definition.
    const mustChange = (payload as any).mustChangePassword;

    if (mustChange && pathname !== '/change-password' && !pathname.startsWith('/api/auth')) {
      const changePasswordUrl = new URL('/change-password', request.url);
      return NextResponse.redirect(changePasswordUrl);
    }

    // Redirect logged in user away from login page to dashboard
    if (pathname === '/login') {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // Protect admin paths from non-admin roles
    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

// Config to specify which paths middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
};
