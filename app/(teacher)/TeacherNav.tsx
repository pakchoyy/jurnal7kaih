'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/teacher-dashboard', label: 'Dashboard' },
  { href: '/kelas', label: 'Kelas' },
  { href: '/siswa', label: 'Siswa' },
]

export default function TeacherNav() {
  const pathname = usePathname()
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line bg-white px-3">
      {nav.map((n) => {
        const active = pathname === n.href || pathname.startsWith(n.href + '/')
        return (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition',
              active
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-ink-3 hover:text-ink-2',
            )}
          >
            {n.label}
          </Link>
        )
      })}
    </nav>
  )
}
