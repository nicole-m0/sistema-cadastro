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

const baseStudent = {
  id: 'student-1',
  fullName: 'Aluno Teste',
  socialName: null,
  birthDate: null,
  document: null,
  phone: '11999999999',
  whatsapp: null,
  email: 'aluno@example.com',
  address: null,
  city: null,
  state: null,
  level: 'BEGINNER',
  enrollmentDate: null,
  status: 'ACTIVE',
  photoUrl: null,
  photoPublicId: null,
  notes: null,
  instrumentId: null,
  teacherId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  instrument: null,
  teacher: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.adminUser.findUnique.mockResolvedValue({ updatedAt: new Date('2020-01-01T00:00:00.000Z') });
});

describe('GET /api/students', () => {
  it('lista alunos paginados quando autenticado', async () => {
    prismaMock.student.findMany.mockResolvedValue([baseStudent]);
    prismaMock.student.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/students')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.meta.total).toBe(1);
  });
});

describe('POST /api/students', () => {
  it('cria um aluno com dados válidos', async () => {
    prismaMock.student.create.mockResolvedValue(baseStudent);
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/students')
      .set('Cookie', authCookie())
      .send({ fullName: 'Aluno Teste', email: 'aluno@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.data.fullName).toBe('Aluno Teste');
    expect(prismaMock.student.create).toHaveBeenCalledOnce();
    expect(prismaMock.auditLog.create).toHaveBeenCalledOnce();
  });

  it('retorna 400 quando o nome completo não é enviado', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Cookie', authCookie())
      .send({ email: 'aluno@example.com' });

    expect(res.status).toBe(400);
    expect(prismaMock.student.create).not.toHaveBeenCalled();
  });

  it('retorna 400 quando o teacherId informado não existe', async () => {
    prismaMock.teacher.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/students')
      .set('Cookie', authCookie())
      .send({ fullName: 'Aluno Teste', teacherId: 'professor-inexistente' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/students/:id', () => {
  it('atualiza um aluno existente', async () => {
    prismaMock.student.findFirst.mockResolvedValue(baseStudent);
    prismaMock.student.update.mockResolvedValue({ ...baseStudent, fullName: 'Novo Nome' });
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .put('/api/students/student-1')
      .set('Cookie', authCookie())
      .send({ fullName: 'Novo Nome' });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Novo Nome');
  });

  it('retorna 404 ao atualizar aluno inexistente', async () => {
    prismaMock.student.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/students/nao-existe')
      .set('Cookie', authCookie())
      .send({ fullName: 'Novo Nome' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/students/:id', () => {
  it('exclui (soft delete) um aluno existente', async () => {
    prismaMock.student.findFirst.mockResolvedValue(baseStudent);
    prismaMock.student.update.mockResolvedValue({ ...baseStudent, deletedAt: new Date() });
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .delete('/api/students/student-1')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(prismaMock.student.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'student-1' } }),
    );
  });

  it('retorna 404 ao excluir aluno inexistente', async () => {
    prismaMock.student.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/students/nao-existe')
      .set('Cookie', authCookie());

    expect(res.status).toBe(404);
  });
});
