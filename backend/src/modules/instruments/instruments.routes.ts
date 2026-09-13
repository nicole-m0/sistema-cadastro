import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createInstrumentSchema, idParamSchema, updateInstrumentSchema } from './instruments.schema';
import {
  getInstrument,
  getInstruments,
  postInstrument,
  putInstrument,
  removeInstrument,
} from './instruments.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getInstruments);
router.get('/:id', validate({ params: idParamSchema }), getInstrument);
router.post('/', validate({ body: createInstrumentSchema }), postInstrument);
router.put('/:id', validate({ params: idParamSchema, body: updateInstrumentSchema }), putInstrument);
router.delete('/:id', validate({ params: idParamSchema }), removeInstrument);

export default router;
