import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[env.AUTH_COOKIE_NAME];

  if (!token) {
    return next(ApiError.unauthorized('Sessão não encontrada. Faça login novamente.'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
    req.admin = payload;
    next();
  } catch {
    return next(ApiError.unauthorized('Sessão inválida ou expirada. Faça login novamente.'));
  }
}
