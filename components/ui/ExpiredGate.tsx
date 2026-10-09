'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ExpiredGate({
  expired,
  allowPrefix,
  title,
  message,
  action,
  children,
}: {
  expired: boolean
  allowPrefix: string
  title: string
  message: string
  action?: { href: string; label: string }
  children: React.ReactNode
}) {
  const pathname = usePathname()
  if (!expired || pathname.startsWith(allowPrefix)) return <>{children}</>

  return (
    <div className="px-5 py-10 text-center">
      <p className="text-4xl">🔒</p>
      <h2 className="mt-3 font-display text-lg font-black text-ink">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-base text-ink-2">{message}</p>
      {action && (
        <Link prefetch={false}
          href={action.href}
          className="mt-5 inline-block rounded-btn bg-brand-blue px-6 py-3 text-base font-bold text-white"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
