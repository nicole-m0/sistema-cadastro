import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';
import { loginRateLimiter } from '../../middlewares/rateLimit';
import { changePasswordSchema, loginSchema } from './auth.schema';
import { changePassword, login, logout, me } from './auth.controller';

const router = Router();

router.post('/login', loginRateLimiter, validate({ body: loginSchema }), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.put('/password', requireAuth, validate({ body: changePasswordSchema }), changePassword);

export default router;
