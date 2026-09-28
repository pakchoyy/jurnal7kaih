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

/** Nomor WA ke format internasional tanpa simbol: 0812… → 62812… */
export function normalizeWA(value: string): string {
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '62' + digits.slice(1)
  return digits
}

/** NIS dipakai sebagai bagian email login, jadi batasi karakternya. */
export function isValidNIS(nis: string): boolean {
  return /^[A-Za-z0-9.-]{1,30}$/.test(nis)
}

// Supabase mewajibkan password ≥ 6 karakter, padahal password awal ortu = NIS
// yang bisa lebih pendek. Password ≥ 6 tidak diubah, jadi password pilihan user aman.
export function toAuthPassword(password: string): string {
  return password.length >= 6 ? password : `${password}#7kaih`
}

// Server Vercel berjalan di UTC; tanggal jurnal harus mengikuti waktu Indonesia.
const jakartaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function todayISO(date = new Date()): string {
  return jakartaDate.format(date)
}

/** Geser tanggal YYYY-MM-DD sejumlah hari (bebas zona waktu). */
export function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/**
 * Hitung streak: jumlah hari berturut-turut ke belakang (dari hari ini)
 * dengan status submitted/reviewed. Lihat Key Business Logic #5.
 */
export function calculateStreak(submittedDates: string[], today = new Date()): number {
  const set = new Set(submittedDates)
  let cursor = todayISO(today)
  if (!set.has(cursor)) cursor = shiftISO(cursor, -1)
  let streak = 0
  while (set.has(cursor)) {
    streak++
    cursor = shiftISO(cursor, -1)
  }
  return streak
}

/** Rekor hari berturut-turut terpanjang. */
export function bestStreak(submittedDates: string[]): number {
  const sorted = Array.from(new Set(submittedDates)).sort()
  let best = 0
  let run = 0
  let prev = ''
  for (const d of sorted) {
    run = prev && shiftISO(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return best
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
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** Redirect URL berdasarkan role setelah login. */
export function getRoleRedirect(role?: string | null): string {
  switch (role) {
    case 'parent': return '/beranda'
    case 'teacher': return '/teacher-dashboard'
    case 'super_admin': return '/sekolah'
    default: return '/login'
  }
}

/** Sisa hari menuju tanggal (bisa negatif bila lewat). */
export function daysUntil(iso: string): number {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 0
  const now = new Date()
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}
