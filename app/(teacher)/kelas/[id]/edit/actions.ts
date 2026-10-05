'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type FormState = { error?: string } | null

export async function ubahKelas(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const classId = String(formData.get('classId') ?? '')
  if (!classId) return { error: 'Kelas tidak valid' }

  // Pastikan kelas milik guru ini
  const { data: own } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('homeroom_teacher_id', user.id)
    .maybeSingle()
  if (!own) return { error: 'Kelas tidak ditemukan' }

  const name = String(formData.get('name') ?? '').trim().toUpperCase().slice(0, 30)
  const grade = parseInt(String(formData.get('grade') ?? '0'), 10)
  if (!name) return { error: 'Nama kelas wajib diisi' }
  if (!(grade >= 1 && grade <= 12)) return { error: 'Tingkat tidak valid' }

  const { error } = await supabase.from('classes').update({ name, grade }).eq('id', classId)

  if (error) {
    if (error.code === '23505') return { error: `Kelas ${name} sudah ada di tahun ajaran ini` }
    return { error: error.message }
  }

  revalidatePath('/kelas')
  redirect(`/kelas/${classId}`)
}
