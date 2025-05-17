import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the path the user is trying to access
  const path = request.nextUrl.pathname;
  
  // Define protected routes
  const protectedRoutes = ['/profile', '/find-peers', '/connections'];
  
  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    path === route || path.startsWith(`${route}/`)
  );
  
  // Check for Supabase auth cookie
  // Supabase uses 'sb-{project-ref}-auth-token' as the cookie name
  const supabaseAuthCookie = Array.from(request.cookies.keys()).find(
    cookie => cookie.startsWith('sb-') && cookie.endsWith('-auth-token')
  );
  
  const isAuthenticated = !!supabaseAuthCookie;
  
  // If trying to access a protected route without authentication, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Specific matcher for the routes we want to protect
export const config = {
  matcher: [
    '/profile',
    '/profile/:path*',
    '/find-peers',
    '/find-peers/:path*',
    '/connections',
    '/connections/:path*',
  ],
};