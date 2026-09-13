import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { buildPaginatedResult, normalizePagination } from '../../utils/pagination';
import { recordAuditLog } from '../../utils/auditLog';
import {
  CreateClassGroupInput,
  EnrollStudentInput,
  LinkTeacherInput,
  ListClassGroupsQuery,
  UpdateClassGroupInput,
} from './class-groups.schema';

const classGroupInclude = {
  project: { select: { id: true, name: true, status: true } },
  instrument: true,
  teachers: { include: { teacher: { select: { id: true, fullName: true, status: true } } } },
  _count: { select: { enrollments: { where: { removedAt: null } } } },
} satisfies Prisma.ClassGroupInclude;

function serializeClassGroup(
  classGroup: Prisma.ClassGroupGetPayload<{ include: typeof classGroupInclude }>,
) {
  const { teachers, _count, ...rest } = classGroup;
  return {
    ...rest,
    teachers: teachers.map((t) => ({ ...t.teacher, role: t.role })),
    studentsCount: _count.enrollments,
  };
}

async function assertProjectExists(projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null } });
  if (!project) {
    throw ApiError.badRequest('Projeto informado não existe.');
  }
  return project;
}

async function assertInstrumentInProject(projectId: string, instrumentId: string) {
  const link = await prisma.projectInstrument.findUnique({
    where: { projectId_instrumentId: { projectId, instrumentId } },
  });
  if (!link) {
    throw ApiError.badRequest('O instrumento selecionado não está vinculado a este projeto.');
  }
}

async function assertTeachersExist(teacherIds: string[]) {
  if (teacherIds.length === 0) return;
  const teachers = await prisma.teacher.findMany({
    where: { id: { in: teacherIds }, deletedAt: null },
  });
  const foundIds = new Set(teachers.map((t) => t.id));
  const missing = teacherIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw ApiError.badRequest('Um ou mais professores informados não existem.', { missing });
  }
}

export async function listClassGroups(query: ListClassGroupsQuery) {
  const { page, pageSize, skip, take } = normalizePagination(query);

  const where: Prisma.ClassGroupWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.instrumentId ? { instrumentId: query.instrumentId } : {}),
    ...(query.teacherId ? { teachers: { some: { teacherId: query.teacherId } } } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { room: { contains: query.search, mode: 'insensitive' } },
            { project: { name: { contains: query.search, mode: 'insensitive' } } },
            { instrument: { name: { contains: query.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.classGroup.findMany({
      where,
      include: classGroupInclude,
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.classGroup.count({ where }),
  ]);

  return buildPaginatedResult(items.map(serializeClassGroup), total, page, pageSize);
}

export async function getClassGroupById(id: string) {
  const classGroup = await prisma.classGroup.findFirst({
    where: { id, deletedAt: null },
    include: classGroupInclude,
  });

  if (!classGroup) {
    throw ApiError.notFound('Turma não encontrada.');
  }

  return serializeClassGroup(classGroup);
}

export async function createClassGroup(input: CreateClassGroupInput, userId?: string) {
  const { responsibleTeacherId, assistantTeacherIds, ...data } = input;

  await assertProjectExists(data.projectId);
  await assertInstrumentInProject(data.projectId, data.instrumentId);

  const uniqueAssistantIds = [...new Set(assistantTeacherIds)].filter(
    (id) => id !== responsibleTeacherId,
  );
  await assertTeachersExist([responsibleTeacherId, ...uniqueAssistantIds]);

  const classGroup = await prisma.$transaction(async (tx) => {
    const created = await tx.classGroup.create({
      data: {
        ...data,
        teachers: {
          create: [
            { teacherId: responsibleTeacherId, role: 'RESPONSIBLE' },
            ...uniqueAssistantIds.map((teacherId) => ({ teacherId, role: 'ASSISTANT' as const })),
          ],
        },
      },
      include: classGroupInclude,
    });
    return created;
  });

  await recordAuditLog({
    entityType: 'CLASS_GROUP',
    entityId: classGroup.id,
    action: 'CREATE',
    userId,
    changes: { name: classGroup.name },
  });

  return serializeClassGroup(classGroup);
}

export async function updateClassGroup(id: string, input: UpdateClassGroupInput, userId?: string) {
  const existing = await prisma.classGroup.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    throw ApiError.notFound('Turma não encontrada.');
  }

  const { responsibleTeacherId, assistantTeacherIds, ...data } = input;

  const projectId = data.projectId ?? existing.projectId;
  const instrumentId = data.instrumentId ?? existing.instrumentId;
  if (data.projectId || data.instrumentId) {
    await assertProjectExists(projectId);
    await assertInstrumentInProject(projectId, instrumentId);
  }

  const shouldReplaceTeachers = responsibleTeacherId !== undefined || assistantTeacherIds !== undefined;
  let teacherWrites: Prisma.ClassGroupUpdateInput['teachers'];

  if (shouldReplaceTeachers) {
    const finalResponsibleId = responsibleTeacherId;
    if (!finalResponsibleId) {
      throw ApiError.badRequest('É necessário informar o professor responsável da turma.');
    }
    const uniqueAssistantIds = [...new Set(assistantTeacherIds ?? [])].filter(
      (teacherId) => teacherId !== finalResponsibleId,
    );
    await assertTeachersExist([finalResponsibleId, ...uniqueAssistantIds]);

    teacherWrites = {
      deleteMany: {},
      create: [
        { teacherId: finalResponsibleId, role: 'RESPONSIBLE' },
        ...uniqueAssistantIds.map((teacherId) => ({ teacherId, role: 'ASSISTANT' as const })),
      ],
    };
  }

  const classGroup = await prisma.classGroup.update({
    where: { id },
    data: {
      ...data,
      ...(teacherWrites ? { teachers: teacherWrites } : {}),
    },
    include: classGroupInclude,
  });

  await recordAuditLog({
    entityType: 'CLASS_GROUP',
    entityId: classGroup.id,
    action: 'UPDATE',
    userId,
    changes: data as Prisma.InputJsonValue,
  });

  return serializeClassGroup(classGroup);
}

export async function deleteClassGroup(id: string, userId?: string) {
  const existing = await prisma.classGroup.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    throw ApiError.notFound('Turma não encontrada.');
  }

  await prisma.classGroup.update({ where: { id }, data: { deletedAt: new Date() } });

  await recordAuditLog({
    entityType: 'CLASS_GROUP',
    entityId: id,
    action: 'DELETE',
    userId,
  });
}

async function assertClassGroupExists(classGroupId: string) {
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, deletedAt: null },
  });
  if (!classGroup) {
    throw ApiError.notFound('Turma não encontrada.');
  }
  return classGroup;
}

