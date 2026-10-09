'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Icon } from './icons'

export interface MenuItem {
  href: string
  label: string
  icon: string
}

export function AppHeader({
  title,
  subtitle,
  logoUrl,
  badge,
  menu,
  homeHref,
}: {
  title: string
  subtitle?: string | null
  logoUrl?: string | null
  badge?: string | null
  menu: MenuItem[]
  homeHref: string
}) {
  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  async function logout() {
    setLeaving(true)
    await createClient().auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-grad-blue text-white shadow-soft">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          <Link prefetch={false} href={homeHref} className="flex min-w-0 flex-1 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl || '/icons/icon-192.png'}
              alt=""
              className="h-11 w-11 flex-shrink-0 rounded-xl bg-white object-contain p-0.5"
            />
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-black leading-tight">{title}</span>
              {subtitle && <span className="block truncate text-xs opacity-85">{subtitle}</span>}
            </span>
          </Link>
          {badge && (
            <span className="flex-shrink-0 rounded-pill border border-white/40 bg-white/15 px-2.5 py-1 text-xs font-bold">
              {badge}
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            aria-expanded={open}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/10"
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Tutup menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40" />
          <nav className="drawer-in absolute inset-y-0 right-0 flex w-[82%] max-w-xs flex-col bg-white shadow-lift">
            <div className="flex items-center gap-3 bg-grad-blue px-4 py-4 text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl || '/icons/icon-192.png'} alt="" className="h-12 w-12 rounded-xl bg-white object-contain p-0.5" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-black">{title}</p>
                {subtitle && <p className="truncate text-xs opacity-85">{subtitle}</p>}
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className="p-1">
                <Icon name="close" />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto py-2">
              {menu.map((m) => {
                const active = pathname === m.href
                return (
                  <li key={m.href}>
                    <Link prefetch={false}
                      href={m.href}
                      className={`flex items-center gap-4 px-5 py-3.5 text-base font-semibold ${
                        active ? 'bg-brand-blue-light text-brand-blue' : 'text-ink'
                      }`}
                    >
                      <Icon name={m.icon} className="h-6 w-6 text-brand-blue" />
                      {m.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <button
              type="button"
              onClick={logout}
              disabled={leaving}
              className="m-4 flex items-center justify-center gap-2 rounded-btn border-2 border-red-200 bg-red-50 py-3 text-base font-bold text-red-600 disabled:opacity-50"
              style={{ marginBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
              <Icon name="logout" className="h-5 w-5" />
              {leaving ? 'Keluar…' : 'Keluar'}
            </button>
          </nav>
        </div>
      )}
    </>
  )
}
