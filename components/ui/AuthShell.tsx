import Link from 'next/link'

interface AuthShellProps {
  badge?: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  gradient?: string
}

export function AuthShell({
  badge,
  title,
  subtitle,
  children,
  footer,
  gradient = 'bg-grad-blue',
}: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-bg">
      {/* Hero gradien */}
      <div className={`relative overflow-hidden ${gradient} px-6 pb-12 pt-10 text-center text-white`}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[.08]" />
        <div className="pointer-events-none absolute -bottom-12 left-6 h-28 w-28 rounded-full bg-white/[.06]" />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-xl font-black tracking-tight">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" className="h-10 w-10 rounded-xl shadow-soft" />
            SiHebat
          </Link>
          {badge && <div className="mt-3">{badge}</div>}
          <h1 className="mt-3 font-display text-2xl font-black">{title}</h1>
          {subtitle && <p className="mt-1 text-sm opacity-85">{subtitle}</p>}
        </div>
      </div>

      {/* Card melayang */}
      <div className="relative z-10 mx-auto -mt-7 max-w-lg px-5">
        <div className="rounded-modal bg-white p-5 shadow-lift">{children}</div>
        {footer && <div className="py-5 text-center">{footer}</div>}
      </div>
    </div>
  )
}
