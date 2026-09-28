export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** Buat kode aktivasi 8 karakter alfanumerik uppercase. */
export function generateActivationCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const bytes = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  for (let i = 0; i < length; i++) {
    code += alphabet[bytes[i] % alphabet.length]
  }
  return code
}

/** Tanggal lokal dalam format YYYY-MM-DD. */
export function todayISO(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Hitung streak: jumlah hari berturut-turut ke belakang (dari hari ini)
 * dengan status submitted/reviewed. Lihat Key Business Logic #5.
 */
export function calculateStreak(submittedDates: string[], today = new Date()): number {
  const set = new Set(submittedDates)
  let streak = 0
  const cursor = new Date(today)
  cursor.setHours(0, 0, 0, 0)

  if (!set.has(todayISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (set.has(todayISO(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

/** Warna latar tipis (light) untuk badge habit. */
export function habitLight(slug: string): string {
  const map: Record<string, string> = {
    'bangun-pagi': '#FEF3C7',
    beribadah: '#EDE9FE',
    berolahraga: '#D1FAE5',
    'makan-sehat': '#CFFAFE',
    'gemar-belajar': '#DBEAFE',
    bermasyarakat: '#FCE7F3',
    'tidur-cepat': '#E0E7FF',
  }
  return map[slug] ?? '#EEF2FA'
}

/** Warna utama habit. */
export function habitColor(slug: string, fallback = '#6B7280'): string {
  const map: Record<string, string> = {
    'bangun-pagi': '#F59E0B',
    beribadah: '#8B5CF6',
    berolahraga: '#10B981',
    'makan-sehat': '#06B6D4',
    'gemar-belajar': '#3B82F6',
    bermasyarakat: '#EC4899',
    'tidur-cepat': '#6366F1',
  }
  return map[slug] ?? fallback
}

/** Inisial nama untuk avatar (maks 2 huruf). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

/** Format tanggal Indonesia: "12 Jun 2025". */
export function formatDateID(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Sisa hari menuju tanggal (bisa negatif bila lewat). */
export function daysUntil(iso: string): number {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 0
  const now = new Date()
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}
