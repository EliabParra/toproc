import { z } from 'zod'

export const CommonSchemas = {
    // Primitives
    id: z.number().int().positive(),
    email: z.string().email(),
    password: z.string().min(8), // Basic policy
    username: z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_-]+$/),

    // Complex
    pagination: z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
    }),
}
