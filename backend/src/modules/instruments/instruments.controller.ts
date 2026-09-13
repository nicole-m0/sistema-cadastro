import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  createInstrumentSchema,
  listInstrumentsQuerySchema,
  updateInstrumentSchema,
} from './instruments.schema';
import {
  createInstrument,
  deleteInstrument,
  getInstrumentById,
  listInstruments,
  updateInstrument,
} from './instruments.service';

export const getInstruments = asyncHandler(async (req: Request, res: Response) => {
  const query = listInstrumentsQuerySchema.parse(req.query);
  const result = await listInstruments(query);
  res.status(200).json({ success: true, ...result });
});

export const getInstrument = asyncHandler(async (req: Request, res: Response) => {
  const instrument = await getInstrumentById(req.params.id);
  res.status(200).json({ success: true, data: instrument });
});

export const postInstrument = asyncHandler(async (req: Request, res: Response) => {
  const input = createInstrumentSchema.parse(req.body);
  const instrument = await createInstrument(input, req.admin?.sub);
  res.status(201).json({ success: true, data: instrument });
});

export const putInstrument = asyncHandler(async (req: Request, res: Response) => {
  const input = updateInstrumentSchema.parse(req.body);
  const instrument = await updateInstrument(req.params.id, input, req.admin?.sub);
  res.status(200).json({ success: true, data: instrument });
});

export const removeInstrument = asyncHandler(async (req: Request, res: Response) => {
  await deleteInstrument(req.params.id, req.admin?.sub);
  res.status(200).json({ success: true, message: 'Instrumento removido com sucesso.' });
});
