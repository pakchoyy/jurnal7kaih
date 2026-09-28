import { shiftISO, todayISO } from '@/lib/utils'

export type Range = 'today' | 'week' | 'month'

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const parts = (iso: string) => iso.split('-').map(Number) as [number, number, number]
const utc = (iso: string) => {
  const [y, m, d] = parts(iso)
  return Date.UTC(y, m - 1, d)
}
const dow = (iso: string) => new Date(utc(iso)).getUTCDay()
const daysBetween = (a: string, b: string) => Math.round((utc(b) - utc(a)) / 86400000)

export interface Period {
  start: string
  end: string
  /** Hari yang sudah berjalan dalam periode (tidak menghitung hari mendatang). */
  days: number
  label: string
  isCurrent: boolean
}

export function getPeriod(range: Range, offset: number, today = todayISO()): Period {
  const back = Math.max(0, Math.floor(offset) || 0)
  let start: string
  let end: string
  let label: string

  if (range === 'today') {
    start = end = shiftISO(today, -back)
    const [y, m, d] = parts(start)
    label = `${DAYS[dow(start)]}, ${d} ${MONTHS[m - 1]} ${y}`
  } else if (range === 'week') {
    const monday = shiftISO(today, -((dow(today) + 6) % 7))
    start = shiftISO(monday, -7 * back)
    end = shiftISO(start, 6)
    const [, sm, sd] = parts(start)
    const [ey, em, ed] = parts(end)
    label = sm === em ? `${sd} – ${ed} ${MONTHS_SHORT[em - 1]} ${ey}` : `${sd} ${MONTHS_SHORT[sm - 1]} – ${ed} ${MONTHS_SHORT[em - 1]} ${ey}`
  } else {
    const [ty, tm] = parts(today)
    const first = new Date(Date.UTC(ty, tm - 1 - back, 1))
    start = first.toISOString().slice(0, 10)
    end = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
    label = `${MONTHS[first.getUTCMonth()]} ${first.getUTCFullYear()}`
  }

  const effectiveEnd = end < today ? end : today
  return { start, end, days: Math.max(1, daysBetween(start, effectiveEnd) + 1), label, isCurrent: back === 0 }
}
