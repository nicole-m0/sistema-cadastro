import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal('').transform(() => undefined));

export const studentStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']);
export const musicLevelEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const createStudentSchema = z.object({
  fullName: z.string().trim().min(3, 'Nome completo é obrigatório (mínimo 3 caracteres).'),
  socialName: optionalString,
  birthDate: z.coerce.date().optional(),
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
  city: optionalString,
  state: optionalString,
  instrumentId: optionalString,
  level: musicLevelEnum.default('BEGINNER'),
  teacherId: optionalString,
  enrollmentDate: z.coerce.date().optional(),
  status: studentStatusEnum.default('ACTIVE'),
  photoUrl: optionalString,
  photoPublicId: optionalString,
  notes: optionalString,
});

export const updateStudentSchema = createStudentSchema.partial();

export const listStudentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  status: studentStatusEnum.optional(),
  instrumentId: z.string().optional(),
  teacherId: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
