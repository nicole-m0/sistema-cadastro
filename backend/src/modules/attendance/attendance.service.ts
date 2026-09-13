import { AttendanceStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { buildPaginatedResult, normalizePagination } from '../../utils/pagination';
import { recordAuditLog } from '../../utils/auditLog';
import { toCsv } from '../../utils/csv';
import {
  CreateAttendanceSessionInput,
  FrequencyQuery,
  ListSessionsQuery,
  UpdateAttendanceSessionInput,
} from './attendance.schema';

const sessionListInclude = {
  classGroup: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
  records: { select: { status: true } },
} satisfies Prisma.AttendanceSessionInclude;

const sessionDetailInclude = {
  classGroup: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
  records: {
    include: { student: { select: { id: true, fullName: true, photoUrl: true } } },
  },
} satisfies Prisma.AttendanceSessionInclude;

function summarizeRecords(records: { status: AttendanceStatus }[]) {
  return records.reduce(
    (acc, r) => {
      acc.total += 1;
      if (r.status === 'PRESENT') acc.present += 1;
      if (r.status === 'ABSENT') acc.absent += 1;
      if (r.status === 'JUSTIFIED') acc.justified += 1;
      if (r.status === 'LATE') acc.late += 1;
      return acc;
    },
    { total: 0, present: 0, absent: 0, justified: 0, late: 0 },
  );
}

function serializeSessionListItem(
  session: Prisma.AttendanceSessionGetPayload<{ include: typeof sessionListInclude }>,
) {
  const { records, ...rest } = session;
  return { ...rest, summary: summarizeRecords(records) };
}

export async function listAttendanceSessions(query: ListSessionsQuery) {
  const { page, pageSize, skip, take } = normalizePagination(query);

  const where: Prisma.AttendanceSessionWhereInput = {
    ...(query.classGroupId ? { classGroupId: query.classGroupId } : {}),
    ...(query.projectId ? { classGroup: { projectId: query.projectId } } : {}),
    ...(query.from || query.to
      ? {
          date: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.attendanceSession.findMany({
      where,
      include: sessionListInclude,
      orderBy: { date: 'desc' },
      skip,
      take,
    }),
    prisma.attendanceSession.count({ where }),
  ]);

  return buildPaginatedResult(items.map(serializeSessionListItem), total, page, pageSize);
}

export async function getAttendanceSessionById(id: string) {
  const session = await prisma.attendanceSession.findUnique({
    where: { id },
    include: sessionDetailInclude,
  });
  if (!session) {
    throw ApiError.notFound('Chamada não encontrada.');
  }
  return session;
}

function assertRosterMatches(expectedIds: Set<string>, actualIds: Set<string>) {
  const missing = [...expectedIds].filter((id) => !actualIds.has(id));
  const extra = [...actualIds].filter((id) => !expectedIds.has(id));
  if (missing.length > 0 || extra.length > 0) {
    throw ApiError.badRequest(
      'A lista de presença enviada não corresponde exatamente aos alunos esperados.',
      { missing, extra },
    );
  }
}

export async function createAttendanceSession(
  input: CreateAttendanceSessionInput,
  userId?: string,
) {
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: input.classGroupId, deletedAt: null },
  });
  if (!classGroup) {
    throw ApiError.badRequest('Turma informada não existe.');
  }

  const existingSession = await prisma.attendanceSession.findUnique({
    where: { classGroupId_date: { classGroupId: input.classGroupId, date: input.date } },
  });
  if (existingSession) {
    throw ApiError.conflict('Já existe uma chamada registrada para esta turma nesta data.');
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { classGroupId: input.classGroupId, removedAt: null },
  });
  assertRosterMatches(
    new Set(enrollments.map((e) => e.studentId)),
    new Set(input.records.map((r) => r.studentId)),
  );

  const session = await prisma.$transaction((tx) =>
    tx.attendanceSession.create({
      data: {
        classGroupId: input.classGroupId,
        date: input.date,
        generalNotes: input.generalNotes,
        createdById: userId,
        records: {
          create: input.records.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            note: r.note,
          })),
        },
      },
      include: sessionDetailInclude,
    }),
  );

  await recordAuditLog({
    entityType: 'ATTENDANCE_SESSION',
    entityId: session.id,
    action: 'CREATE',
    userId,
    changes: { classGroupId: input.classGroupId, date: input.date },
  });

  return session;
}

export async function updateAttendanceSession(
  id: string,
  input: UpdateAttendanceSessionInput,
  userId?: string,
) {
  const existing = await prisma.attendanceSession.findUnique({
    where: { id },
    include: { records: true },
  });
  if (!existing) {
    throw ApiError.notFound('Chamada não encontrada.');
  }

  assertRosterMatches(
    new Set(existing.records.map((r) => r.studentId)),
    new Set(input.records.map((r) => r.studentId)),
  );

  const session = await prisma.$transaction(async (tx) => {
    await tx.attendanceSession.update({
      where: { id },
      data: { generalNotes: input.generalNotes, updatedById: userId },
    });

    for (const record of input.records) {
      await tx.attendanceRecord.update({
        where: { sessionId_studentId: { sessionId: id, studentId: record.studentId } },
        data: { status: record.status, note: record.note },
      });
    }

    return tx.attendanceSession.findUniqueOrThrow({ where: { id }, include: sessionDetailInclude });
  });

  await recordAuditLog({
    entityType: 'ATTENDANCE_SESSION',
    entityId: id,
    action: 'UPDATE',
    userId,
    changes: { generalNotes: input.generalNotes },
  });

  return session;
}

