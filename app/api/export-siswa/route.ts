import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get('classId')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })

  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Pastikan kelas milik guru ini
  const { data: kelas } = await supabase
    .from('classes')
    .select('id, name')
    .eq('id', classId)
    .eq('homeroom_teacher_id', user.id)
    .single()
  if (!kelas) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 })

  const { data: students } = await supabase
    .from('students')
    .select('name, student_number, nisn, gender, status')
    .eq('class_id', classId)
    .order('name')

  const rows = (students ?? []).map((s, i) => ({
    No: i + 1,
    Nama: s.name,
    NIS: s.student_number ?? '',
    NISN: s.nisn ?? '',
    'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : s.gender === 'P' ? 'Perempuan' : '',
    Status: s.status === 'active' ? 'Aktif' : 'Nonaktif',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Kelas ${kelas.name}`)

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="siswa-kelas-${kelas.name}.xlsx"`,
    },
  })
}
