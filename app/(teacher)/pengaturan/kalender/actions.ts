'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function teacherSchool() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  return data?.role === 'teacher' && data.school_id ? { supabase, schoolId: data.school_id as string } : null
}

const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)

export async function simpanHariSekolah(days: '1-5' | '1-6') {
  const t = await teacherSchool()
  if (!t) return { error: 'Akses ditolak' }
  if (days !== '1-5' && days !== '1-6') return { error: 'Pilihan tidak valid' }
  const { error } = await createAdminClient().from('schools').update({ school_days: days }).eq('id', t.schoolId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { ok: true }
}

export type HolidayState = { error?: string; ok?: number } | null

export async function tambahLibur(_prev: HolidayState, formData: FormData): Promise<HolidayState> {
  const t = await teacherSchool()
  if (!t) return { error: 'Akses ditolak' }
  const name = String(formData.get('name') ?? '').trim().slice(0, 80)
  const start = String(formData.get('start') ?? '')
  const end = String(formData.get('end') ?? '') || start
  if (!name) return { error: 'Nama libur wajib diisi' }
  if (!isDate(start) || !isDate(end)) return { error: 'Tanggal tidak valid' }
  if (end < start) return { error: 'Tanggal selesai sebelum tanggal mulai' }

  const { error } = await t.supabase
    .from('school_holidays')
    .insert({ school_id: t.schoolId, name, start_date: start, end_date: end })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { ok: Date.now() }
}

export async function hapusLibur(id: string) {
  const t = await teacherSchool()
  if (!t) return { error: 'Akses ditolak' }
  await t.supabase.from('school_holidays').delete().eq('id', id).eq('school_id', t.schoolId)
  revalidatePath('/', 'layout')
  return { ok: true }
}
