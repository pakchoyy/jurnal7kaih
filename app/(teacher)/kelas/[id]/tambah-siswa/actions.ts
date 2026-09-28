'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  const { data: student, error } = await supabase.from('students').insert({
    school_id: profile.school_id,
    class_id: classId,
    name,
    student_number: nis,
    nisn: nisn || null,
    gender: gender || null,
    status: 'active',
  }).select('id').single()

  if (error) {
    if (error.code === '23505') return { error: `NIS ${nis} sudah dipakai siswa lain` }
    return { error: error.message }
  }

  // Buat akun auth orang tua pakai email fake {NIS}@7kaih.internal, password = NIS
  const parentEmail = `${nis}@7kaih.internal`
  const admin = createAdminClient()

  let parentUserId: string | null = null

  // Cek apakah akun sudah ada
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(u => u.email === parentEmail)

  if (existing) {
    parentUserId = existing.id
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: parentEmail,
      password: nis,
      email_confirm: true,
    })
    if (createErr) return { error: `Gagal buat akun ortu: ${createErr.message}` }
    parentUserId = created.user.id

    // Insert ke public.users
    await admin.from('users').insert({
      id: parentUserId,
      school_id: profile.school_id,
      role: 'parent',
      name: `Orang Tua ${name}`,
    })
  }

  // Link ortu ke siswa
  if (student?.id && parentUserId) {
    await admin.from('student_parents').insert({
      student_id: student.id,
      user_id: parentUserId,
      relationship: 'Wali',
    }).select()
  }

  redirect(`/kelas/${classId}`)
}
