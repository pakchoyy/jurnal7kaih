'use client'

import { Input } from '@/components/ui/Input'
import type { HabitFormProps } from './BangunPagiForm'

export function BermasyarakatForm({ value, onChange }: HabitFormProps) {
  return (
    <Input
      label="Kegiatan bermasyarakat apa?"
      placeholder="mis. Kerja bakti bersih-bersih lingkungan RT"
      value={(value.activity as string) ?? ''}
      onChange={(e) => onChange({ ...value, activity: e.target.value })}
    />
  )
}
