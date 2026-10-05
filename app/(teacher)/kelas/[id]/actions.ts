'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function hapusKelas(classId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Belum login' }

  // Pastikan kelas milik guru ini
  const { data: own } = await supabase
    .from('classes')
    .select('id, name')
    .eq('id', classId)
    .eq('homeroom_teacher_id', user.id)
    .maybeSingle()
  if (!own) return { ok: false, error: 'Kelas tidak ditemukan' }

  // Kelas berisi siswa tidak boleh dihapus (FK students.class_id).
  // Pindahkan/keluarkan dulu siswanya lewat menu Naik Kelas.
  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', classId)
  if ((count ?? 0) > 0) {
    return { ok: false, error: `Kelas ${own.name} masih berisi ${count} siswa. Keluarkan/pindahkan dulu lewat menu Naik Kelas.` }
  }

  const { error } = await supabase.from('classes').delete().eq('id', classId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/kelas')
  return { ok: true }
}
