import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal('').transform(() => undefined));

export const projectStatusEnum = z.enum(['PLANNING', 'ACTIVE', 'CLOSED', 'ARCHIVED']);

export const createProjectSchema = z.object({
  name: z.string().trim().min(3, 'Nome do projeto deve ter ao menos 3 caracteres.'),
  description: optionalString,
  objective: optionalString,
  location: optionalString,
  responsible: optionalString,
  notes: optionalString,
  imageUrl: optionalString,
  imagePublicId: optionalString,
  status: projectStatusEnum.default('PLANNING'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  instrumentIds: z.array(z.string().min(1)).default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  status: projectStatusEnum.optional(),
});

export const linkInstrumentSchema = z.object({
  instrumentId: z.string().min(1, 'Instrumento é obrigatório.'),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const projectInstrumentParamSchema = z.object({
  id: z.string().min(1),
  instrumentId: z.string().min(1),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type LinkInstrumentInput = z.infer<typeof linkInstrumentSchema>;
