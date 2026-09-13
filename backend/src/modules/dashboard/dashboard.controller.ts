import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { getDashboardSummary } from './dashboard.service';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await getDashboardSummary();
  res.status(200).json({ success: true, data: summary });
});