interface FrequencyRow {
  studentId: string;
  studentName: string;
  classGroupId: string;
  classGroupName: string;
  projectId: string;
  projectName: string;
  instrumentId: string;
  instrumentName: string;
  totalSessions: number;
  present: number;
  absent: number;
  justified: number;
  late: number;
  attendancePercentage: number;
}

function computeStats(statuses: AttendanceStatus[]) {
  const totalSessions = statuses.length;
  const present = statuses.filter((s) => s === 'PRESENT').length;
  const absent = statuses.filter((s) => s === 'ABSENT').length;
  const justified = statuses.filter((s) => s === 'JUSTIFIED').length;
  const late = statuses.filter((s) => s === 'LATE').length;
  const attendancePercentage =
    totalSessions > 0 ? Math.round(((present + late) / totalSessions) * 100) : 0;
  return { totalSessions, present, absent, justified, late, attendancePercentage };
}

async function buildFrequencyRows(filters: {
  studentId?: string;
  classGroupId?: string;
  projectId?: string;
  instrumentId?: string;
  from?: Date;
  to?: Date;
}): Promise<FrequencyRow[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      classGroup: {
        deletedAt: null,
        ...(filters.classGroupId ? { id: filters.classGroupId } : {}),
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.instrumentId ? { instrumentId: filters.instrumentId } : {}),
      },
    },
    include: {
      student: { select: { id: true, fullName: true } },
      classGroup: {
        select: {
          id: true,
          name: true,
          projectId: true,
          instrumentId: true,
          project: { select: { id: true, name: true } },
          instrument: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (enrollments.length === 0) return [];

  const classGroupIds = [...new Set(enrollments.map((e) => e.classGroupId))];
  const studentIds = [...new Set(enrollments.map((e) => e.studentId))];

  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId: { in: studentIds },
      session: {
        classGroupId: { in: classGroupIds },
        ...(filters.from || filters.to
          ? {
              date: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
    },
    select: { studentId: true, status: true, session: { select: { classGroupId: true } } },
  });

  const grouped = new Map<string, AttendanceStatus[]>();
  for (const record of records) {
    const key = `${record.studentId}:${record.session.classGroupId}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(record.status);
  }

  return enrollments.map((e) => {
    const statuses = grouped.get(`${e.studentId}:${e.classGroupId}`) ?? [];
    return {
      studentId: e.studentId,
      studentName: e.student.fullName,
      classGroupId: e.classGroupId,
      classGroupName: e.classGroup.name,
      projectId: e.classGroup.projectId,
      projectName: e.classGroup.project.name,
      instrumentId: e.classGroup.instrumentId,
      instrumentName: e.classGroup.instrument.name,
      ...computeStats(statuses),
    };
  });
}

const frequencyCsvColumns: { key: keyof FrequencyRow; header: string }[] = [
  { key: 'studentName', header: 'Aluno' },
  { key: 'classGroupName', header: 'Turma' },
  { key: 'projectName', header: 'Projeto' },
  { key: 'instrumentName', header: 'Instrumento' },
  { key: 'totalSessions', header: 'Total de Aulas' },
  { key: 'present', header: 'Presenças' },
  { key: 'absent', header: 'Faltas' },
  { key: 'justified', header: 'Justificativas' },
  { key: 'late', header: 'Atrasos' },
  { key: 'attendancePercentage', header: '% Presença' },
];

export function frequencyRowsToCsv(rows: FrequencyRow[]) {
  return toCsv(rows, frequencyCsvColumns);
}

export async function getStudentFrequency(studentId: string, query: FrequencyQuery) {
  const student = await prisma.student.findFirst({ where: { id: studentId, deletedAt: null } });
  if (!student) {
    throw ApiError.notFound('Aluno não encontrado.');
  }
  return buildFrequencyRows({
    studentId,
    classGroupId: query.classGroupId,
    instrumentId: query.instrumentId,
    from: query.from,
    to: query.to,
  });
}

export async function getClassGroupFrequency(classGroupId: string, query: FrequencyQuery) {
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, deletedAt: null },
  });
  if (!classGroup) {
    throw ApiError.notFound('Turma não encontrada.');
  }
  return buildFrequencyRows({ classGroupId, from: query.from, to: query.to });
}

export async function getProjectFrequency(projectId: string, query: FrequencyQuery) {
  const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null } });
  if (!project) {
    throw ApiError.notFound('Projeto não encontrado.');
  }
  return buildFrequencyRows({
    projectId,
    instrumentId: query.instrumentId,
    from: query.from,
    to: query.to,
  });
}
