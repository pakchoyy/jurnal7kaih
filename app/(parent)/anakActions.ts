'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ACTIVE_CHILD_COOKIE } from '@/lib/activeChild'
import { isValidNIS } from '@/lib/utils'

function setActive(studentId: string) {
  cookies().set(ACTIVE_CHILD_COOKIE, studentId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
}

export async function pilihAnak(studentId: string) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const { data } = await supabase
    .from('student_parents')
    .select('student_id')
    .eq('user_id', user.id)
    .eq('student_id', studentId)
    .maybeSingle()
  if (!data) return
  setActive(studentId)
  revalidatePath('/', 'layout')
}

export type LinkState = { error?: string; ok?: string } | null

export async function hubungkanAnak(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const nis = String(formData.get('nis') ?? '').trim()
  if (!isValidNIS(nis)) return { error: 'NIS tidak valid' }

  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis, silakan login ulang' }

  const { data: me } = await supabase
    .from('users')
    .select('role, school_id, schools(code)')
    .eq('id', user.id)
    .single()
  const schoolCode = (me?.schools as unknown as { code: string } | null)?.code
  if (me?.role !== 'parent' || !me.school_id || !schoolCode) return { error: 'Akses ditolak' }

  const admin = createAdminClient()
  const { data: sibling } = await admin
    .from('students')
    .select('id, name')
    .eq('school_id', me.school_id)
    .eq('student_number', nis)
    .eq('status', 'active')
    .maybeSingle()
  if (!sibling) return { error: 'NIS tidak ditemukan di sekolah ini' }

  const { error } = await admin
    .from('student_parents')
    .upsert(
      { student_id: sibling.id, user_id: user.id, relationship: 'Wali', is_primary: false },
      { onConflict: 'student_id,user_id', ignoreDuplicates: true },
    )
  if (error) return { error: error.message }

  setActive(sibling.id)
  revalidatePath('/', 'layout')
  return { ok: `${sibling.name} berhasil ditambahkan` }
}
