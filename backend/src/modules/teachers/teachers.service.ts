import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { buildPaginatedResult, normalizePagination } from '../../utils/pagination';
import { recordAuditLog } from '../../utils/auditLog';
import { CreateTeacherInput, ListTeachersQuery, UpdateTeacherInput } from './teachers.schema';

const teacherInclude = {
  instruments: { include: { instrument: true } },
  _count: { select: { students: { where: { deletedAt: null } } } },
} satisfies Prisma.TeacherInclude;

function serializeTeacher(teacher: Prisma.TeacherGetPayload<{ include: typeof teacherInclude }>) {
  const { instruments, _count, ...rest } = teacher;
  return {
    ...rest,
    instruments: instruments.map((i) => i.instrument),
    studentsCount: _count.students,
  };
}

export async function listTeachers(query: ListTeachersQuery) {
  const { page, pageSize, skip, take } = normalizePagination(query);

  const where: Prisma.TeacherWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.instrumentId
      ? { instruments: { some: { instrumentId: query.instrumentId } } }
      : {}),
    ...(query.search
      ? {
          OR: [
            { fullName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search, mode: 'insensitive' } },
            { specialty: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      include: teacherInclude,
      orderBy: { fullName: 'asc' },
      skip,
      take,
    }),
    prisma.teacher.count({ where }),
  ]);

  return buildPaginatedResult(items.map(serializeTeacher), total, page, pageSize);
}

export async function getTeacherById(id: string) {
  const teacher = await prisma.teacher.findFirst({
    where: { id, deletedAt: null },
    include: teacherInclude,
  });

  if (!teacher) {
    throw ApiError.notFound('Professor não encontrado.');
  }

  return serializeTeacher(teacher);
}

export async function createTeacher(input: CreateTeacherInput, userId?: string) {
  const { instrumentIds, ...data } = input;

  const teacher = await prisma.teacher.create({
    data: {
      ...data,
      instruments: {
        create: instrumentIds.map((instrumentId) => ({ instrumentId })),
      },
    },
    include: teacherInclude,
  });

  await recordAuditLog({
    entityType: 'TEACHER',
    entityId: teacher.id,
    action: 'CREATE',
    userId,
    changes: { fullName: teacher.fullName },
  });

  return serializeTeacher(teacher);
}

export async function updateTeacher(id: string, input: UpdateTeacherInput, userId?: string) {
  const existing = await prisma.teacher.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    throw ApiError.notFound('Professor não encontrado.');
  }

  const { instrumentIds, ...data } = input;

  const teacher = await prisma.teacher.update({
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
    include: teacherInclude,
  });

  await recordAuditLog({
    entityType: 'TEACHER',
    entityId: teacher.id,
    action: 'UPDATE',
    userId,
    changes: data as Prisma.InputJsonValue,
  });

  return serializeTeacher(teacher);
}

export async function deleteTeacher(id: string, userId?: string) {
  const existing = await prisma.teacher.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    throw ApiError.notFound('Professor não encontrado.');
  }

  await prisma.teacher.update({ where: { id }, data: { deletedAt: new Date() } });

  await recordAuditLog({
    entityType: 'TEACHER',
    entityId: id,
    action: 'DELETE',
    userId,
  });
}
