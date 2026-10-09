import { createServerClient as createSSRServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

/**
 * Server client (anon key + cookies).
 */
export function createServerClient() {
  const cookieStore = cookies()

  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Dipanggil dari Server Component — aman diabaikan
          }
        },
      },
    },
  )
}

/**
 * auth.getUser() = 1 HTTP ke Supabase Auth. Layout dan page dalam satu render
 * sama-sama butuh user; cache() React memakai hasil pertama untuk seluruh request.
 * Hanya untuk Server Component (layout/page), bukan server action.
 */
export const getUserCached = cache(() => createServerClient().auth.getUser())
