import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { buildPaginatedResult, normalizePagination } from '../../utils/pagination';
import { recordAuditLog } from '../../utils/auditLog';
import { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from './projects.schema';

const projectInclude = {
  instruments: { include: { instrument: true } },
  _count: { select: { classGroups: { where: { deletedAt: null } } } },
} satisfies Prisma.ProjectInclude;

function serializeProject(project: Prisma.ProjectGetPayload<{ include: typeof projectInclude }>) {
  const { instruments, _count, ...rest } = project;
  return {
    ...rest,
    instruments: instruments.map((link) => link.instrument),
    classGroupsCount: _count.classGroups,
  };
}

async function assertInstrumentsAreActive(instrumentIds: string[]) {
  if (instrumentIds.length === 0) return;
  const instruments = await prisma.instrument.findMany({ where: { id: { in: instrumentIds } } });

  const foundIds = new Set(instruments.map((i) => i.id));
  const missing = instrumentIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw ApiError.badRequest('Um ou mais instrumentos informados não existem.', { missing });
  }

  const inactive = instruments.filter((i) => i.status !== 'ACTIVE').map((i) => i.name);
  if (inactive.length > 0) {
    throw ApiError.badRequest(
      `Somente instrumentos ativos podem ser vinculados a um projeto: ${inactive.join(', ')}.`,
    );
  }
}

export async function listProjects(query: ListProjectsQuery) {
  const { page, pageSize, skip, take } = normalizePagination(query);

  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { location: { contains: query.search, mode: 'insensitive' } },
            { responsible: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.project.count({ where }),
  ]);

  return buildPaginatedResult(items.map(serializeProject), total, page, pageSize);
}

export async function getProjectById(id: string) {
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: projectInclude,
  });

  if (!project) {
    throw ApiError.notFound('Projeto não encontrado.');
  }

  const classGroups = await prisma.classGroup.findMany({
    where: { projectId: id, deletedAt: null },
    include: {
      instrument: true,
      teachers: { include: { teacher: { select: { id: true, fullName: true, status: true } } } },
      _count: { select: { enrollments: { where: { removedAt: null } } } },
    },
    orderBy: { name: 'asc' },
  });

  const studentsCount = await prisma.enrollment.count({
    where: { removedAt: null, classGroup: { projectId: id } },
  });

  return {
    ...serializeProject(project),
    classGroups: classGroups.map((cg) => {
      const { _count, teachers, ...rest } = cg;
      return {
        ...rest,
        studentsCount: _count.enrollments,
        teachers: teachers.map((t) => ({ ...t.teacher, role: t.role })),
      };
    }),
    summary: {
      classGroupsCount: classGroups.length,
      studentsCount,
      teachersCount: new Set(
        classGroups.flatMap((cg) => cg.teachers.map((t) => t.teacherId)),
      ).size,
    },
  };
}

export async function createProject(input: CreateProjectInput, userId?: string) {
  const { instrumentIds, ...data } = input;
  await assertInstrumentsAreActive(instrumentIds);

  const project = await prisma.project.create({
    data: {
      ...data,
      instruments: {
        create: instrumentIds.map((instrumentId) => ({ instrumentId })),
      },
    },
    include: projectInclude,
  });

  await recordAuditLog({
    entityType: 'PROJECT',
    entityId: project.id,
    action: 'CREATE',
    userId,
    changes: { name: project.name },
  });

  return serializeProject(project);
}

export async function updateProject(id: string, input: UpdateProjectInput, userId?: string) {
  const existing = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: { instruments: true },
  });
  if (!existing) {
    throw ApiError.notFound('Projeto não encontrado.');
  }

  const { instrumentIds, ...data } = input;

  if (instrumentIds) {
    await assertInstrumentsAreActive(instrumentIds);

    const currentIds = existing.instruments.map((i) => i.instrumentId);
    const toRemove = currentIds.filter((instrumentId) => !instrumentIds.includes(instrumentId));

    if (toRemove.length > 0) {
      const dependentClassGroups = await prisma.classGroup.count({
        where: { projectId: id, instrumentId: { in: toRemove }, deletedAt: null },
      });
      if (dependentClassGroups > 0) {
        throw ApiError.conflict(
          'Não é possível remover instrumentos do projeto pois existem turmas vinculadas a eles. Encerre ou mova as turmas antes.',
        );
      }
    }
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...data,
      ...(instrumentIds
        ? {
            instruments: {
              deleteMany: {},
              create: instrumentIds.map((instrumentId) => ({ instrumentId })),
            },
          }
        : {}),
    },
    include: projectInclude,
  });

  await recordAuditLog({
    entityType: 'PROJECT',
    entityId: project.id,
    action: 'UPDATE',
    userId,
    changes: data as Prisma.InputJsonValue,
  });

  return serializeProject(project);
}

export async function deleteProject(id: string, userId?: string) {
  const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    throw ApiError.notFound('Projeto não encontrado.');
  }

  await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });

  await recordAuditLog({
    entityType: 'PROJECT',
    entityId: id,
    action: 'DELETE',
    userId,
  });
}

export async function linkProjectInstrument(projectId: string, instrumentId: string, userId?: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null } });
  if (!project) {
    throw ApiError.notFound('Projeto não encontrado.');
  }

  await assertInstrumentsAreActive([instrumentId]);

  const existingLink = await prisma.projectInstrument.findUnique({
    where: { projectId_instrumentId: { projectId, instrumentId } },
  });
  if (existingLink) {
    throw ApiError.conflict('Este instrumento já está vinculado ao projeto.');
  }

  await prisma.projectInstrument.create({ data: { projectId, instrumentId } });

  await recordAuditLog({
    entityType: 'PROJECT',
    entityId: projectId,
    action: 'UPDATE',
    userId,
    changes: { linkedInstrumentId: instrumentId },
  });
}

export async function unlinkProjectInstrument(
  projectId: string,
  instrumentId: string,
  userId?: string,
) {
  const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null } });
  if (!project) {
    throw ApiError.notFound('Projeto não encontrado.');
  }

  const existingLink = await prisma.projectInstrument.findUnique({
    where: { projectId_instrumentId: { projectId, instrumentId } },
  });
  if (!existingLink) {
    throw ApiError.notFound('Este instrumento não está vinculado ao projeto.');
  }

  const dependentClassGroups = await prisma.classGroup.count({
    where: { projectId, instrumentId, deletedAt: null },
  });
  if (dependentClassGroups > 0) {
    throw ApiError.conflict(
      'Não é possível remover o instrumento do projeto pois há turmas vinculadas a ele.',
    );
  }

  await prisma.projectInstrument.delete({
    where: { projectId_instrumentId: { projectId, instrumentId } },
  });

  await recordAuditLog({
    entityType: 'PROJECT',
    entityId: projectId,
    action: 'UPDATE',
    userId,
    changes: { unlinkedInstrumentId: instrumentId },
  });
}
