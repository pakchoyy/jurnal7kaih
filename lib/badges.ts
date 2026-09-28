export interface Badge {
  icon: string
  name: string
  days: number
}

// Lencana diraih dari rekor hari berturut-turut mengisi jurnal.
export const BADGES: Badge[] = [
  { icon: '🌱', name: 'Mulai Tumbuh', days: 1 },
  { icon: '🔥', name: 'Semangat 3 Hari', days: 3 },
  { icon: '⭐', name: 'Bintang Seminggu', days: 7 },
  { icon: '🏅', name: 'Juara 2 Minggu', days: 14 },
  { icon: '🏆', name: 'Pahlawan Sebulan', days: 30 },
  { icon: '👑', name: 'Raja Kebiasaan', days: 60 },
]

export function nextBadge(best: number): Badge | null {
  return BADGES.find((b) => b.days > best) ?? null
}
