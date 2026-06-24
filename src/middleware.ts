import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  if ((pathname.startsWith('/admin') || pathname.startsWith('/supervisor')) && !token) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/supervisor/:path*'],
};