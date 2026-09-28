'use client'

import { Input } from '@/components/ui/Input'
import type { HabitFormProps } from './BangunPagiForm'

export function TidurCepatForm({ value, onChange }: HabitFormProps) {
  return (
    <Input
      type="time"
      label="Jam tidur malam"
      value={(value.sleep_time as string) ?? ''}
      onChange={(e) => onChange({ ...value, sleep_time: e.target.value })}
    />
  )
}
