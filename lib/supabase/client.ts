import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const isBrowser = typeof window !== 'undefined';
  const url = isBrowser ? `${window.location.origin}/api/db` : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https://', '').split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  return createBrowserClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: cookieName,
      }
    }
  )
}
