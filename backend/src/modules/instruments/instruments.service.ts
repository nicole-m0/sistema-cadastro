import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { buildPaginatedResult, normalizePagination } from '../../utils/pagination';
import { recordAuditLog } from '../../utils/auditLog';
import {
  CreateInstrumentInput,
  ListInstrumentsQuery,
  UpdateInstrumentInput,
} from './instruments.schema';

export async function listInstruments(query: ListInstrumentsQuery) {
  const { page, pageSize, skip, take } = normalizePagination(query);

  const where: Prisma.InstrumentWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.instrument.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      skip,
      take,
    }),
    prisma.instrument.count({ where }),
  ]);

  return buildPaginatedResult(items, total, page, pageSize);
}

async function getUsage(instrumentId: string) {
  const [studentsCount, teachersCount, projectLinks, classGroups] = await Promise.all([
    prisma.student.count({ where: { instrumentId } }),
    prisma.teacherInstrument.count({ where: { instrumentId } }),
    prisma.projectInstrument.findMany({
      where: { instrumentId },
      include: { project: { select: { id: true, name: true, status: true } } },
    }),
    prisma.classGroup.findMany({
      where: { instrumentId, deletedAt: null },
      select: {
        id: true,
        name: true,
        status: true,
        project: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    studentsCount,
    teachersCount,
    projects: projectLinks.map((link) => link.project),
    classGroups,
  };
}

export async function getInstrumentById(id: string) {
  const instrument = await prisma.instrument.findUnique({ where: { id } });
  if (!instrument) {
    throw ApiError.notFound('Instrumento não encontrado.');
  }

  const usage = await getUsage(id);

  return { ...instrument, usage };
}

export async function createInstrument(input: CreateInstrumentInput, userId?: string) {
  const instrument = await prisma.instrument.create({ data: input });

  await recordAuditLog({
    entityType: 'INSTRUMENT',
    entityId: instrument.id,
    action: 'CREATE',
    userId,
    changes: { name: instrument.name },
  });

  return instrument;
}

export async function updateInstrument(id: string, input: UpdateInstrumentInput, userId?: string) {
  const existing = await prisma.instrument.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Instrumento não encontrado.');
  }

  const instrument = await prisma.instrument.update({ where: { id }, data: input });

  await recordAuditLog({
    entityType: 'INSTRUMENT',
    entityId: instrument.id,
    action: 'UPDATE',
    userId,
    changes: input as Prisma.InputJsonValue,
  });

  return instrument;
}

export async function deleteInstrument(id: string, userId?: string) {
  const existing = await prisma.instrument.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Instrumento não encontrado.');
  }

  const [studentsCount, teachersCount, projectsCount, classGroupsCount] = await Promise.all([
    prisma.student.count({ where: { instrumentId: id } }),
    prisma.teacherInstrument.count({ where: { instrumentId: id } }),
    prisma.projectInstrument.count({ where: { instrumentId: id } }),
    prisma.classGroup.count({ where: { instrumentId: id } }),
  ]);

  if (studentsCount + teachersCount + projectsCount + classGroupsCount > 0) {
    throw ApiError.conflict(
      'Não é possível excluir o instrumento pois há vínculos com alunos, professores, projetos ou turmas. Desative-o em vez de excluir.',
      { studentsCount, teachersCount, projectsCount, classGroupsCount },
    );
  }

  await prisma.instrument.delete({ where: { id } });

  await recordAuditLog({
    entityType: 'INSTRUMENT',
    entityId: id,
    action: 'DELETE',
    userId,
  });
}
