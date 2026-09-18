import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const prismaMock = vi.hoisted(() => ({
  adminUser: { findUnique: vi.fn() },
  teacher: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  student: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  instrument: { findMany: vi.fn(), upsert: vi.fn() },
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

const baseTeacher = {
  id: 'teacher-1',
  fullName: 'Professor Teste',
  socialName: null,
  document: null,
  phone: '11988887777',
  whatsapp: null,
  email: 'professor@example.com',
  address: null,
  specialty: 'Violão',
  hireDate: null,
  status: 'ACTIVE',
  photoUrl: null,
  photoPublicId: null,
  bio: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  instruments: [],
  _count: { students: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.adminUser.findUnique.mockResolvedValue({ updatedAt: new Date('2020-01-01T00:00:00.000Z') });
});

describe('GET /api/teachers', () => {
  it('lista professores paginados', async () => {
    prismaMock.teacher.findMany.mockResolvedValue([baseTeacher]);
    prismaMock.teacher.count.mockResolvedValue(1);

    const res = await request(app).get('/api/teachers').set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].studentsCount).toBe(0);
  });
});

describe('POST /api/teachers', () => {
  it('cria um professor com dados válidos', async () => {
    prismaMock.teacher.create.mockResolvedValue(baseTeacher);
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie())
      .send({ fullName: 'Professor Teste', email: 'professor@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.data.fullName).toBe('Professor Teste');
  });

  it('retorna 400 quando o nome completo não é enviado', async () => {
    const res = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie())
      .send({ email: 'professor@example.com' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 com e-mail em formato inválido', async () => {
    const res = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie())
      .send({ fullName: 'Professor Teste', email: 'nao-e-email' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/teachers/:id', () => {
  it('atualiza um professor existente', async () => {
    prismaMock.teacher.findFirst.mockResolvedValue(baseTeacher);
    prismaMock.teacher.update.mockResolvedValue({ ...baseTeacher, status: 'INACTIVE' });
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .put('/api/teachers/teacher-1')
      .set('Cookie', authCookie())
      .send({ status: 'INACTIVE' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('INACTIVE');
  });
});

describe('DELETE /api/teachers/:id', () => {
  it('exclui (soft delete) um professor existente', async () => {
    prismaMock.teacher.findFirst.mockResolvedValue(baseTeacher);
    prismaMock.teacher.update.mockResolvedValue({ ...baseTeacher, deletedAt: new Date() });
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app).delete('/api/teachers/teacher-1').set('Cookie', authCookie());

    expect(res.status).toBe(200);
  });

  it('retorna 404 ao excluir professor inexistente', async () => {
    prismaMock.teacher.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/teachers/nao-existe').set('Cookie', authCookie());

    expect(res.status).toBe(404);
  });
});
