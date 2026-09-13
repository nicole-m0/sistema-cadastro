import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { createInstrumentSchema } from './instruments.schema';
import { listInstruments, createInstrument } from './instruments.service';

export const getInstruments = asyncHandler(async (_req: Request, res: Response) => {
  const instruments = await listInstruments();
  res.status(200).json({ success: true, data: instruments });
});

export const postInstrument = asyncHandler(async (req: Request, res: Response) => {
  const input = createInstrumentSchema.parse(req.body);
  const instrument = await createInstrument(input);
  res.status(201).json({ success: true, data: instrument });
});
