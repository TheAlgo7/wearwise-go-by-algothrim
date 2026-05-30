import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client using the anon key.
 *
 * RLS COUPLING (V1): row-level security is intentionally DISABLED on all tables
 * (single-user personal app — see schema.sql / README "Security Note"). Because of
 * that, this anon client can both READ and WRITE every table, which is why the
 * `/api/pack` route and the Add-item flow can insert with it.
 *
 * When RLS is turned on for multi-user, writes from route handlers will start
 * failing — switch those callers to a service-role admin client (as the Wardrobe
 * app's `createAdminClient` does) or add proper RLS policies + auth.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server component — cannot set cookies, ignored
          }
        },
      },
    },
  );
}
