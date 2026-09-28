// Emoji 7 kebiasaan melayang pelan di latar header (hiasan, tanpa JS).
const ITEMS = [
  { e: '🌅', l: '6%', t: '18%', d: '0s', s: 'text-2xl' },
  { e: '🙏', l: '84%', t: '12%', d: '1.2s', s: 'text-xl' },
  { e: '🏃', l: '72%', t: '62%', d: '2.4s', s: 'text-2xl' },
  { e: '🥗', l: '14%', t: '70%', d: '3.1s', s: 'text-xl' },
  { e: '📚', l: '44%', t: '6%', d: '4s', s: 'text-lg' },
  { e: '🤝', l: '92%', t: '44%', d: '5.2s', s: 'text-lg' },
  { e: '😴', l: '30%', t: '82%', d: '6s', s: 'text-lg' },
]

export function FloatingHabits({ opacity = 'opacity-25' }: { opacity?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${opacity}`}>
      {ITEMS.map((it) => (
        <span
          key={it.e}
          className={`drift absolute ${it.s}`}
          style={{ left: it.l, top: it.t, animationDelay: it.d }}
        >
          {it.e}
        </span>
      ))}
    </div>
  )
}
