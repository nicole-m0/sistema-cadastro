import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';
import { loginSchema } from './auth.schema';
import { login, logout, me } from './auth.controller';

const router = Router();

router.post('/login', validate({ body: loginSchema }), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
