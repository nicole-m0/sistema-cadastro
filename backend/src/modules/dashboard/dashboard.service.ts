import { Weekday } from '@prisma/client';
import { prisma } from '../../config/prisma';

const WEEKDAYS: Weekday[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

const LOW_ATTENDANCE_WINDOW_DAYS = 90;
const LOW_ATTENDANCE_THRESHOLD = 75;
const LOW_ATTENDANCE_MIN_SESSIONS = 3;

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

async function getLowAttendanceStudents() {
  const since = new Date();
  since.setDate(since.getDate() - LOW_ATTENDANCE_WINDOW_DAYS);

  const records = await prisma.attendanceRecord.findMany({
    where: { session: { date: { gte: since } } },
    select: { studentId: true, status: true, student: { select: { fullName: true } } },
  });

  const byStudent = new Map<string, { fullName: string; statuses: string[] }>();
  for (const record of records) {
    if (!byStudent.has(record.studentId)) {
      byStudent.set(record.studentId, { fullName: record.student.fullName, statuses: [] });
    }
    byStudent.get(record.studentId)!.statuses.push(record.status);
  }

  const results = [...byStudent.entries()]
    .map(([studentId, { fullName, statuses }]) => {
      const total = statuses.length;
      const present = statuses.filter((s) => s === 'PRESENT' || s === 'LATE').length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return { studentId, fullName, totalSessions: total, attendancePercentage: percentage };
    })
    .filter(
      (r) => r.totalSessions >= LOW_ATTENDANCE_MIN_SESSIONS && r.attendancePercentage < LOW_ATTENDANCE_THRESHOLD,
    )
    .sort((a, b) => a.attendancePercentage - b.attendancePercentage)
    .slice(0, 5);

  return results;
}

async function getPendingAttendance() {
  const today = startOfToday();
  const weekday = WEEKDAYS[today.getDay()];

  return prisma.classGroup.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      weekday,
      attendanceSessions: { none: { date: today } },
    },
    select: {
      id: true,
      name: true,
      project: { select: { id: true, name: true } },
    },
    take: 10,
  });
}

export async function getDashboardSummary() {
  const [
    totalStudents,
    activeStudents,
    totalTeachers,
    activeTeachers,
    recentStudents,
    recentTeachers,
    activeInstruments,
    activeProjects,
    activeClassGroups,
    enrolledStudents,
    teachersInClasses,
    recentAttendanceSessions,
    pendingAttendance,
    lowAttendanceStudents,
  ] = await Promise.all([
    prisma.student.count({ where: { deletedAt: null } }),
    prisma.student.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    prisma.teacher.count({ where: { deletedAt: null } }),
    prisma.teacher.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    prisma.student.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, fullName: true, status: true, createdAt: true, photoUrl: true },
    }),
    prisma.teacher.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, fullName: true, status: true, createdAt: true, photoUrl: true },
    }),
    prisma.instrument.count({ where: { status: 'ACTIVE' } }),
    prisma.project.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    prisma.classGroup.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    prisma.student.count({ where: { deletedAt: null, enrollments: { some: { removedAt: null } } } }),
    prisma.teacher.count({
      where: { deletedAt: null, classGroups: { some: { classGroup: { deletedAt: null } } } },
    }),
    prisma.attendanceSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        date: true,
        classGroup: { select: { id: true, name: true } },
        createdAt: true,
      },
    }),
    getPendingAttendance(),
    getLowAttendanceStudents(),
  ]);

  return {
    totals: {
      students: totalStudents,
      activeStudents,
      teachers: totalTeachers,
      activeTeachers,
      activeInstruments,
      activeProjects,
      activeClassGroups,
      enrolledStudents,
      teachersInClasses,
    },
    recent: {
      students: recentStudents,
      teachers: recentTeachers,
      attendanceSessions: recentAttendanceSessions,
    },
    pendingAttendance,
    lowAttendanceStudents,
  };
}
