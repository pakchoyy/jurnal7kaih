import { z } from 'zod'

/**
 * Validasi `journal_entries.note` (JSON string) per kebiasaan.
 * Semua detail opsional: ortu boleh cukup mencentang kebiasaan / pilihan.
 */

const timeOrEmpty = z
  .string()
  .regex(/^(([01]\d|2[0-3]):[0-5]\d)?$/, 'Format jam harus JJ:MM')
  .optional()
const text = (max = 200) => z.string().trim().max(max, `Maksimal ${max} karakter`).optional()

const base = z.object({
  items: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  catatan: text(300),
})

export const habitNoteSchemas = {
  'bangun-pagi': base.extend({ wake_time: timeOrEmpty }),
  beribadah: base.extend({ activities: z.array(z.string().max(60)).max(30).optional() }),
  berolahraga: base.extend({ activity: text(), feeling: text() }),
  'makan-sehat': base.extend({ breakfast: text(), lunch: text(), dinner: text() }),
  'gemar-belajar': base.extend({ subject: text(), duration: text(60) }),
  bermasyarakat: base.extend({ activity: text() }),
  'tidur-cepat': base.extend({ sleep_time: timeOrEmpty }),
} as const

export type HabitSlug = keyof typeof habitNoteSchemas

const FIELD_LABELS: Record<string, string> = {
  wake_time: 'Jam bangun',
  sleep_time: 'Jam tidur',
  activity: 'Kegiatan',
  feeling: 'Perasaan',
  breakfast: 'Sarapan',
  lunch: 'Makan siang',
  dinner: 'Makan malam',
  subject: 'Belajar',
  duration: 'Lama',
  catatan: 'Catatan',
}

function stripEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : v !== '' && v != null)),
  )
}

/** Validasi + stringify note. Kembalikan null bila kosong. Throw bila invalid. */
export function validateHabitNote(slug: string, note: unknown): string | null {
  const schema = habitNoteSchemas[slug as HabitSlug]
  if (!schema) throw new Error(`Kebiasaan tidak dikenal: ${slug}`)
  const result = schema.safeParse(note ?? {})
  if (!result.success) throw new Error(result.error.errors[0]?.message ?? 'Data tidak valid')
  const clean = stripEmpty(result.data as Record<string, unknown>)
  return Object.keys(clean).length ? JSON.stringify(clean) : null
}

/** Parse note JSON yang tersimpan (toleran terhadap data lama). */
export function parseHabitNote(slug: string, raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { catatan: raw }
  }
  const schema = habitNoteSchemas[slug as HabitSlug]
  const result = schema?.safeParse(parsed)
  const data = (result?.success ? result.data : parsed) as Record<string, unknown>
  // Data lama Beribadah menyimpan pilihan di `activities`.
  if (Array.isArray(data.activities) && !data.items) {
    return { ...data, items: data.activities, activities: undefined }
  }
  return data ?? {}
}

/** Ubah note jadi tampilan: daftar pilihan + detail berlabel. */
export function describeHabitNote(
  slug: string,
  raw: string | null,
): { items: string[]; details: Array<[string, string]> } {
  const data = parseHabitNote(slug, raw)
  const items = Array.isArray(data.items) ? (data.items as string[]) : []
  const details = Object.entries(data)
    .filter(([k, v]) => k !== 'items' && k !== 'activities' && typeof v === 'string' && v)
    .map(([k, v]) => [FIELD_LABELS[k] ?? k, String(v)] as [string, string])
  return { items, details }
}
