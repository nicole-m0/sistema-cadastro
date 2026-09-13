import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { getDashboard } from './dashboard.controller';

const router = Router();

router.use(requireAuth);
router.get('/', getDashboard);

export default router;
