export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** Buat kode aktivasi 8 karakter alfanumerik uppercase. */
export function generateActivationCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // tanpa karakter ambigu O/0/I/1
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
export function calculateStreak(
  submittedDates: string[],
  today = new Date(),
): number {
  const set = new Set(submittedDates)
  let streak = 0
  const cursor = new Date(today)
  cursor.setHours(0, 0, 0, 0)

  // Grace: kalau hari ini belum submit, mulai dari kemarin.
  if (!set.has(todayISO(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (set.has(todayISO(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}
