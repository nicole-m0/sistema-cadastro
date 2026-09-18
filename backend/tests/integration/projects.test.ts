import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const prismaMock = vi.hoisted(() => ({
  adminUser: { findUnique: vi.fn() },
  project: {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  instrument: { findMany: vi.fn() },
  projectInstrument: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
  classGroup: { count: vi.fn(), findMany: vi.fn() },
  enrollment: { count: vi.fn() },
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

const activeInstrument = { id: 'instrument-1', name: 'Violão', status: 'ACTIVE' };
const inactiveInstrument = { id: 'instrument-2', name: 'Baixo', status: 'INACTIVE' };

const baseProject = {
  id: 'project-1',
  name: 'Projeto Jovem Asafe',
  description: null,
  objective: null,
  location: null,
  responsible: null,
  notes: null,
  imageUrl: null,
  imagePublicId: null,
  status: 'ACTIVE',
  startDate: null,
  endDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  instruments: [],
  _count: { classGroups: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.adminUser.findUnique.mockResolvedValue({ updatedAt: new Date('2020-01-01T00:00:00.000Z') });
});

describe('GET /api/projects', () => {
  it('lista projetos paginados', async () => {
    prismaMock.project.findMany.mockResolvedValue([baseProject]);
    prismaMock.project.count.mockResolvedValue(1);

    const res = await request(app).get('/api/projects').set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });

  it('retorna 401 sem cookie de sessão', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/projects', () => {
  it('cria um projeto vinculando instrumentos ativos', async () => {
    prismaMock.instrument.findMany.mockResolvedValue([activeInstrument]);
    prismaMock.project.create.mockResolvedValue({
      ...baseProject,
      instruments: [{ instrument: activeInstrument }],
    });
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/projects')
      .set('Cookie', authCookie())
      .send({ name: 'Projeto Jovem Asafe', instrumentIds: ['instrument-1'] });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Projeto Jovem Asafe');
  });

  it('retorna 400 ao vincular instrumento inativo', async () => {
    prismaMock.instrument.findMany.mockResolvedValue([inactiveInstrument]);

    const res = await request(app)
      .post('/api/projects')
      .set('Cookie', authCookie())
      .send({ name: 'Projeto Jovem Asafe', instrumentIds: ['instrument-2'] });

    expect(res.status).toBe(400);
    expect(prismaMock.project.create).not.toHaveBeenCalled();
  });

  it('retorna 400 quando o nome não é enviado', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Cookie', authCookie())
      .send({ description: 'Sem nome' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/projects/:id/instruments', () => {
  it('vincula um instrumento ativo ao projeto', async () => {
    prismaMock.project.findFirst.mockResolvedValue(baseProject);
    prismaMock.instrument.findMany.mockResolvedValue([activeInstrument]);
    prismaMock.projectInstrument.findUnique.mockResolvedValue(null);
    prismaMock.projectInstrument.create.mockResolvedValue({});
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/projects/project-1/instruments')
      .set('Cookie', authCookie())
      .send({ instrumentId: 'instrument-1' });

    expect(res.status).toBe(201);
  });

  it('retorna 409 ao vincular instrumento já vinculado', async () => {
    prismaMock.project.findFirst.mockResolvedValue(baseProject);
    prismaMock.instrument.findMany.mockResolvedValue([activeInstrument]);
    prismaMock.projectInstrument.findUnique.mockResolvedValue({
      projectId: 'project-1',
      instrumentId: 'instrument-1',
    });

    const res = await request(app)
      .post('/api/projects/project-1/instruments')
      .set('Cookie', authCookie())
      .send({ instrumentId: 'instrument-1' });

    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/projects/:id/instruments/:instrumentId', () => {
  it('bloqueia remoção quando há turma dependente', async () => {
    prismaMock.project.findFirst.mockResolvedValue(baseProject);
    prismaMock.projectInstrument.findUnique.mockResolvedValue({
      projectId: 'project-1',
      instrumentId: 'instrument-1',
    });
    prismaMock.classGroup.count.mockResolvedValue(1);

    const res = await request(app)
      .delete('/api/projects/project-1/instruments/instrument-1')
      .set('Cookie', authCookie());

    expect(res.status).toBe(409);
    expect(prismaMock.projectInstrument.delete).not.toHaveBeenCalled();
  });

  it('remove o instrumento do projeto sem turmas dependentes', async () => {
    prismaMock.project.findFirst.mockResolvedValue(baseProject);
    prismaMock.projectInstrument.findUnique.mockResolvedValue({
      projectId: 'project-1',
      instrumentId: 'instrument-1',
    });
    prismaMock.classGroup.count.mockResolvedValue(0);
    prismaMock.projectInstrument.delete.mockResolvedValue({});
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .delete('/api/projects/project-1/instruments/instrument-1')
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/projects/:id', () => {
  it('exclui (soft delete) um projeto existente', async () => {
    prismaMock.project.findFirst.mockResolvedValue(baseProject);
    prismaMock.project.update.mockResolvedValue({ ...baseProject, deletedAt: new Date() });
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app).delete('/api/projects/project-1').set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(prismaMock.project.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'project-1' } }),
    );
  });
});
