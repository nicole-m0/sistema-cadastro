import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { getInstruments, postInstrument } from './instruments.controller';

const router = Router();

router.use(requireAuth);
router.get('/', getInstruments);
router.post('/', postInstrument);

export default router;
