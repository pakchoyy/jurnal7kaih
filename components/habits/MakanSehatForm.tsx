'use client'

import { Input } from '@/components/ui/Input'
import type { HabitFormProps } from './BangunPagiForm'

export function MakanSehatForm({ value, onChange }: HabitFormProps) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        label="Sarapan"
        placeholder="mis. Nasi + telur + susu"
        value={(value.breakfast as string) ?? ''}
        onChange={(e) => onChange({ ...value, breakfast: e.target.value })}
      />
      <Input
        label="Makan siang"
        placeholder="mis. Nasi + ayam + sayur"
        value={(value.lunch as string) ?? ''}
        onChange={(e) => onChange({ ...value, lunch: e.target.value })}
      />
      <Input
        label="Makan malam"
        placeholder="mis. Nasi + ikan + tempe"
        value={(value.dinner as string) ?? ''}
        onChange={(e) => onChange({ ...value, dinner: e.target.value })}
      />
    </div>
  )
}
