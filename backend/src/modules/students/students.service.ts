import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { buildPaginatedResult, normalizePagination } from '../../utils/pagination';
import { recordAuditLog } from '../../utils/auditLog';
import { CreateStudentInput, ListStudentsQuery, UpdateStudentInput } from './students.schema';

const studentInclude = {
  instrument: true,
  teacher: { select: { id: true, fullName: true, status: true } },
} satisfies Prisma.StudentInclude;

export async function listStudents(query: ListStudentsQuery) {
  const { page, pageSize, skip, take } = normalizePagination(query);

  const where: Prisma.StudentWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.instrumentId ? { instrumentId: query.instrumentId } : {}),
    ...(query.teacherId ? { teacherId: query.teacherId } : {}),
    ...(query.search
      ? {
          OR: [
            { fullName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search, mode: 'insensitive' } },
            { whatsapp: { contains: query.search, mode: 'insensitive' } },
            { instrument: { name: { contains: query.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: studentInclude,
      orderBy: { fullName: 'asc' },
      skip,
      take,
    }),
    prisma.student.count({ where }),
  ]);

  return buildPaginatedResult(items, total, page, pageSize);
}

export async function getStudentById(id: string) {
  const student = await prisma.student.findFirst({
    where: { id, deletedAt: null },
    include: studentInclude,
  });

  if (!student) {
    throw ApiError.notFound('Aluno não encontrado.');
  }

  return student;
}

async function assertTeacherExists(teacherId?: string) {
  if (!teacherId) return;
  const teacher = await prisma.teacher.findFirst({ where: { id: teacherId, deletedAt: null } });
  if (!teacher) {
    throw ApiError.badRequest('Professor responsável informado não existe.');
  }
}

export async function createStudent(input: CreateStudentInput, userId?: string) {
  await assertTeacherExists(input.teacherId);

  const student = await prisma.student.create({
    data: input,
    include: studentInclude,
  });

  await recordAuditLog({
    entityType: 'STUDENT',
    entityId: student.id,
    action: 'CREATE',
    userId,
    changes: { fullName: student.fullName },
  });

  return student;
}

export async function updateStudent(id: string, input: UpdateStudentInput, userId?: string) {
  const existing = await prisma.student.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    throw ApiError.notFound('Aluno não encontrado.');
  }

  await assertTeacherExists(input.teacherId);

  const student = await prisma.student.update({
    where: { id },
    data: input,
    include: studentInclude,
  });

  await recordAuditLog({
    entityType: 'STUDENT',
    entityId: student.id,
    action: 'UPDATE',
    userId,
    changes: input as Prisma.InputJsonValue,
  });

  return student;
}

export async function deleteStudent(id: string, userId?: string) {
  const existing = await prisma.student.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    throw ApiError.notFound('Aluno não encontrado.');
  }

  await prisma.student.update({ where: { id }, data: { deletedAt: new Date() } });

  await recordAuditLog({
    entityType: 'STUDENT',
    entityId: id,
    action: 'DELETE',
    userId,
  });
}
