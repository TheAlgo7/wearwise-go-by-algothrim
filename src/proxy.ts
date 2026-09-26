import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, AUTH_MAX_AGE_S, configuredPin, isValidToken } from '@/lib/pin';

/**
 * PIN gate, the same one WearWise Wardrobe uses. Pages redirect to /unlock and
 * API routes answer 401 until the PIN has been entered on this device.
 */
export async function proxy(req: NextRequest) {
  if (!configuredPin()) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!(await isValidToken(token))) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/unlock';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Slide the expiry forward so an active user never sees the PIN screen twice.
  const res = NextResponse.next();
  res.cookies.set(AUTH_COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_MAX_AGE_S,
    path: '/',
  });
  return res;
}

export const config = {
  // Everything except the unlock flow, PWA plumbing and static files. The
  // keep-alive is exempt because Vercel Cron carries no cookie.
  matcher: [
    '/((?!unlock|api/unlock|api/keepalive|offline|_next/static|_next/image|favicon|manifest\\.webmanifest|sw\\.js|icons/|products/|apple-touch-icon|icon-|og-image).*)',
  ],
};
