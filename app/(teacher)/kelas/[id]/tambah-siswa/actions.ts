'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function tambahSiswa(classId: string, formData: FormData) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()
  if (!profile?.school_id) return { error: 'Profil tidak ditemukan' }

  const name = String(formData.get('name') ?? '').trim()
  const nis = String(formData.get('nis') ?? '').trim()
  const nisn = String(formData.get('nisn') ?? '').trim()
  const gender = String(formData.get('gender') ?? '')

  if (!name) return { error: 'Nama siswa wajib diisi' }
  if (!nis) return { error: 'NIS wajib diisi (dipakai untuk login orang tua)' }

  const { error } = await supabase.from('students').insert({
    school_id: profile.school_id,
    class_id: classId,
    name,
    student_number: nis,
    nisn: nisn || null,
    gender: gender || null,
    status: 'active',
  })

  if (error) {
    if (error.code === '23505') return { error: `NIS ${nis} sudah dipakai siswa lain` }
    return { error: error.message }
  }

  redirect(`/kelas/${classId}`)
}
