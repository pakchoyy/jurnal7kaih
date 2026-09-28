'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type FormState = { error?: string } | null

export async function buatKelas(_prev: FormState, formData: FormData): Promise<FormState> {
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

  const name = String(formData.get('name') ?? '').trim().toUpperCase().slice(0, 30)
  const grade = parseInt(String(formData.get('grade') ?? '1'), 10)
  if (!name) return { error: 'Nama kelas wajib diisi' }
  if (!(grade >= 1 && grade <= 12)) return { error: 'Tingkat tidak valid' }

  // Ambil tahun ajaran aktif
  const { data: ay } = await supabase
    .from('academic_years')
    .select('id')
    .eq('school_id', profile.school_id)
    .eq('is_active', true)
    .maybeSingle()
  if (!ay) return { error: 'Tahun ajaran aktif tidak ditemukan. Hubungi admin aplikasi.' }

  const { data: kelas, error } = await supabase
    .from('classes')
    .insert({
      school_id: profile.school_id,
      academic_year_id: ay.id,
      name,
      grade,
      homeroom_teacher_id: user.id,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: `Kelas ${name} sudah ada di tahun ajaran ini` }
    return { error: error.message }
  }

  redirect(`/kelas/${kelas.id}`)
}
