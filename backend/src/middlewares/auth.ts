import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AuthTokenPayload;
    }
  }
}

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[env.AUTH_COOKIE_NAME];

  if (!token) {
    return next(ApiError.unauthorized('Sessão não encontrada. Faça login novamente.'));
  }

  let payload: AuthTokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
  } catch {
    return next(ApiError.unauthorized('Sessão inválida ou expirada. Faça login novamente.'));
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: { updatedAt: true },
  });

  if (!admin) {
    return next(ApiError.unauthorized('Sessão inválida ou expirada. Faça login novamente.'));
  }

  // Qualquer atualização do usuário (ex.: troca de senha) invalida tokens emitidos antes dela.
  const issuedAtMs = (payload.iat ?? 0) * 1000;
  if (admin.updatedAt.getTime() > issuedAtMs) {
    return next(ApiError.unauthorized('Sessão expirada. Faça login novamente.'));
  }

  req.admin = payload;
  next();
});
