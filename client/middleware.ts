import { type NextRequest, NextResponse } from 'next/server';

// Better Auth sets the session cookie with this name.
// In HTTPS production it uses the plain name; on localhost it appends ".localhost".
const SESSION_COOKIE_NAMES = [
  'better-auth.session_token',
  'better-auth.session_token.localhost',
];

export function middleware(request: NextRequest) {
  const hasSession = SESSION_COOKIE_NAMES.some(
    name => request.cookies.has(name),
  );

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the intended destination so we can redirect back after login
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
