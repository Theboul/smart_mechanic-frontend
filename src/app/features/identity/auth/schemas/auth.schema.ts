import { z } from 'zod';

export const loginSchema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const userSchema = z.object({
  id_usuario: z.string().uuid(),
  nombre: z.string(),
  correo: z.string().email(),
  rol_nombre: z.string(),
  estado: z.boolean(),
  rol_contexto: z.string().optional().nullable(),
  id_taller: z.string().uuid().optional().nullable(),
  id_sucursal: z.string().uuid().optional().nullable(),
});

export const authResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  user: userSchema,
});

export type LoginCredentials = z.infer<typeof loginSchema>;
export type User = z.infer<typeof userSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
