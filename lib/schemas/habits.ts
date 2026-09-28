import { z } from 'zod'

/**
 * Validasi `journal_entries.note` (JSON string) per kebiasaan.
 * Key WAJIB snake_case persis sesuai CONTEXT-7KAIH.md.
 */

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/ // HH:mm 24 jam

// A. Bangun Pagi
export const bangunPagiSchema = z.object({
  wake_time: z.string().regex(timeRe, 'Format jam harus HH:mm'),
})

// B. Beribadah
export const beribadahSchema = z.object({
  activities: z.array(z.string().min(1)).min(1, 'Pilih minimal satu kegiatan'),
})

// C. Berolahraga
export const berolahragaSchema = z.object({
  activity: z.string().min(1, 'Olahraga apa?'),
  feeling: z.string().optional(),
})

// D. Makan Sehat
export const makanSehatSchema = z.object({
  breakfast: z.string().optional(),
  lunch: z.string().optional(),
  dinner: z.string().optional(),
})

// E. Gemar Belajar
export const gemarBelajarSchema = z.object({
  subject: z.string().min(1, 'Belajar apa?'),
  duration: z.string().min(1, 'Berapa lama?'),
})

// F. Bermasyarakat
export const bermasyarakatSchema = z.object({
  activity: z.string().min(1, 'Kegiatan bermasyarakat apa?'),
})

// G. Tidur Cepat
export const tidurCepatSchema = z.object({
  sleep_time: z.string().regex(timeRe, 'Format jam harus HH:mm'),
})

/** Map slug habit -> schema */
export const habitNoteSchemas = {
  'bangun-pagi': bangunPagiSchema,
  beribadah: beribadahSchema,
  berolahraga: berolahragaSchema,
  'makan-sehat': makanSehatSchema,
  'gemar-belajar': gemarBelajarSchema,
  bermasyarakat: bermasyarakatSchema,
  'tidur-cepat': tidurCepatSchema,
} as const

export type HabitSlug = keyof typeof habitNoteSchemas

/** Validasi + stringify note untuk sebuah habit. Throw bila invalid. */
export function validateHabitNote(slug: string, note: unknown): string {
  const schema = habitNoteSchemas[slug as HabitSlug]
  if (!schema) throw new Error(`Habit tidak dikenal: ${slug}`)
  return JSON.stringify(schema.parse(note))
}

/** Parse note JSON string yang tersimpan. */
export function parseHabitNote(slug: string, raw: string | null): unknown {
  if (!raw) return null
  const schema = habitNoteSchemas[slug as HabitSlug]
  const parsed = JSON.parse(raw)
  return schema ? schema.parse(parsed) : parsed
}