export async function listEnrollments(classGroupId: string, includeRemoved?: boolean) {
  await assertClassGroupExists(classGroupId);

  return prisma.enrollment.findMany({
    where: { classGroupId, ...(includeRemoved ? {} : { removedAt: null }) },
    include: {
      student: { select: { id: true, fullName: true, status: true, photoUrl: true } },
    },
    orderBy: { enrolledAt: 'asc' },
  });
}

export async function enrollStudent(
  classGroupId: string,
  input: EnrollStudentInput,
  userId?: string,
) {
  await assertClassGroupExists(classGroupId);

  const student = await prisma.student.findFirst({
    where: { id: input.studentId, deletedAt: null },
  });
  if (!student) {
    throw ApiError.badRequest('Aluno informado não existe.');
  }

  const existing = await prisma.enrollment.findUnique({
    where: { classGroupId_studentId: { classGroupId, studentId: input.studentId } },
  });

  let enrollment;
  if (existing) {
    if (existing.removedAt === null) {
      throw ApiError.conflict('Aluno já matriculado nesta turma.');
    }
    enrollment = await prisma.enrollment.update({
      where: { id: existing.id },
      data: { removedAt: null, enrolledAt: new Date() },
    });
  } else {
    enrollment = await prisma.enrollment.create({
      data: { classGroupId, studentId: input.studentId },
    });
  }

  await recordAuditLog({
    entityType: 'ENROLLMENT',
    entityId: enrollment.id,
    action: 'CREATE',
    userId,
    changes: { classGroupId, studentId: input.studentId },
  });

  return enrollment;
}

export async function removeEnrollment(classGroupId: string, studentId: string, userId?: string) {
  await assertClassGroupExists(classGroupId);

  const enrollment = await prisma.enrollment.findUnique({
    where: { classGroupId_studentId: { classGroupId, studentId } },
  });
  if (!enrollment || enrollment.removedAt !== null) {
    throw ApiError.notFound('Matrícula não encontrada.');
  }

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { removedAt: new Date() },
  });

  await recordAuditLog({
    entityType: 'ENROLLMENT',
    entityId: enrollment.id,
    action: 'DELETE',
    userId,
    changes: { classGroupId, studentId },
  });
}

export async function linkTeacher(classGroupId: string, input: LinkTeacherInput, userId?: string) {
  await assertClassGroupExists(classGroupId);
  await assertTeachersExist([input.teacherId]);

  const existing = await prisma.classTeacher.findUnique({
    where: { classGroupId_teacherId: { classGroupId, teacherId: input.teacherId } },
  });
  if (existing) {
    throw ApiError.conflict(
      existing.role === input.role
        ? 'Professor já vinculado com este papel nesta turma.'
        : 'Professor já vinculado a esta turma com outro papel; remova o vínculo atual antes.',
    );
  }

  if (input.role === 'RESPONSIBLE') {
    await prisma.$transaction([
      prisma.classTeacher.deleteMany({ where: { classGroupId, role: 'RESPONSIBLE' } }),
      prisma.classTeacher.create({
        data: { classGroupId, teacherId: input.teacherId, role: 'RESPONSIBLE' },
      }),
    ]);
  } else {
    await prisma.classTeacher.create({
      data: { classGroupId, teacherId: input.teacherId, role: 'ASSISTANT' },
    });
  }

  await recordAuditLog({
    entityType: 'CLASS_TEACHER',
    entityId: classGroupId,
    action: 'CREATE',
    userId,
    changes: { teacherId: input.teacherId, role: input.role },
  });
}

export async function unlinkTeacher(classGroupId: string, teacherId: string, userId?: string) {
  await assertClassGroupExists(classGroupId);

  const link = await prisma.classTeacher.findUnique({
    where: { classGroupId_teacherId: { classGroupId, teacherId } },
  });
  if (!link) {
    throw ApiError.notFound('Vínculo entre professor e turma não encontrado.');
  }

  if (link.role === 'RESPONSIBLE') {
    throw ApiError.badRequest(
      'Não é possível remover o professor responsável sem definir outro antes. Defina um novo responsável primeiro.',
    );
  }

  await prisma.classTeacher.delete({
    where: { classGroupId_teacherId: { classGroupId, teacherId } },
  });

  await recordAuditLog({
    entityType: 'CLASS_TEACHER',
    entityId: classGroupId,
    action: 'DELETE',
    userId,
    changes: { teacherId },
  });
}
