import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export const loginNisSchema = z.object({
  nis: z.string().trim().min(1, 'NIS wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export const activateParentSchema = z.object({
  code: z.string().trim().min(1, 'Kode aktivasi wajib diisi'),
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Minimal 6 karakter'),
  relationship: z.enum(['Ayah', 'Ibu', 'Wali']),
})

export const linkChildSchema = z.object({
  code: z.string().trim().min(1, 'Kode aktivasi wajib diisi'),
  relationship: z.enum(['Ayah', 'Ibu', 'Wali']),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ActivateParentInput = z.infer<typeof activateParentSchema>
export type LinkChildInput = z.infer<typeof linkChildSchema>
