import { type NextRequest, NextResponse } from 'next/server';

// Better Auth sets the session cookie with this name.
// In HTTPS production it uses the plain name; on localhost it appends ".localhost".
const SESSION_COOKIE_NAMES = [
  'better-auth.session_token',
  'better-auth.session_token.localhost',
];

export function middleware(_request: NextRequest) {
  // In cross-domain deployments (Frontend on Vercel, Backend on Render),
  // session cookies are set on the backend domain.
  // Auth guard is handled client-side in /dashboard/page.tsx via useSession().
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
