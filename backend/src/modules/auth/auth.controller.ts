import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { env, isProduction } from '../../config/env';
import { changePasswordSchema, loginSchema } from './auth.schema';
import { authenticateAdmin, changeAdminPassword, getAdminById } from './auth.service';
import { ApiError } from '../../utils/ApiError';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const { token, admin } = await authenticateAdmin(input);

  res.cookie(env.AUTH_COOKIE_NAME, token, cookieOptions());
  res.status(200).json({ success: true, data: admin });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(env.AUTH_COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.status(200).json({ success: true, message: 'Sessão encerrada.' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.admin) {
    throw ApiError.unauthorized();
  }
  const admin = await getAdminById(req.admin.sub);
  res.status(200).json({ success: true, data: admin });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.admin) {
    throw ApiError.unauthorized();
  }
  const input = changePasswordSchema.parse(req.body);
  await changeAdminPassword(req.admin.sub, input);

  // A troca de senha invalida a sessão atual (ver requireAuth), então também limpamos o cookie aqui.
  res.clearCookie(env.AUTH_COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.status(200).json({
    success: true,
    message: 'Senha alterada com sucesso. Faça login novamente.',
  });
});
