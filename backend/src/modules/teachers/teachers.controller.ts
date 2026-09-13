import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  createTeacherSchema,
  listTeachersQuerySchema,
  updateTeacherSchema,
} from './teachers.schema';
import {
  createTeacher,
  deleteTeacher,
  getTeacherById,
  listTeachers,
  updateTeacher,
} from './teachers.service';

export const getTeachers = asyncHandler(async (req: Request, res: Response) => {
  const query = listTeachersQuerySchema.parse(req.query);
  const result = await listTeachers(query);
  res.status(200).json({ success: true, ...result });
});

export const getTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await getTeacherById(req.params.id);
  res.status(200).json({ success: true, data: teacher });
});

export const postTeacher = asyncHandler(async (req: Request, res: Response) => {
  const input = createTeacherSchema.parse(req.body);
  const teacher = await createTeacher(input, req.admin?.sub);
  res.status(201).json({ success: true, data: teacher });
});

export const putTeacher = asyncHandler(async (req: Request, res: Response) => {
  const input = updateTeacherSchema.parse(req.body);
  const teacher = await updateTeacher(req.params.id, input, req.admin?.sub);
  res.status(200).json({ success: true, data: teacher });
});

export const removeTeacher = asyncHandler(async (req: Request, res: Response) => {
  await deleteTeacher(req.params.id, req.admin?.sub);
  res.status(200).json({ success: true, message: 'Professor removido com sucesso.' });
});
