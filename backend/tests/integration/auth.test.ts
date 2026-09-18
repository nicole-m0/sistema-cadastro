import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('Rate limit de login', () => {
  it('bloqueia com 429 após muitas tentativas seguidas, sem revelar se o e-mail existe', async () => {
    const blockedBodies: { success: boolean; message?: string }[] = [];

    for (let attempt = 0; attempt < 20; attempt += 1) {
      // Alterna e-mail existente/inexistente: o bloqueio deve valer igual para os dois casos.
      const email = attempt % 2 === 0 ? ADMIN_EMAIL : 'naoexiste@asafe.org';
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'senha-errada' });

      if (res.status === 429) {
        blockedBodies.push(res.body);
        break;
      }
    }

    expect(blockedBodies).toHaveLength(1);
    const [blocked] = blockedBodies;
    expect(blocked.success).toBe(false);
    expect(blocked.message).toMatch(/tentativas/i);
    expect(blocked.message).not.toMatch(/e-?mail/i);
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

describe('Cookie de sessão conforme NODE_ENV', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
  });

  it('usa Secure e SameSite=None quando NODE_ENV=production', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';

    const { createApp: createProdApp } = await import('../../src/app');
    const prodApp = createProdApp();

    const res = await request(prodApp)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: PLAIN_PASSWORD });

    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toMatch(/Secure/);
    expect(setCookie[0]).toMatch(/SameSite=None/i);
  });

  it('usa SameSite=Lax e sem Secure quando NODE_ENV=development', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'development';

    const { createApp: createDevApp } = await import('../../src/app');
    const devApp = createDevApp();

    const res = await request(devApp)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: PLAIN_PASSWORD });

    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).not.toMatch(/Secure/);
    expect(setCookie[0]).toMatch(/SameSite=Lax/i);
  });
});
