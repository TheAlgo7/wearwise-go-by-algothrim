/**
 * One person uses Go, so one PIN: APP_PIN, the same PIN as WearWise Wardrobe.
 *
 * Without it the app was open to anyone with the link, including deleting a
 * trip. The PIN is entered once per device at /unlock and carried in an
 * httpOnly cookie holding SHA-256 of `owner:<pin>`, never the PIN itself.
 * With APP_PIN unset (local dev) the gate is off.
 */

export const AUTH_COOKIE = 'go_auth';

/** 400 days, Chrome's ceiling for a cookie; the proxy slides it forward on every visit. */
export const AUTH_MAX_AGE_S = 60 * 60 * 24 * 400;

export function configuredPin(): string | null {
  return process.env.APP_PIN?.trim() || null;
}

export async function pinToken(pin: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`owner:${pin}`));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function isValidToken(token: string | undefined): Promise<boolean> {
  const pin = configuredPin();
  return !!pin && !!token && token === (await pinToken(pin));
}
