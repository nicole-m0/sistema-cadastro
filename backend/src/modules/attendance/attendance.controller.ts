import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  createAttendanceSessionSchema,
  frequencyQuerySchema,
  listSessionsQuerySchema,
  updateAttendanceSessionSchema,
} from './attendance.schema';
import {
  createAttendanceSession,
  frequencyRowsToCsv,
  getAttendanceSessionById,
  getClassGroupFrequency,
  getProjectFrequency,
  getStudentFrequency,
  listAttendanceSessions,
  updateAttendanceSession,
} from './attendance.service';

export const postAttendanceSession = asyncHandler(async (req: Request, res: Response) => {
  const input = createAttendanceSessionSchema.parse(req.body);
  const session = await createAttendanceSession(input, req.admin?.sub);
  res.status(201).json({ success: true, data: session });
});

export const putAttendanceSession = asyncHandler(async (req: Request, res: Response) => {
  const input = updateAttendanceSessionSchema.parse(req.body);
  const session = await updateAttendanceSession(req.params.id, input, req.admin?.sub);
  res.status(200).json({ success: true, data: session });
});

export const getAttendanceSessions = asyncHandler(async (req: Request, res: Response) => {
  const query = listSessionsQuerySchema.parse(req.query);
  const result = await listAttendanceSessions(query);
  res.status(200).json({ success: true, ...result });
});

export const getAttendanceSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await getAttendanceSessionById(req.params.id);
  res.status(200).json({ success: true, data: session });
});

function sendFrequencyResponse(res: Response, format: 'json' | 'csv', rows: unknown[]) {
  if (format === 'csv') {
    const csv = frequencyRowsToCsv(rows as Parameters<typeof frequencyRowsToCsv>[0]);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-frequencia.csv"');
    res.status(200).send(csv);
    return;
  }
  res.status(200).json({ success: true, data: rows });
}

export const getStudentFrequencyReport = asyncHandler(async (req: Request, res: Response) => {
  const query = frequencyQuerySchema.parse(req.query);
  const rows = await getStudentFrequency(req.params.studentId, query);
  sendFrequencyResponse(res, query.format, rows);
});

export const getClassGroupFrequencyReport = asyncHandler(async (req: Request, res: Response) => {
  const query = frequencyQuerySchema.parse(req.query);
  const rows = await getClassGroupFrequency(req.params.classGroupId, query);
  sendFrequencyResponse(res, query.format, rows);
});

export const getProjectFrequencyReport = asyncHandler(async (req: Request, res: Response) => {
  const query = frequencyQuerySchema.parse(req.query);
  const rows = await getProjectFrequency(req.params.projectId, query);
  sendFrequencyResponse(res, query.format, rows);
});
