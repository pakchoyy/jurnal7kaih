'use client'

import { Input } from '@/components/ui/Input'
import type { HabitFormProps } from './BangunPagiForm'

export function BerolahragaForm({ value, onChange }: HabitFormProps) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        label="Olahraga apa?"
        placeholder="mis. Lari pagi"
        value={(value.activity as string) ?? ''}
        onChange={(e) => onChange({ ...value, activity: e.target.value })}
      />
      <Input
        label="Perasaan / pencapaian (opsional)"
        placeholder="mis. Segar dan semangat"
        value={(value.feeling as string) ?? ''}
        onChange={(e) => onChange({ ...value, feeling: e.target.value })}
      />
    </div>
  )
}
