import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'USER', 'OPERATOR']),
});

// Inferir automáticamente los tipos desde Zod (Evita duplicar interfaces en Models)
export type LoginCredentials = z.infer<typeof loginSchema>;
export type User = z.infer<typeof userSchema>;
