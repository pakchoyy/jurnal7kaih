import { createServerClient as createSSRServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

/**
 * Server client (anon key + cookies).
 */
export async function createServerClient() {
  const cookieStore = await cookies()

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
export const getUserCached = cache(async () => (await createServerClient()).auth.getUser())

export interface Profile {
  id: string
  role: string
  name: string | null
  whatsapp: string | null
  school_id: string | null
  schools: {
    name: string
    plan: string
    active_until: string | null
    logo_url: string | null
    theme_color: string | null
  } | null
}

const PROFILE_SELECT =
  'id, role, name, whatsapp, school_id, schools(name, plan, active_until, logo_url, theme_color)'

/**
 * Profil user yang sedang login (baris `users` + sekolahnya), satu query per request.
 * Layout dan page sebelumnya masing-masing query tabel `users` sendiri.
 * Hanya untuk Server Component (layout/page), bukan server action.
 */
export const getProfileCached = cache(async (): Promise<Profile | null> => {
  const {
    data: { user },
  } = await getUserCached()
  if (!user) return null
  const { data } = await (await createServerClient()).from('users').select(PROFILE_SELECT).eq('id', user.id).single()
  return (data as unknown as Profile | null) ?? null
})
