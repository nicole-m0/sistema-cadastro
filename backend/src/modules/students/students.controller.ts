import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  createStudentSchema,
  listStudentsQuerySchema,
  updateStudentSchema,
} from './students.schema';
import {
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  updateStudent,
} from './students.service';

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  const query = listStudentsQuerySchema.parse(req.query);
  const result = await listStudents(query);
  res.status(200).json({ success: true, ...result });
});

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await getStudentById(req.params.id);
  res.status(200).json({ success: true, data: student });
});

export const postStudent = asyncHandler(async (req: Request, res: Response) => {
  const input = createStudentSchema.parse(req.body);
  const student = await createStudent(input, req.admin?.sub);
  res.status(201).json({ success: true, data: student });
});

export const putStudent = asyncHandler(async (req: Request, res: Response) => {
  const input = updateStudentSchema.parse(req.body);
  const student = await updateStudent(req.params.id, input, req.admin?.sub);
  res.status(200).json({ success: true, data: student });
});

export const removeStudent = asyncHandler(async (req: Request, res: Response) => {
  await deleteStudent(req.params.id, req.admin?.sub);
  res.status(200).json({ success: true, message: 'Aluno removido com sucesso.' });
});
