'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  { href: '/beranda', label: 'Beranda', icon: '🏠' },
  { href: '/jurnal', label: 'Jurnal', icon: '📖' },
  { href: '/riwayat', label: 'Riwayat', icon: '📅' },
  { href: '/profil', label: 'Profil', icon: '👤' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors',
                  active ? 'text-brand-blue' : 'text-gray-400',
                )}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
