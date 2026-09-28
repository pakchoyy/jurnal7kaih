// Pilihan bawaan tiap kebiasaan. Dipakai bila sekolah belum mengatur sendiri.
export const DEFAULT_HABIT_ITEMS: Record<string, string[]> = {
  'bangun-pagi': ['Bangun sebelum jam 05.30', 'Merapikan tempat tidur', 'Mandi pagi', 'Sarapan'],
  beribadah: ['Ibadah wajib', 'Berdoa sebelum & sesudah kegiatan', 'Membaca kitab suci', 'Bersyukur'],
  berolahraga: ['Jalan / lari pagi', 'Bersepeda', 'Senam', 'Main bola', 'Lompat tali', 'Renang'],
  'makan-sehat': ['Sarapan', 'Makan sayur', 'Makan buah', 'Minum air putih cukup', 'Tidak jajan sembarangan'],
  'gemar-belajar': ['Mengulang pelajaran', 'Mengerjakan PR', 'Membaca buku 15 menit', 'Menghafal'],
  bermasyarakat: ['Membantu orang tua', 'Membantu teman / tetangga', 'Kerja bakti', 'Menyapa & bersikap sopan'],
  'tidur-cepat': ['Tidur sebelum jam 21.00', 'Tanpa HP 1 jam sebelum tidur', 'Gosok gigi', 'Berdoa sebelum tidur'],
}

// Template khusus poin Beribadah sesuai agama.
export const IBADAH_TEMPLATES: Record<string, string[]> = {
  Islam: [
    'Sholat Subuh',
    'Sholat Dzuhur',
    'Sholat Ashar',
    'Sholat Maghrib',
    'Sholat Isya',
    'Mengaji / membaca Al-Qur’an',
    'Berdoa',
  ],
  'Kristen / Katolik': ['Doa pagi', 'Doa makan', 'Membaca Alkitab', 'Doa malam', 'Ibadah / Misa'],
  Hindu: ['Tri Sandhya pagi', 'Tri Sandhya siang', 'Tri Sandhya sore', 'Mebanten / sembahyang', 'Membaca kitab suci'],
  Buddha: ['Puja bakti pagi', 'Puja bakti malam', 'Meditasi', 'Membaca Paritta'],
  Konghucu: ['Sembahyang pagi', 'Sembahyang malam', 'Membaca kitab Si Shu'],
}

export const MAX_ITEMS_PER_HABIT = 15
export const MAX_ITEM_LENGTH = 60

export function itemsForHabit(
  slug: string,
  habitId: string,
  schoolItems: Array<{ habit_id: string; label: string; sort_order: number }>,
): string[] {
  const custom = schoolItems
    .filter((i) => i.habit_id === habitId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => i.label)
  return custom.length ? custom : DEFAULT_HABIT_ITEMS[slug] ?? []
}
