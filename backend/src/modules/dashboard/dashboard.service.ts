import { prisma } from '../../config/prisma';

export async function getDashboardSummary() {
  const [
    totalStudents,
    activeStudents,
    totalTeachers,
    activeTeachers,
    recentStudents,
    recentTeachers,
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
  ]);

  return {
    totals: {
      students: totalStudents,
      activeStudents,
      teachers: totalTeachers,
      activeTeachers,
    },
    recent: {
      students: recentStudents,
      teachers: recentTeachers,
    },
  };
}
