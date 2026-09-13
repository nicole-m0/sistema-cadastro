import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const prismaMock = vi.hoisted(() => ({
  instrument: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  student: { count: vi.fn() },
  teacherInstrument: { count: vi.fn() },
  projectInstrument: { count: vi.fn(), findMany: vi.fn() },
  classGroup: { count: vi.fn(), findMany: vi.fn() },
  auditLog: { create: vi.fn() },
}));

vi.mock('../../src/config/prisma', () => ({ prisma: prismaMock }));

import { createApp } from '../../src/app';

const app = createApp();

function authCookie() {
  const token = jwt.sign(
    { sub: 'admin-1', email: 'admin@asafe.org', name: 'Admin' },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' },
  );
  return `${process.env.AUTH_COOKIE_NAME}=${token}`;
}

const baseInstrument = {
  id: 'instrument-1',
  name: 'Violão',
  description: null,
  status: 'ACTIVE',
  displayOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/instruments', () => {
  it('lista instrumentos paginados quando autenticado', async () => {
    prismaMock.instrument.findMany.mockResolvedValue([baseInstrument]);
    prismaMock.instrument.count.mockResolvedValue(1);

    const res = await request(app).get('/api/instruments').set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });

  it('retorna 401 sem cookie de sessão', async () => {
    const res = await request(app).get('/api/instruments');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/instruments', () => {
  it('cria um instrumento com dados válidos', async () => {
    prismaMock.instrument.create.mockResolvedValue(baseInstrument);
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/instruments')
      .set('Cookie', authCookie())
      .send({ name: 'Violão', description: 'Violão popular' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Violão');
    expect(prismaMock.auditLog.create).toHaveBeenCalledOnce();
  });

  it('retorna 400 com nome muito curto', async () => {
    const res = await request(app)
      .post('/api/instruments')
      .set('Cookie', authCookie())
      .send({ name: 'A' });

    expect(res.status).toBe(400);
    expect(prismaMock.instrument.create).not.toHaveBeenCalled();
  });
});

describe('PUT /api/instruments/:id', () => {
  it('ativa/desativa um instrumento existente', async () => {
    prismaMock.instrument.findUnique.mockResolvedValue(baseInstrument);
    prismaMock.instrument.update.mockResolvedValue({ ...baseInstrument, status: 'INACTIVE' });
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .put('/api/instruments/instrument-1')
      .set('Cookie', authCookie())
      .send({ status: 'INACTIVE' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('INACTIVE');
  });

  it('retorna 404 ao atualizar instrumento inexistente', async () => {
    prismaMock.instrument.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/instruments/nao-existe')
      .set('Cookie', authCookie())
      .send({ status: 'INACTIVE' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/instruments/:id', () => {
  it('bloqueia exclusão quando há vínculos', async () => {
    prismaMock.instrument.findUnique.mockResolvedValue(baseInstrument);
    prismaMock.student.count.mockResolvedValue(2);
    prismaMock.teacherInstrument.count.mockResolvedValue(0);
    prismaMock.projectInstrument.count.mockResolvedValue(0);
    prismaMock.classGroup.count.mockResolvedValue(0);

    const res = await request(app)
      .delete('/api/instruments/instrument-1')
      .set('Cookie', authCookie());

    expect(res.status).toBe(409);
    expect(prismaMock.instrument.delete).not.toHaveBeenCalled();
  });

  it('permite exclusão quando não há vínculos', async () => {
    prismaMock.instrument.findUnique.mockResolvedValue(baseInstrument);
    prismaMock.student.count.mockResolvedValue(0);
    prismaMock.teacherInstrument.count.mockResolvedValue(0);
    prismaMock.projectInstrument.count.mockResolvedValue(0);
    prismaMock.classGroup.count.mockResolvedValue(0);
    prismaMock.instrument.delete.mockResolvedValue(baseInstrument);
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .delete('/api/instruments/instrument-1')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(prismaMock.instrument.delete).toHaveBeenCalledOnce();
  });
});
