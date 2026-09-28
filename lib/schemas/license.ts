import { z } from 'zod'

export const registerSchoolSchema = z.object({
  schoolName: z.string().trim().min(3, 'Nama sekolah minimal 3 karakter'),
  adminName: z.string().trim().min(2, 'Nama admin minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone: z.string().optional(),
})

export type RegisterSchoolInput = z.infer<typeof registerSchoolSchema>
