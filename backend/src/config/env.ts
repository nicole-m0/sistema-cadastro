import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  // Sem valor default: se não for definido explicitamente (ex.: esquecido na Railway), o app
  // deve falhar ao iniciar em vez de rodar silenciosamente como "development" — isso é o que
  // define secure/sameSite do cookie de sessão (ver auth.controller.ts).
  NODE_ENV: z.enum(['development', 'production', 'test'], {
    required_error: 'NODE_ENV é obrigatório (development | production | test).',
  }),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres.'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  AUTH_COOKIE_NAME: z.string().default('asafe_session'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  ADMIN_NAME: z.string().default('Administrador Asafe'),
  ADMIN_EMAIL: z.string().email().default('admin@asafe.org'),
  ADMIN_PASSWORD: z.string().default('TrocarEssaSenha123!'),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  CLOUDINARY_FOLDER: z.string().default('asafe'),
  MAX_UPLOAD_SIZE_BYTES: z.coerce.number().default(5 * 1024 * 1024),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuração de ambiente inválida. Verifique o arquivo .env.');
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export const corsOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
