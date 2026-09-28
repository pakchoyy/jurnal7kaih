'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Icon } from './icons'

export interface NavItem {
  href: string
  label: string
  icon: string
  /** Awalan path lain yang juga membuat item ini aktif. */
  match?: string[]
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
        {items.map((item) => {
          const active = [item.href, ...(item.match ?? [])].some(
            (p) => pathname === p || pathname.startsWith(p + '/'),
          )
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-xs font-bold transition-colors',
                  active ? 'text-brand-blue' : 'text-ink-2',
                )}
              >
                <Icon name={item.icon} className="h-7 w-7" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
