import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal('').transform(() => undefined));

export const attendanceStatusEnum = z.enum(['PRESENT', 'ABSENT', 'JUSTIFIED', 'LATE']);

export const attendanceRecordInputSchema = z.object({
  studentId: z.string().min(1),
  status: attendanceStatusEnum,
  note: optionalString,
});

export const createAttendanceSessionSchema = z.object({
  classGroupId: z.string().min(1, 'Turma é obrigatória.'),
  date: z.coerce.date(),
  generalNotes: optionalString,
  records: z.array(attendanceRecordInputSchema).min(1, 'Informe ao menos um registro de presença.'),
});

export const updateAttendanceSessionSchema = z.object({
  generalNotes: optionalString,
  records: z.array(attendanceRecordInputSchema).min(1, 'Informe ao menos um registro de presença.'),
});

export const listSessionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  classGroupId: z.string().optional(),
  projectId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const frequencyQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  instrumentId: z.string().optional(),
  classGroupId: z.string().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const studentIdParamSchema = z.object({
  studentId: z.string().min(1),
});

export const classGroupIdParamSchema = z.object({
  classGroupId: z.string().min(1),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().min(1),
});

export type CreateAttendanceSessionInput = z.infer<typeof createAttendanceSessionSchema>;
export type UpdateAttendanceSessionInput = z.infer<typeof updateAttendanceSessionSchema>;
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;
export type FrequencyQuery = z.infer<typeof frequencyQuerySchema>;
