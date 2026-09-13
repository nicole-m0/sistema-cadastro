import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal('').transform(() => undefined));

export const teacherStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

export const createTeacherSchema = z.object({
  fullName: z.string().trim().min(3, 'Nome completo é obrigatório (mínimo 3 caracteres).'),
  socialName: optionalString,
  document: optionalString,
  phone: optionalString,
  whatsapp: optionalString,
  email: z
    .string()
    .trim()
    .email('E-mail inválido.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  address: optionalString,
  specialty: optionalString,
  hireDate: z.coerce.date().optional(),
  status: teacherStatusEnum.default('ACTIVE'),
  photoUrl: optionalString,
  photoPublicId: optionalString,
  bio: optionalString,
  instrumentIds: z.array(z.string()).default([]),
});

export const updateTeacherSchema = createTeacherSchema.partial();

export const listTeachersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  status: teacherStatusEnum.optional(),
  instrumentId: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type ListTeachersQuery = z.infer<typeof listTeachersQuerySchema>;
