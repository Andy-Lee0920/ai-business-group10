import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isPresentationRequest } from './src/config';
import { isProtectedAppPath } from './src/config/protected-routes';
import { shouldResetAppSession } from './src/config/session-refresh';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = withPathnameHeader(request);

  if (shouldResetAppSession(request.nextUrl)) {
    return NextResponse.redirect(new URL('/auth/reset', request.url));
  }

  if (isPresentationRequest(request)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: withPathnameHeader(request) } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = !isPresentationRequest(request) && isProtectedAppPath(pathname);

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  if (pathname === '/' && user) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return response;
}

function withPathnameHeader(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-fevio-pathname', request.nextUrl.pathname);
  return requestHeaders;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
