import { NextResponse, type NextRequest } from 'next/server';
import { FEVIO_JUNE_TEST_SEED_COOKIE } from '../../../../src/lib/june-test-schedule-seed';

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next') || '/home';
  const response = NextResponse.redirect(new URL(next.startsWith('/') ? next : '/home', request.url));
  response.cookies.set(FEVIO_JUNE_TEST_SEED_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
