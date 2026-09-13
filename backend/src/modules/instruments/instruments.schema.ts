import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal('').transform(() => undefined));

export const instrumentStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

export const createInstrumentSchema = z.object({
  name: z.string().trim().min(2, 'Nome do instrumento deve ter ao menos 2 caracteres.'),
  description: optionalString,
  displayOrder: z.coerce.number().int().optional(),
  status: instrumentStatusEnum.default('ACTIVE'),
});

export const updateInstrumentSchema = createInstrumentSchema.partial();

export const listInstrumentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  status: instrumentStatusEnum.optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateInstrumentInput = z.infer<typeof createInstrumentSchema>;
export type UpdateInstrumentInput = z.infer<typeof updateInstrumentSchema>;
export type ListInstrumentsQuery = z.infer<typeof listInstrumentsQuerySchema>;
