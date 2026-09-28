'use client'

import type { ComponentType } from 'react'
import { BangunPagiForm, type HabitFormProps } from './BangunPagiForm'
import { BeribadahForm } from './BeribadahForm'
import { BerolahragaForm } from './BerolahragaForm'
import { MakanSehatForm } from './MakanSehatForm'
import { GemarBelajarForm } from './GemarBelajarForm'
import { BermasyarakatForm } from './BermasyarakatForm'
import { TidurCepatForm } from './TidurCepatForm'

export const habitFormComponents: Record<string, ComponentType<HabitFormProps>> = {
  'bangun-pagi': BangunPagiForm,
  beribadah: BeribadahForm,
  berolahraga: BerolahragaForm,
  'makan-sehat': MakanSehatForm,
  'gemar-belajar': GemarBelajarForm,
  bermasyarakat: BermasyarakatForm,
  'tidur-cepat': TidurCepatForm,
}

export type { HabitFormProps } from './BangunPagiForm'
