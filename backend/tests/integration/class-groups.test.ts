import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const prismaMock = vi.hoisted(() => ({
  classGroup: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  project: { findFirst: vi.fn() },
  projectInstrument: { findUnique: vi.fn() },
  teacher: { findMany: vi.fn() },
  student: { findFirst: vi.fn() },
  enrollment: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  classTeacher: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  auditLog: { create: vi.fn() },
  $transaction: vi.fn(),
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

const baseClassGroup = {
  id: 'class-1',
  name: 'Violão Iniciante - Turma A',
  projectId: 'project-1',
  instrumentId: 'instrument-1',
  weekday: 'TUESDAY',
  startTime: '14:00',
  endTime: '15:00',
  room: 'Sala 1',
  capacity: 10,
  status: 'ACTIVE',
  notes: null,
  startDate: null,
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  project: { id: 'project-1', name: 'Projeto Jovem Asafe', status: 'ACTIVE' },
  instrument: { id: 'instrument-1', name: 'Violão' },
  teachers: [{ teacherId: 'teacher-1', role: 'RESPONSIBLE', teacher: { id: 'teacher-1', fullName: 'Marcos', status: 'ACTIVE' } }],
  _count: { enrollments: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (arg) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg(prismaMock);
  });
});

describe('POST /api/class-groups', () => {
  it('cria uma turma quando o instrumento está vinculado ao projeto', async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: 'project-1' });
    prismaMock.projectInstrument.findUnique.mockResolvedValue({
      projectId: 'project-1',
      instrumentId: 'instrument-1',
    });
    prismaMock.teacher.findMany.mockResolvedValue([{ id: 'teacher-1' }]);
    prismaMock.classGroup.create.mockResolvedValue(baseClassGroup);
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/class-groups')
      .set('Cookie', authCookie())
      .send({
        name: 'Violão Iniciante - Turma A',
        projectId: 'project-1',
        instrumentId: 'instrument-1',
        weekday: 'TUESDAY',
        startTime: '14:00',
        responsibleTeacherId: 'teacher-1',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Violão Iniciante - Turma A');
  });

  it('retorna 400 quando o instrumento não está vinculado ao projeto', async () => {
    prismaMock.project.findFirst.mockResolvedValue({ id: 'project-1' });
    prismaMock.projectInstrument.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/class-groups')
      .set('Cookie', authCookie())
      .send({
        name: 'Turma X',
        projectId: 'project-1',
        instrumentId: 'instrument-2',
        weekday: 'TUESDAY',
        startTime: '14:00',
        responsibleTeacherId: 'teacher-1',
      });

    expect(res.status).toBe(400);
    expect(prismaMock.classGroup.create).not.toHaveBeenCalled();
  });

  it('retorna 400 quando o professor responsável não é enviado', async () => {
    const res = await request(app)
      .post('/api/class-groups')
      .set('Cookie', authCookie())
      .send({
        name: 'Turma X',
        projectId: 'project-1',
        instrumentId: 'instrument-1',
        weekday: 'TUESDAY',
        startTime: '14:00',
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/class-groups/:id/students', () => {
  it('matricula um aluno na turma', async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue(baseClassGroup);
    prismaMock.student.findFirst.mockResolvedValue({ id: 'student-1' });
    prismaMock.enrollment.findUnique.mockResolvedValue(null);
    prismaMock.enrollment.create.mockResolvedValue({ id: 'enrollment-1' });
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/class-groups/class-1/students')
      .set('Cookie', authCookie())
      .send({ studentId: 'student-1' });

    expect(res.status).toBe(201);
  });

  it('retorna 409 ao matricular aluno já matriculado', async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue(baseClassGroup);
    prismaMock.student.findFirst.mockResolvedValue({ id: 'student-1' });
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enrollment-1', removedAt: null });

    const res = await request(app)
      .post('/api/class-groups/class-1/students')
      .set('Cookie', authCookie())
      .send({ studentId: 'student-1' });

    expect(res.status).toBe(409);
    expect(prismaMock.enrollment.create).not.toHaveBeenCalled();
  });

  it('reativa a matrícula de um aluno removido anteriormente', async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue(baseClassGroup);
    prismaMock.student.findFirst.mockResolvedValue({ id: 'student-1' });
    prismaMock.enrollment.findUnique.mockResolvedValue({
      id: 'enrollment-1',
      removedAt: new Date(),
    });
    prismaMock.enrollment.update.mockResolvedValue({ id: 'enrollment-1', removedAt: null });
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/class-groups/class-1/students')
      .set('Cookie', authCookie())
      .send({ studentId: 'student-1' });

    expect(res.status).toBe(201);
    expect(prismaMock.enrollment.update).toHaveBeenCalledOnce();
    expect(prismaMock.enrollment.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/class-groups/:id/teachers', () => {
  it('retorna 409 ao vincular professor responsável já vinculado com outro papel', async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue(baseClassGroup);
    prismaMock.teacher.findMany.mockResolvedValue([{ id: 'teacher-2' }]);
    prismaMock.classTeacher.findUnique.mockResolvedValue({
      classGroupId: 'class-1',
      teacherId: 'teacher-2',
      role: 'ASSISTANT',
    });

    const res = await request(app)
      .post('/api/class-groups/class-1/teachers')
      .set('Cookie', authCookie())
      .send({ teacherId: 'teacher-2', role: 'RESPONSIBLE' });

    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/class-groups/:id/teachers/:teacherId', () => {
  it('bloqueia remoção do professor responsável', async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue(baseClassGroup);
    prismaMock.classTeacher.findUnique.mockResolvedValue({
      classGroupId: 'class-1',
      teacherId: 'teacher-1',
      role: 'RESPONSIBLE',
    });

    const res = await request(app)
      .delete('/api/class-groups/class-1/teachers/teacher-1')
      .set('Cookie', authCookie());

    expect(res.status).toBe(400);
    expect(prismaMock.classTeacher.delete).not.toHaveBeenCalled();
  });

  it('remove um professor auxiliar', async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue(baseClassGroup);
    prismaMock.classTeacher.findUnique.mockResolvedValue({
      classGroupId: 'class-1',
      teacherId: 'teacher-2',
      role: 'ASSISTANT',
    });
    prismaMock.classTeacher.delete.mockResolvedValue({});
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .delete('/api/class-groups/class-1/teachers/teacher-2')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
  });
});
