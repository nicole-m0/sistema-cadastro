import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const prismaMock = vi.hoisted(() => ({
  adminUser: { findUnique: vi.fn() },
  classGroup: { findFirst: vi.fn() },
  attendanceSession: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  attendanceRecord: { update: vi.fn(), findMany: vi.fn() },
  enrollment: { findMany: vi.fn() },
  student: { findFirst: vi.fn() },
  project: { findFirst: vi.fn() },
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

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.adminUser.findUnique.mockResolvedValue({ updatedAt: new Date('2020-01-01T00:00:00.000Z') });
  prismaMock.$transaction.mockImplementation(async (arg) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg(prismaMock);
  });
});

const baseSession = {
  id: 'session-1',
  classGroupId: 'class-1',
  date: new Date('2025-03-04'),
  generalNotes: null,
  createdById: 'admin-1',
  updatedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  classGroup: { id: 'class-1', name: 'Turma A', project: { id: 'project-1', name: 'Projeto' } },
  createdBy: { id: 'admin-1', name: 'Admin' },
  updatedBy: null,
  records: [
    {
      id: 'record-1',
      sessionId: 'session-1',
      studentId: 'student-1',
      status: 'PRESENT',
      note: null,
      student: { id: 'student-1', fullName: 'Ana', photoUrl: null },
    },
    {
      id: 'record-2',
      sessionId: 'session-1',
      studentId: 'student-2',
      status: 'ABSENT',
      note: null,
      student: { id: 'student-2', fullName: 'João', photoUrl: null },
    },
  ],
};

describe('POST /api/attendance/sessions', () => {
  it('cria uma chamada quando o roster bate com as matrículas ativas', async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue({ id: 'class-1' });
    prismaMock.attendanceSession.findUnique.mockResolvedValue(null);
    prismaMock.enrollment.findMany.mockResolvedValue([
      { studentId: 'student-1' },
      { studentId: 'student-2' },
    ]);
    prismaMock.attendanceSession.create.mockResolvedValue(baseSession);
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/attendance/sessions')
      .set('Cookie', authCookie())
      .send({
        classGroupId: 'class-1',
        date: '2025-03-04',
        records: [
          { studentId: 'student-1', status: 'PRESENT' },
          { studentId: 'student-2', status: 'ABSENT' },
        ],
      });

    expect(res.status).toBe(201);
  });

  it('retorna 400 quando o roster enviado não bate com as matrículas ativas', async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue({ id: 'class-1' });
    prismaMock.attendanceSession.findUnique.mockResolvedValue(null);
    prismaMock.enrollment.findMany.mockResolvedValue([
      { studentId: 'student-1' },
      { studentId: 'student-2' },
    ]);

    const res = await request(app)
      .post('/api/attendance/sessions')
      .set('Cookie', authCookie())
      .send({
        classGroupId: 'class-1',
        date: '2025-03-04',
        records: [{ studentId: 'student-1', status: 'PRESENT' }],
      });

    expect(res.status).toBe(400);
    expect(prismaMock.attendanceSession.create).not.toHaveBeenCalled();
  });

  it('retorna 409 ao tentar criar duas chamadas na mesma turma e data', async () => {
    prismaMock.classGroup.findFirst.mockResolvedValue({ id: 'class-1' });
    prismaMock.attendanceSession.findUnique.mockResolvedValue(baseSession);

    const res = await request(app)
      .post('/api/attendance/sessions')
      .set('Cookie', authCookie())
      .send({
        classGroupId: 'class-1',
        date: '2025-03-04',
        records: [
          { studentId: 'student-1', status: 'PRESENT' },
          { studentId: 'student-2', status: 'ABSENT' },
        ],
      });

    expect(res.status).toBe(409);
    expect(prismaMock.attendanceSession.create).not.toHaveBeenCalled();
  });
});

describe('PUT /api/attendance/sessions/:id', () => {
  it('edita uma chamada existente mantendo o mesmo roster', async () => {
    prismaMock.attendanceSession.findUnique.mockResolvedValue(baseSession);
    prismaMock.attendanceSession.update.mockResolvedValue({});
    prismaMock.attendanceRecord.update.mockResolvedValue({});
    prismaMock.attendanceSession.findUniqueOrThrow.mockResolvedValue({
      ...baseSession,
      generalNotes: 'Editado',
    });
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .put('/api/attendance/sessions/session-1')
      .set('Cookie', authCookie())
      .send({
        generalNotes: 'Editado',
        records: [
          { studentId: 'student-1', status: 'LATE' },
          { studentId: 'student-2', status: 'JUSTIFIED' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.generalNotes).toBe('Editado');
  });

  it('retorna 400 ao tentar incluir aluno fora do roster original', async () => {
    prismaMock.attendanceSession.findUnique.mockResolvedValue(baseSession);

    const res = await request(app)
      .put('/api/attendance/sessions/session-1')
      .set('Cookie', authCookie())
      .send({
        records: [{ studentId: 'student-3', status: 'PRESENT' }],
      });

    expect(res.status).toBe(400);
    expect(prismaMock.attendanceSession.update).not.toHaveBeenCalled();
  });
});

describe('GET /api/attendance/reports/student/:studentId', () => {
  it('calcula o percentual de frequência do aluno', async () => {
    prismaMock.student.findFirst.mockResolvedValue({ id: 'student-1' });
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        studentId: 'student-1',
        classGroupId: 'class-1',
        student: { id: 'student-1', fullName: 'Ana' },
        classGroup: {
          id: 'class-1',
          name: 'Turma A',
          projectId: 'project-1',
          instrumentId: 'instrument-1',
          project: { id: 'project-1', name: 'Projeto' },
          instrument: { id: 'instrument-1', name: 'Violão' },
        },
      },
    ]);
    prismaMock.attendanceRecord.findMany.mockResolvedValue([
      { studentId: 'student-1', status: 'PRESENT', session: { classGroupId: 'class-1' } },
      { studentId: 'student-1', status: 'PRESENT', session: { classGroupId: 'class-1' } },
      { studentId: 'student-1', status: 'PRESENT', session: { classGroupId: 'class-1' } },
      { studentId: 'student-1', status: 'LATE', session: { classGroupId: 'class-1' } },
      { studentId: 'student-1', status: 'ABSENT', session: { classGroupId: 'class-1' } },
    ]);

    const res = await request(app)
      .get('/api/attendance/reports/student/student-1')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.data[0].totalSessions).toBe(5);
    expect(res.body.data[0].attendancePercentage).toBe(80);
  });
});

describe('Proteção de rotas', () => {
  it('retorna 401 sem cookie de sessão', async () => {
    const res = await request(app).get('/api/attendance/sessions');
    expect(res.status).toBe(401);
  });
});
