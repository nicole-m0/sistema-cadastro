import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  createClassGroupSchema,
  enrollStudentSchema,
  linkTeacherSchema,
  listClassGroupsQuerySchema,
  listStudentsQuerySchema,
  updateClassGroupSchema,
} from './class-groups.schema';
import {
  createClassGroup,
  deleteClassGroup,
  enrollStudent,
  getClassGroupById,
  linkTeacher,
  listClassGroups,
  listEnrollments,
  removeEnrollment,
  unlinkTeacher,
  updateClassGroup,
} from './class-groups.service';

export const getClassGroups = asyncHandler(async (req: Request, res: Response) => {
  const query = listClassGroupsQuerySchema.parse(req.query);
  const result = await listClassGroups(query);
  res.status(200).json({ success: true, ...result });
});

export const getClassGroup = asyncHandler(async (req: Request, res: Response) => {
  const classGroup = await getClassGroupById(req.params.id);
  res.status(200).json({ success: true, data: classGroup });
});

export const postClassGroup = asyncHandler(async (req: Request, res: Response) => {
  const input = createClassGroupSchema.parse(req.body);
  const classGroup = await createClassGroup(input, req.admin?.sub);
  res.status(201).json({ success: true, data: classGroup });
});

export const putClassGroup = asyncHandler(async (req: Request, res: Response) => {
  const input = updateClassGroupSchema.parse(req.body);
  const classGroup = await updateClassGroup(req.params.id, input, req.admin?.sub);
  res.status(200).json({ success: true, data: classGroup });
});

export const removeClassGroup = asyncHandler(async (req: Request, res: Response) => {
  await deleteClassGroup(req.params.id, req.admin?.sub);
  res.status(200).json({ success: true, message: 'Turma removida com sucesso.' });
});

export const getClassGroupStudents = asyncHandler(async (req: Request, res: Response) => {
  const query = listStudentsQuerySchema.parse(req.query);
  const enrollments = await listEnrollments(req.params.id, query.includeRemoved);
  res.status(200).json({ success: true, data: enrollments });
});

export const postClassGroupStudent = asyncHandler(async (req: Request, res: Response) => {
  const input = enrollStudentSchema.parse(req.body);
  const enrollment = await enrollStudent(req.params.id, input, req.admin?.sub);
  res.status(201).json({ success: true, data: enrollment });
});

export const removeClassGroupStudent = asyncHandler(async (req: Request, res: Response) => {
  await removeEnrollment(req.params.id, req.params.studentId, req.admin?.sub);
  res.status(200).json({ success: true, message: 'Aluno removido da turma com sucesso.' });
});

export const postClassGroupTeacher = asyncHandler(async (req: Request, res: Response) => {
  const input = linkTeacherSchema.parse(req.body);
  await linkTeacher(req.params.id, input, req.admin?.sub);
  res.status(201).json({ success: true, message: 'Professor vinculado à turma.' });
});

export const removeClassGroupTeacher = asyncHandler(async (req: Request, res: Response) => {
  await unlinkTeacher(req.params.id, req.params.teacherId, req.admin?.sub);
  res.status(200).json({ success: true, message: 'Professor removido da turma.' });
});
