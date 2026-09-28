'use client'

import { Input } from '@/components/ui/Input'
import type { HabitFormProps } from './BangunPagiForm'

export function GemarBelajarForm({ value, onChange }: HabitFormProps) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        label="Belajar apa?"
        placeholder="mis. Matematika — soal persamaan linear"
        value={(value.subject as string) ?? ''}
        onChange={(e) => onChange({ ...value, subject: e.target.value })}
      />
      <Input
        label="Berapa lama?"
        placeholder="mis. 45 menit"
        value={(value.duration as string) ?? ''}
        onChange={(e) => onChange({ ...value, duration: e.target.value })}
      />
    </div>
  )
}
