'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function mulaiTahunAjaranBaru() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesi habis' }

  const { data: me } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  if (!me?.school_id || me.role !== 'teacher') return { error: 'Akses ditolak' }

  const { data: current } = await supabase
    .from('academic_years')
    .select('id, name')
    .eq('school_id', me.school_id)
    .eq('is_active', true)
    .maybeSingle()

  const start = current ? Number(current.name.slice(0, 4)) + 1 : new Date().getFullYear()
  const name = `${start}/${start + 1}`

  const { data: existing } = await supabase
    .from('academic_years')
    .select('id')
    .eq('school_id', me.school_id)
    .eq('name', name)
    .maybeSingle()

  let newId = existing?.id
  if (!newId) {
    const { data, error } = await supabase
      .from('academic_years')
      .insert({
        school_id: me.school_id,
        name,
        start_date: `${start}-07-01`,
        end_date: `${start + 1}-06-30`,
        is_active: false,
      })
      .select('id')
      .single()
    if (error) return { error: error.message }
    newId = data.id
  }

  await supabase.from('academic_years').update({ is_active: false }).eq('school_id', me.school_id).neq('id', newId)
  const { error } = await supabase.from('academic_years').update({ is_active: true }).eq('id', newId)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { ok: true, name }
}
