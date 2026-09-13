import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

const prismaMock = vi.hoisted(() => ({
  adminUser: { findUnique: vi.fn() },
  teacher: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  student: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  instrument: { findMany: vi.fn(), upsert: vi.fn() },
  auditLog: { create: vi.fn() },
}));

vi.mock('../../src/config/prisma', () => ({ prisma: prismaMock }));

// Importa a app apenas depois do mock estar registrado
import { createApp } from '../../src/app';

const app = createApp();

const ADMIN_ID = 'admin-1';
const ADMIN_EMAIL = 'admin@asafe.org';
const PLAIN_PASSWORD = 'SenhaCorreta123!';

beforeEach(async () => {
  vi.clearAllMocks();
  const passwordHash = await bcrypt.hash(PLAIN_PASSWORD, 4);
  prismaMock.adminUser.findUnique.mockResolvedValue({
    id: ADMIN_ID,
    name: 'Administrador Asafe',
    email: ADMIN_EMAIL,
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

describe('POST /api/auth/login', () => {
  it('retorna 200 e seta cookie httpOnly com credenciais válidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: PLAIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(ADMIN_EMAIL);
    expect(res.body.data.passwordHash).toBeUndefined();

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toMatch(/HttpOnly/);
  });

  it('retorna 401 com senha inválida', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'senha-errada' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('retorna 401 quando o e-mail não existe', async () => {
    prismaMock.adminUser.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@asafe.org', password: PLAIN_PASSWORD });

    expect(res.status).toBe(401);
  });

  it('retorna 400 quando o corpo é inválido', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nao-e-email' });
    expect(res.status).toBe(400);
  });
});

describe('Proteção de rotas privadas', () => {
  it('bloqueia acesso a /api/students sem cookie de sessão', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
  });

  it('bloqueia acesso a /api/auth/me sem cookie de sessão', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
