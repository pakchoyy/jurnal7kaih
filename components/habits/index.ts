'use client'

import type { ComponentType } from 'react'
import { BangunPagiForm, type HabitFormProps } from './BangunPagiForm'
import { BerolahragaForm } from './BerolahragaForm'
import { MakanSehatForm } from './MakanSehatForm'
import { GemarBelajarForm } from './GemarBelajarForm'
import { BermasyarakatForm } from './BermasyarakatForm'
import { TidurCepatForm } from './TidurCepatForm'

// Detail tambahan (opsional) per kebiasaan. Beribadah cukup pilihan + catatan.
export const habitFormComponents: Partial<Record<string, ComponentType<HabitFormProps>>> = {
  'bangun-pagi': BangunPagiForm,
  berolahraga: BerolahragaForm,
  'makan-sehat': MakanSehatForm,
  'gemar-belajar': GemarBelajarForm,
  bermasyarakat: BermasyarakatForm,
  'tidur-cepat': TidurCepatForm,
}

export type { HabitFormProps } from './BangunPagiForm'
