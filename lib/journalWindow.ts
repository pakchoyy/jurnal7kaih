import { shiftISO, todayISO } from '@/lib/utils'

/** Maksimal mundur pengisian/edit jurnal: 30 hari ke belakang. */
export const MAX_BACKFILL_DAYS = 30

/** Tanggal paling lama yang masih boleh diisi/diubah (YYYY-MM-DD). */
export function minFillableDate(today: string = todayISO()): string {
  return shiftISO(today, -MAX_BACKFILL_DAYS)
}

export interface FillableCheck {
  ok: boolean
  reason?: string
}

/**
 * Cek apakah tanggal jurnal boleh diisi/diubah:
 * rentang [hariIni - 30 hari, hariIni]. Tanggal masa depan ditolak.
 */
export function isDateFillable(iso: string, today: string = todayISO()): FillableCheck {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return { ok: false, reason: 'Format tanggal tidak valid' }
  if (iso > today) return { ok: false, reason: 'Belum bisa mengisi jurnal untuk tanggal yang akan datang' }
  if (iso < minFillableDate(today)) {
    return { ok: false, reason: `Jurnal hanya bisa diisi maksimal ${MAX_BACKFILL_DAYS} hari ke belakang` }
  }
  return { ok: true }
}
