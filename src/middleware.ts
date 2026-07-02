import { NextResponse, userAgent } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSession } from './lib/session';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const device = JSON.stringify(userAgent(request));
  const ip = request.ip || request.headers.get('x-real-ip');

  response.cookies.set('client-ip', ip || 'undefined-mw');
  response.cookies.set('device-info', device || '');

  try {
    await validateSession();
  } catch (error) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: '/dashboard/:path*',
}