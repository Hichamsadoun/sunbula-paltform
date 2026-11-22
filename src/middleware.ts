import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC = ['/', '/login'];

/** Cheap gate: bounce visitors without a session cookie to /login. Real checks run in each page/action. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname) || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }
  if (!req.cookies.get('sunbula_session')) {
    if (pathname.startsWith('/api/')) return new NextResponse('Unauthorized', { status: 401 });
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
