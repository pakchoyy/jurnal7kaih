'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export type MoveState = { error?: string } | null

export async function pindahkanSiswa(fromClassId: string, _prev: MoveState, formData: FormData): Promise<MoveState> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: from } = await supabase
    .from('classes')
    .select('id, school_id')
    .eq('id', fromClassId)
    .eq('homeroom_teacher_id', user.id)
    .maybeSingle()
  if (!from) return { error: 'Kelas asal tidak ditemukan' }

  const studentIds = formData.getAll('student').map(String)
  if (studentIds.length === 0) return { error: 'Pilih minimal satu siswa' }

  const target = String(formData.get('target') ?? '')
  let targetClassId: string | null = null

  if (target === 'lulus') {
    const { error } = await supabase
      .from('students')
      .update({ status: 'inactive' })
      .in('id', studentIds)
      .eq('class_id', fromClassId)
    if (error) return { error: error.message }
    revalidatePath('/kelas', 'layout')
    redirect(`/kelas/${fromClassId}`)
  }

  if (target === 'baru') {
    const name = String(formData.get('newName') ?? '').trim().toUpperCase().slice(0, 30)
    const grade = parseInt(String(formData.get('newGrade') ?? ''), 10)
    if (!name) return { error: 'Nama kelas baru wajib diisi' }
    if (!(grade >= 1 && grade <= 12)) return { error: 'Tingkat tidak valid' }

    const { data: ay } = await supabase
      .from('academic_years')
      .select('id')
      .eq('school_id', from.school_id)
      .eq('is_active', true)
      .maybeSingle()
    if (!ay) return { error: 'Tahun ajaran aktif tidak ditemukan' }

    const { data: created, error } = await supabase
      .from('classes')
      .insert({ school_id: from.school_id, academic_year_id: ay.id, name, grade, homeroom_teacher_id: user.id })
      .select('id')
      .single()
    if (error) {
      return { error: error.code === '23505' ? `Kelas ${name} sudah ada di tahun ajaran aktif` : error.message }
    }
    targetClassId = created.id
  } else {
    const { data: t } = await supabase
      .from('classes')
      .select('id')
      .eq('id', target)
      .eq('homeroom_teacher_id', user.id)
      .maybeSingle()
    if (!t) return { error: 'Pilih kelas tujuan' }
    if (t.id === fromClassId) return { error: 'Kelas tujuan sama dengan kelas asal' }
    targetClassId = t.id
  }

  const { error } = await supabase
    .from('students')
    .update({ class_id: targetClassId })
    .in('id', studentIds)
    .eq('class_id', fromClassId)
  if (error) return { error: error.message }

  revalidatePath('/kelas', 'layout')
  redirect(`/kelas/${targetClassId}`)
}
