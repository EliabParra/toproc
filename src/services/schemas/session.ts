import { z } from 'zod'

export const LoginSchema = z.object({
    identifier: z.string().min(1, ''),
    password: z.string().min(1, 'Password is required'),
})

export const SessionUserSchema = z.object({
    id: z.number(),
    username: z.string(),
    email: z.email(),
    password_hash: z.string(),
    email_verified_at: z.date().nullable(),
    profile_id: z.number(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type SessionUserRow = z.infer<typeof SessionUserSchema>