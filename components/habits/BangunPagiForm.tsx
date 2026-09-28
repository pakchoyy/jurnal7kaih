'use client'

import { Input } from '@/components/ui/Input'

export interface HabitFormProps {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

export function BangunPagiForm({ value, onChange }: HabitFormProps) {
  return (
    <Input
      type="time"
      label="Jam bangun pagi"
      value={(value.wake_time as string) ?? ''}
      onChange={(e) => onChange({ ...value, wake_time: e.target.value })}
    />
  )
}
