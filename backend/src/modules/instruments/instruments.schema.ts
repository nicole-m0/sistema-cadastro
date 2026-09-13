import { z } from 'zod';

export const createInstrumentSchema = z.object({
  name: z.string().trim().min(2, 'Nome do instrumento deve ter ao menos 2 caracteres.'),
});

export type CreateInstrumentInput = z.infer<typeof createInstrumentSchema>;
