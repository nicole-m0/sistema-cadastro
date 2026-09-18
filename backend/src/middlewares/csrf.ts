import { NextFunction, Request, Response } from 'express';
import { corsOrigins } from '../config/env';
import { ApiError } from '../utils/ApiError';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function originFromHeaderValue(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

// Defesa contra CSRF para o cenário de cookie httpOnly + frontend em domínio separado
// (ex.: Vercel + Railway, sameSite=none em produção). A maioria das rotas de escrita já é
// protegida indiretamente pelo preflight de CORS (exigem Content-Type: application/json),
// mas o upload usa multipart/form-data, que não dispara preflight — por isso essa checagem
// roda para todo método de mutação, não só upload. Requisições sem Origin/Referer (curl,
// ferramentas internas, testes automatizados) são deixadas passar: um browser sempre envia
// Origin em requisições de mutação, então é isso que um ataque real teria preenchido.
export function verifyOrigin(req: Request, _res: Response, next: NextFunction) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  // Comparação estrita com undefined (não "falsy"): um header presente mas vazio deve ser
  // tratado como "Origin inválida" (cai na validação abaixo e é rejeitado), não como "header
  // ausente" — só a ausência real (undefined) é que deixa passar.
  const headerValue = req.headers.origin !== undefined ? req.headers.origin : req.headers.referer;
  if (headerValue === undefined) {
    return next();
  }

  const origin = originFromHeaderValue(headerValue);
  if (!origin || !corsOrigins.includes(origin)) {
    return next(ApiError.forbidden('Origem da requisição não permitida.'));
  }

  next();
}
