import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  createProjectSchema,
  linkInstrumentSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from './projects.schema';
import {
  createProject,
  deleteProject,
  getProjectById,
  linkProjectInstrument,
  listProjects,
  unlinkProjectInstrument,
  updateProject,
} from './projects.service';

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const query = listProjectsQuerySchema.parse(req.query);
  const result = await listProjects(query);
  res.status(200).json({ success: true, ...result });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await getProjectById(req.params.id);
  res.status(200).json({ success: true, data: project });
});

export const postProject = asyncHandler(async (req: Request, res: Response) => {
  const input = createProjectSchema.parse(req.body);
  const project = await createProject(input, req.admin?.sub);
  res.status(201).json({ success: true, data: project });
});

export const putProject = asyncHandler(async (req: Request, res: Response) => {
  const input = updateProjectSchema.parse(req.body);
  const project = await updateProject(req.params.id, input, req.admin?.sub);
  res.status(200).json({ success: true, data: project });
});

export const removeProject = asyncHandler(async (req: Request, res: Response) => {
  await deleteProject(req.params.id, req.admin?.sub);
  res.status(200).json({ success: true, message: 'Projeto removido com sucesso.' });
});

export const postProjectInstrument = asyncHandler(async (req: Request, res: Response) => {
  const input = linkInstrumentSchema.parse(req.body);
  await linkProjectInstrument(req.params.id, input.instrumentId, req.admin?.sub);
  res.status(201).json({ success: true, message: 'Instrumento vinculado ao projeto.' });
});

export const removeProjectInstrument = asyncHandler(async (req: Request, res: Response) => {
  await unlinkProjectInstrument(req.params.id, req.params.instrumentId, req.admin?.sub);
  res.status(200).json({ success: true, message: 'Instrumento removido do projeto.' });
});
