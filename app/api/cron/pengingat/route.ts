import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'
import { todayISO } from '@/lib/utils'
import { isSchoolDay, parseSchoolDays } from '@/lib/schoolCalendar'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PAGE = 1000

async function fetchAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null }>) {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data } = await query(from, from + PAGE - 1)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) return rows
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { NEXT_PUBLIC_VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: subject } = process.env
  if (!pub || !priv) return NextResponse.json({ error: 'VAPID belum diset' }, { status: 500 })
  webpush.setVapidDetails(subject || 'mailto:admin@example.com', pub, priv)

  const admin = createAdminClient()
  const today = todayISO()

  const subs = await fetchAll<{ id: string; user_id: string; endpoint: string; p256dh: string; auth: string }>(
    (a, b) => admin.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth').range(a, b),
  )
  const userIds = Array.from(new Set(subs.map((s) => s.user_id)))
  if (!userIds.length) return NextResponse.json({ sent: 0 })

  const links: { user_id: string; student_id: string; students: unknown }[] = []
  for (let i = 0; i < userIds.length; i += 200) {
    const chunk = userIds.slice(i, i + 200)
    links.push(
      ...(await fetchAll((a, b) =>
        admin
          .from('student_parents')
          .select('user_id, student_id, students!inner(name, status, school_id, schools!inner(active_until, school_days))')
          .in('user_id', chunk)
          .range(a, b),
      )),
    )
  }

  const studentIds = Array.from(new Set(links.map((l) => l.student_id)))
  const filled = new Set<string>()
  for (let i = 0; i < studentIds.length; i += 200) {
    const rows = await fetchAll<{ student_id: string }>((a, b) =>
      admin
        .from('journals')
        .select('student_id')
        .in('student_id', studentIds.slice(i, i + 200))
        .eq('journal_date', today)
        .neq('status', 'draft')
        .range(a, b),
    )
    rows.forEach((r) => filled.add(r.student_id))
  }

  // Sekolah yang hari ini libur tidak dikirimi pengingat.
  const { data: holidaysToday } = await admin
    .from('school_holidays')
    .select('school_id')
    .lte('start_date', today)
    .gte('end_date', today)
  const onHoliday = new Set((holidaysToday ?? []).map((h) => h.school_id))

  const pendingByUser = new Map<string, string[]>()
  for (const l of links) {
    const st = l.students as {
      name: string
      status: string
      school_id: string
      schools: { active_until: string | null; school_days: string | null }
    }
    const active = st.status === 'active' && st.schools.active_until && new Date(st.schools.active_until) > new Date()
    const schoolDay =
      !onHoliday.has(st.school_id) &&
      isSchoolDay(today, { days: parseSchoolDays(st.schools.school_days), holidays: [] })
    if (!active || !schoolDay || filled.has(l.student_id)) continue
    pendingByUser.set(l.user_id, [...(pendingByUser.get(l.user_id) ?? []), st.name.split(' ')[0]])
  }

  let sent = 0
  const expired: string[] = []
  await Promise.all(
    subs
      .filter((s) => pendingByUser.has(s.user_id))
      .map(async (s) => {
        const names = pendingByUser.get(s.user_id)!.join(' & ')
        const payload = JSON.stringify({
          title: 'SiHebat',
          body: `Jurnal ${names} hari ini belum diisi. Yuk isi sebelum tidur 😊`,
          url: '/jurnal/isi',
        })
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
            TTL: 60 * 60 * 3,
          })
          sent++
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode
          if (code === 404 || code === 410) expired.push(s.id)
        }
      }),
  )
  if (expired.length) await admin.from('push_subscriptions').delete().in('id', expired)

  return NextResponse.json({ sent, expired: expired.length })
}
