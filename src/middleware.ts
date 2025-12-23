import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase is not configured, allow all routes (for development)
    // In production, you might want to redirect to an error page
    return response;
  }

  // Create Supabase client for middleware
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ['/play', '/profile', '/join'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Admin route
  const isAdminRoute = pathname.startsWith('/admin');

  // Public routes that authenticated users should be redirected from
  const publicAuthRoutes = ['/login'];
  const isPublicAuthRoute = publicAuthRoutes.includes(pathname);

  // Admin email check - trim whitespace and make case-insensitive
  const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];
  const userEmail = session?.user?.email?.toLowerCase().trim();
  const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);

  // Redirect logic for protected routes
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect logic for admin routes
  if (isAdminRoute) {
    if (!session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    if (!isAdmin) {
      // Non-admin users trying to access admin routes are redirected to /play
      return NextResponse.redirect(new URL('/play', request.url));
    }
  }

  // Redirect authenticated users away from login page
  if (isPublicAuthRoute && session) {
    return NextResponse.redirect(new URL('/play', request.url));
  }

  // Allow authenticated users to access home page (they can still see it)
  // But we could optionally redirect them to /play if desired
  // Uncomment below if you want to redirect authenticated users from home to /play
  // if (pathname === '/' && session) {
  //   return NextResponse.redirect(new URL('/play', request.url));
  // }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

