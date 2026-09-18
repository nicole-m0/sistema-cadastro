import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const prismaMock = vi.hoisted(() => ({
  adminUser: { findUnique: vi.fn() },
  student: { count: vi.fn(), findMany: vi.fn() },
  teacher: { count: vi.fn(), findMany: vi.fn() },
  instrument: { count: vi.fn() },
  project: { count: vi.fn() },
  classGroup: { count: vi.fn(), findMany: vi.fn() },
  attendanceSession: { findMany: vi.fn() },
  attendanceRecord: { findMany: vi.fn() },
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
  prismaMock.student.count.mockResolvedValue(0);
  prismaMock.teacher.count.mockResolvedValue(0);
  prismaMock.instrument.count.mockResolvedValue(0);
  prismaMock.project.count.mockResolvedValue(0);
  prismaMock.classGroup.count.mockResolvedValue(0);
  prismaMock.student.findMany.mockResolvedValue([]);
  prismaMock.teacher.findMany.mockResolvedValue([]);
  prismaMock.classGroup.findMany.mockResolvedValue([]);
  prismaMock.attendanceSession.findMany.mockResolvedValue([]);
  prismaMock.attendanceRecord.findMany.mockResolvedValue([]);
});

describe('GET /api/dashboard', () => {
  it('retorna 401 sem cookie de sessão', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  it('retorna o resumo com os novos campos de turmas e chamadas', async () => {
    prismaMock.instrument.count.mockResolvedValue(5);
    prismaMock.project.count.mockResolvedValue(2);
    prismaMock.classGroup.count.mockResolvedValue(3);
    prismaMock.classGroup.findMany.mockResolvedValue([
      { id: 'class-1', name: 'Turma A', project: { id: 'project-1', name: 'Projeto' } },
    ]);

    const res = await request(app).get('/api/dashboard').set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.data.totals.activeInstruments).toBe(5);
    expect(res.body.data.totals.activeProjects).toBe(2);
    expect(res.body.data.totals.activeClassGroups).toBe(3);
    expect(res.body.data.pendingAttendance).toHaveLength(1);
    expect(res.body.data.lowAttendanceStudents).toEqual([]);
    expect(res.body.data.recent.attendanceSessions).toEqual([]);
  });

  it('identifica alunos com baixa frequência', async () => {
    prismaMock.attendanceRecord.findMany.mockResolvedValue([
      { studentId: 's1', status: 'ABSENT', student: { fullName: 'Aluno Faltoso' } },
      { studentId: 's1', status: 'ABSENT', student: { fullName: 'Aluno Faltoso' } },
      { studentId: 's1', status: 'ABSENT', student: { fullName: 'Aluno Faltoso' } },
      { studentId: 's1', status: 'PRESENT', student: { fullName: 'Aluno Faltoso' } },
    ]);

    const res = await request(app).get('/api/dashboard').set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.data.lowAttendanceStudents).toHaveLength(1);
    expect(res.body.data.lowAttendanceStudents[0].attendancePercentage).toBe(25);
  });
});
