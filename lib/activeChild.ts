import 'server-only'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

export const ACTIVE_CHILD_COOKIE = 'anak_aktif'

export interface ChildInfo {
  id: string
  name: string
  classId: string | null
  className: string | null
  teacherName: string | null
  teacherWA: string | null
}

export async function getChildren(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from('student_parents')
    .select('student_id, students(id, name, class_id, classes(name, users(name, whatsapp)))')
    .eq('user_id', userId)
    .order('created_at')

  const children: ChildInfo[] = (data ?? []).map((l) => {
    const st = l.students as unknown as {
      name: string
      class_id: string | null
      classes: { name: string; users: { name: string; whatsapp: string | null } | null } | null
    } | null
    return {
      id: l.student_id,
      name: st?.name ?? 'Siswa',
      classId: st?.class_id ?? null,
      className: st?.classes?.name ?? null,
      teacherName: st?.classes?.users?.name ?? null,
      teacherWA: st?.classes?.users?.whatsapp ?? null,
    }
  })

  const wanted = cookies().get(ACTIVE_CHILD_COOKIE)?.value
  const active = children.find((c) => c.id === wanted) ?? children[0] ?? null
  return { children, active }
}
