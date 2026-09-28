import type { SupabaseClient } from '@supabase/supabase-js'
import { shiftISO } from '@/lib/utils'

export interface Holiday {
  id?: string
  start_date: string
  end_date: string
  name: string
}

export interface SchoolCalendar {
  /** Hari sekolah, 0 = Minggu … 6 = Sabtu. */
  days: number[]
  holidays: Holiday[]
}

export const DEFAULT_CALENDAR: SchoolCalendar = { days: [1, 2, 3, 4, 5, 6], holidays: [] }

export function parseSchoolDays(v: string | null | undefined): number[] {
  return v === '1-5' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6]
}

function weekday(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function holidayOn(iso: string, cal: SchoolCalendar): Holiday | null {
  return cal.holidays.find((h) => h.start_date <= iso && iso <= h.end_date) ?? null
}

export function isSchoolDay(iso: string, cal: SchoolCalendar): boolean {
  return cal.days.includes(weekday(iso)) && !holidayOn(iso, cal)
}

/** Alasan hari ini tidak wajib mengisi, atau null bila hari sekolah. */
export function dayOffReason(iso: string, cal: SchoolCalendar): string | null {
  const h = holidayOn(iso, cal)
  if (h) return h.name
  if (!cal.days.includes(weekday(iso))) return weekday(iso) === 0 ? 'Hari Minggu' : 'Hari Sabtu'
  return null
}

export function countSchoolDays(start: string, end: string, cal: SchoolCalendar): number {
  let n = 0
  for (let d = start, guard = 0; d <= end && guard < 400; d = shiftISO(d, 1), guard++) {
    if (isSchoolDay(d, cal)) n++
  }
  return n
}

export async function getSchoolCalendar(supabase: SupabaseClient, schoolId: string): Promise<SchoolCalendar> {
  const [{ data: school }, { data: holidays }] = await Promise.all([
    supabase.from('schools').select('school_days').eq('id', schoolId).maybeSingle(),
    supabase
      .from('school_holidays')
      .select('id, start_date, end_date, name')
      .eq('school_id', schoolId)
      .order('start_date'),
  ])
  return { days: parseSchoolDays(school?.school_days), holidays: (holidays ?? []) as Holiday[] }
}
