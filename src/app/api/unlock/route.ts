import { NextResponse } from 'next/server';
import { AUTH_COOKIE, AUTH_MAX_AGE_S, configuredPin, pinToken } from '@/lib/pin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const pin = configuredPin();
  if (!pin) return NextResponse.json({ ok: true }); // gate not configured

  let body: { pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (body.pin?.trim() !== pin) {
    // Slow down guessing a little; one user, keep it simple.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: 'Wrong PIN' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await pinToken(pin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_MAX_AGE_S,
    path: '/',
  });
  return res;
}
