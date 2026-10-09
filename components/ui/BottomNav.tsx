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
              <Link prefetch={false}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'pressable flex flex-col items-center gap-0.5 pb-2 pt-1.5 text-xs font-bold transition-colors duration-200',
                  active ? 'text-brand-blue' : 'text-ink-2',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-300',
                    active ? 'bg-brand-blue-light' : 'bg-transparent',
                  )}
                >
                  <Icon name={item.icon} className={cn('h-6 w-6', active && 'nav-pop')} />
                </span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
