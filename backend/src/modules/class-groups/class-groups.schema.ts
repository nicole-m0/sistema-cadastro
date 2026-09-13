import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal('').transform(() => undefined));
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const weekdayEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);
export const classGroupStatusEnum = z.enum(['ACTIVE', 'CLOSED', 'SUSPENDED']);
export const classTeacherRoleEnum = z.enum(['RESPONSIBLE', 'ASSISTANT']);

export const createClassGroupSchema = z.object({
  name: z.string().trim().min(3, 'Nome da turma deve ter ao menos 3 caracteres.'),
  projectId: z.string().min(1, 'Projeto é obrigatório.'),
  instrumentId: z.string().min(1, 'Instrumento é obrigatório.'),
  weekday: weekdayEnum,
  startTime: z.string().regex(timeRegex, 'Horário de início inválido (use HH:mm).'),
  endTime: z.string().regex(timeRegex, 'Horário de término inválido (use HH:mm).').optional(),
  room: optionalString,
  capacity: z.coerce.number().int().positive().optional(),
  status: classGroupStatusEnum.default('ACTIVE'),
  notes: optionalString,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  responsibleTeacherId: z.string().min(1, 'Professor responsável é obrigatório.'),
  assistantTeacherIds: z.array(z.string().min(1)).default([]),
});

export const updateClassGroupSchema = createClassGroupSchema.partial();

export const listClassGroupsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  status: classGroupStatusEnum.optional(),
  projectId: z.string().optional(),
  instrumentId: z.string().optional(),
  teacherId: z.string().optional(),
});

export const enrollStudentSchema = z.object({
  studentId: z.string().min(1, 'Aluno é obrigatório.'),
});

export const linkTeacherSchema = z.object({
  teacherId: z.string().min(1, 'Professor é obrigatório.'),
  role: classTeacherRoleEnum,
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const classGroupStudentParamSchema = z.object({
  id: z.string().min(1),
  studentId: z.string().min(1),
});

export const classGroupTeacherParamSchema = z.object({
  id: z.string().min(1),
  teacherId: z.string().min(1),
});

export const listStudentsQuerySchema = z.object({
  includeRemoved: z.coerce.boolean().optional(),
});

export type CreateClassGroupInput = z.infer<typeof createClassGroupSchema>;
export type UpdateClassGroupInput = z.infer<typeof updateClassGroupSchema>;
export type ListClassGroupsQuery = z.infer<typeof listClassGroupsQuerySchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
export type LinkTeacherInput = z.infer<typeof linkTeacherSchema>;
