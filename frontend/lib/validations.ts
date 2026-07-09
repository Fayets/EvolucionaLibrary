import { z } from 'zod';

export const resourceSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede tener más de 80 caracteres')
    .trim(),
  url: z
    .string()
    .url('Tiene que ser una URL válida (ej: https://...)')
    .trim(),
  category: z
    .string()
    .min(1, 'Tenés que indicar una categoría')
    .max(40, 'La categoría es muy larga')
    .trim(),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(10, 'Máximo 10 tags por recurso')
    .default([]),
});

export type ResourceInput = z.infer<typeof resourceSchema>;