import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // NextAuth redirects to /auth/signin (no locale prefix)
  // Redirect to /{locale}/auth/signin for proper i18n handling
  if (pathname.startsWith('/auth/')) {
    const locale =
      request.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(fr|en)/:path*', '/auth/:path*'],
};
