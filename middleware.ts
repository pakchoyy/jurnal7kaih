import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Jika environment variables belum di-set, jangan crash.
  // Ini mencegah MIDDLEWARE_INVOCATION_FAILED (500) di seluruh situs.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[middleware] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set',
    )
    return NextResponse.next({ request: { headers: request.headers } })
  }

  const pathname = request.nextUrl.pathname
  let response = NextResponse.next({ request })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/daftar-trial')

    if (!user && !isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    return response
  } catch (err) {
    // Jangan biarkan kegagalan auth mematikan seluruh situs.
    console.error('[middleware] gagal memproses sesi:', err)
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|offline\\.html|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
