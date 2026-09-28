import { BADGES, nextBadge } from '@/lib/badges'

export function BadgeShelf({ best, current, compact = false }: { best: number; current: number; compact?: boolean }) {
  const next = nextBadge(best)
  const earned = BADGES.filter((b) => b.days <= best)

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-card bg-white p-4 shadow-soft">
        <div className="flex -space-x-1 text-2xl">
          {(earned.length ? earned.slice(-3) : [BADGES[0]]).map((b) => (
            <span key={b.name} className={earned.length ? '' : 'opacity-30 grayscale'}>
              {b.icon}
            </span>
          ))}
        </div>
        <p className="flex-1 text-sm text-ink-2">
          {next ? (
            <>
              <b className="text-ink">{Math.max(next.days - current, 1)} hari lagi</b> berturut-turut untuk lencana{' '}
              {next.icon} <b className="text-ink">{next.name}</b>
            </>
          ) : (
            <b className="text-ink">Semua lencana sudah diraih! 🎉</b>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-card bg-white p-4 shadow-soft">
      <p className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-2">Lencana</p>
      <div className="grid grid-cols-3 gap-2">
        {BADGES.map((b) => {
          const got = b.days <= best
          return (
            <div
              key={b.name}
              className={`flex flex-col items-center rounded-btn p-2.5 text-center ${got ? 'bg-amber-50' : 'bg-bg'}`}
            >
              <span className={`text-3xl ${got ? '' : 'opacity-25 grayscale'}`}>{b.icon}</span>
              <span className={`mt-1 text-xs font-bold leading-tight ${got ? 'text-ink' : 'text-ink-3'}`}>{b.name}</span>
              <span className="text-[11px] text-ink-3">{b.days} hari</span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-sm text-ink-3">Rekor terpanjang: {best} hari berturut-turut</p>
    </div>
  )
}
