import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Hit daily by Vercel Cron (see vercel.json). The free-tier Supabase project
 * auto-pauses after ~7 days without API activity; a single lightweight REST
 * read per day keeps it counted as active. WearWise Wardrobe pings the same
 * shared project on an opposite schedule for redundancy.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase env not configured' }, { status: 500 });
  }

  const res = await fetch(`${url}/rest/v1/trips?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });

  return NextResponse.json(
    { ok: res.ok, status: res.status, pingedAt: new Date().toISOString() },
    { status: res.ok ? 200 : 502 }
  );
}
