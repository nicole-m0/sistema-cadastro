import {
  PrismaClient,
  MusicLevel,
  StudentStatus,
  TeacherStatus,
  InstrumentStatus,
  ProjectStatus,
  Weekday,
  ClassGroupStatus,
  ClassTeacherRole,
  AttendanceStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_ADMIN_PASSWORD = 'TrocarEssaSenha123!';

function assertPasswordSafeForProduction(password: string) {
  if (process.env.NODE_ENV !== 'production') return;

  if (password === DEFAULT_ADMIN_PASSWORD) {
    throw new Error(
      'ADMIN_PASSWORD não pode usar o valor padrão de exemplo em produção. Defina uma senha forte em ADMIN_PASSWORD antes de rodar o seed.',
    );
  }

  const complexityIssue = [
    [password.length < 8, 'ao menos 8 caracteres'],
    [!/[a-z]/.test(password), 'uma letra minúscula'],
    [!/[A-Z]/.test(password), 'uma letra maiúscula'],
    [!/[0-9]/.test(password), 'um número'],
  ].find(([failed]) => failed) as [boolean, string] | undefined;

  if (complexityIssue) {
    throw new Error(`ADMIN_PASSWORD em produção deve conter ${complexityIssue[1]}.`);
  }
}

async function seedAdmin() {
  const name = process.env.ADMIN_NAME ?? 'Administrador Asafe';
  const email = process.env.ADMIN_EMAIL ?? 'admin@asafe.org';
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;

  assertPasswordSafeForProduction(password);

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { name, email, passwordHash },
  });

  console.log(`Administrador pronto: ${admin.email}`);
  return admin;
}

async function seedInstruments() {
  const items = [
    { name: 'Violão', description: 'Violão popular e clássico.' },
    { name: 'Guitarra', description: 'Guitarra elétrica, base e solo.' },
    { name: 'Piano/Teclado', description: 'Piano acústico e teclado eletrônico.' },
    { name: 'Bateria', description: 'Bateria acústica e percussão.' },
    { name: 'Canto', description: 'Técnica vocal e canto coral.' },
    { name: 'Flauta Doce', description: 'Flauta doce soprano.' },
    { name: 'Violino', description: 'Violino clássico e popular.' },
    { name: 'Baixo', description: 'Contrabaixo elétrico.' },
  ];

  const instruments = [];
  for (const [index, item] of items.entries()) {
    const instrument = await prisma.instrument.upsert({
      where: { name: item.name },
      update: { description: item.description, displayOrder: index },
      create: {
        name: item.name,
        description: item.description,
        displayOrder: index,
        status: InstrumentStatus.ACTIVE,
      },
    });
    instruments.push(instrument);
  }
  return instruments;
}

async function seedTeachers(instruments: Awaited<ReturnType<typeof seedInstruments>>) {
  const byName = (n: string) => instruments.find((i) => i.name === n)!;

  const teachersData = [
    {
      fullName: 'Marcos Andrade',
      email: 'marcos.andrade@asafe.org',
      phone: '(11) 98888-1010',
      whatsapp: '(11) 98888-1010',
      specialty: 'Violão e Guitarra popular',
      status: TeacherStatus.ACTIVE,
      hireDate: new Date('2019-03-01'),
      instrumentNames: ['Violão', 'Guitarra'],
      bio: 'Professor de cordas há mais de 15 anos, especialista em MPB e música popular.',
    },
    {
      fullName: 'Camila Souza',
      email: 'camila.souza@asafe.org',
      phone: '(11) 97777-2020',
      whatsapp: '(11) 97777-2020',
      specialty: 'Canto coral e técnica vocal',
      status: TeacherStatus.ACTIVE,
      hireDate: new Date('2021-08-15'),
      instrumentNames: ['Canto'],
      bio: 'Regente de coral e professora de técnica vocal.',
    },
    {
      fullName: 'Pedro Lima',
      email: 'pedro.lima@asafe.org',
      phone: '(11) 96666-3030',
      whatsapp: '(11) 96666-3030',
      specialty: 'Bateria e percussão',
      status: TeacherStatus.INACTIVE,
      hireDate: new Date('2018-01-10'),
      instrumentNames: ['Bateria'],
      bio: 'Baterista com passagem por diversas bandas locais.',
    },
  ];

  const teachers = [];
  for (const t of teachersData) {
    const { instrumentNames, ...data } = t;
    const teacher = await prisma.teacher.upsert({
      where: { email: data.email },
      update: {},
      create: {
        ...data,
        instruments: {
          create: instrumentNames.map((name) => ({ instrumentId: byName(name).id })),
        },
      },
    });
    teachers.push(teacher);
  }
  return teachers;
}

async function seedStudents(
  instruments: Awaited<ReturnType<typeof seedInstruments>>,
  teachers: Awaited<ReturnType<typeof seedTeachers>>,
) {
  const byInstrument = (n: string) => instruments.find((i) => i.name === n)!;
  const byTeacher = (n: string) => teachers.find((t) => t.fullName === n)!;

  const studentsData = [
    {
      fullName: 'Ana Beatriz Ferreira',
      email: 'ana.ferreira@example.com',
      phone: '(11) 91111-1111',
      whatsapp: '(11) 91111-1111',
      city: 'São Paulo',
      state: 'SP',
      birthDate: new Date('2010-05-12'),
      level: MusicLevel.BEGINNER,
      status: StudentStatus.ACTIVE,
      enrollmentDate: new Date('2024-02-01'),
      instrumentName: 'Violão',
      teacherName: 'Marcos Andrade',
    },
    {
      fullName: 'João Vitor Santos',
      email: 'joao.santos@example.com',
      phone: '(11) 92222-2222',
      whatsapp: '(11) 92222-2222',
      city: 'Guarulhos',
      state: 'SP',
      birthDate: new Date('2008-11-30'),
      level: MusicLevel.INTERMEDIATE,
      status: StudentStatus.ACTIVE,
      enrollmentDate: new Date('2023-06-15'),
      instrumentName: 'Guitarra',
      teacherName: 'Marcos Andrade',
    },
    {
      fullName: 'Maria Clara Oliveira',
      email: 'maria.oliveira@example.com',
      phone: '(11) 93333-3333',
      whatsapp: '(11) 93333-3333',
      city: 'São Paulo',
      state: 'SP',
      birthDate: new Date('2012-02-20'),
      level: MusicLevel.BEGINNER,
      status: StudentStatus.LOCKED,
      enrollmentDate: new Date('2024-09-01'),
      instrumentName: 'Canto',
      teacherName: 'Camila Souza',
    },
    {
      fullName: 'Lucas Gabriel Costa',
      email: 'lucas.costa@example.com',
      phone: '(11) 94444-4444',
      whatsapp: '(11) 94444-4444',
      city: 'Osasco',
      state: 'SP',
      birthDate: new Date('2005-07-08'),
      level: MusicLevel.ADVANCED,
      status: StudentStatus.INACTIVE,
      enrollmentDate: new Date('2020-03-10'),
      instrumentName: 'Bateria',
      teacherName: 'Pedro Lima',
    },
  ];

  for (const s of studentsData) {
    const { instrumentName, teacherName, ...data } = s;
    const exists = await prisma.student.findFirst({ where: { email: data.email } });
    if (exists) continue;
    await prisma.student.create({
      data: {
        ...data,
        instrumentId: byInstrument(instrumentName).id,
        teacherId: byTeacher(teacherName).id,
      },
    });
  }

  return prisma.student.findMany();
}

async function seedProject(instruments: Awaited<ReturnType<typeof seedInstruments>>) {
  const byName = (n: string) => instruments.find((i) => i.name === n)!;
  const name = 'Projeto Jovem Asafe';

  let project = await prisma.project.findFirst({ where: { name } });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name,
        description:
          'Projeto de iniciação musical para crianças e adolescentes atendidos pela associação.',
        objective: 'Promover inclusão social por meio do ensino de música.',
        location: 'Sede da Associação Asafe',
        responsible: 'Coordenação Pedagógica Asafe',
        status: ProjectStatus.ACTIVE,
        startDate: new Date('2024-02-01'),
      },
    });
  }

  const instrumentNames = ['Violão', 'Canto', 'Bateria'];
  for (const instrumentName of instrumentNames) {
    const instrument = byName(instrumentName);
    await prisma.projectInstrument.upsert({
      where: { projectId_instrumentId: { projectId: project.id, instrumentId: instrument.id } },
      update: {},
      create: { projectId: project.id, instrumentId: instrument.id },
    });
  }

  return project;
}

async function seedClassGroups(
  project: Awaited<ReturnType<typeof seedProject>>,
  instruments: Awaited<ReturnType<typeof seedInstruments>>,
  teachers: Awaited<ReturnType<typeof seedTeachers>>,
) {
  const byInstrument = (n: string) => instruments.find((i) => i.name === n)!;
  const byTeacher = (n: string) => teachers.find((t) => t.fullName === n)!;

  const classGroupsData = [
    {
      name: 'Violão Iniciante - Turma A',
      instrumentName: 'Violão',
      responsibleName: 'Marcos Andrade',
      weekday: Weekday.TUESDAY,
      startTime: '14:00',
      endTime: '15:00',
      room: 'Sala 1',
      capacity: 10,
      startDate: new Date('2024-02-06'),
    },
    {
      name: 'Coral Jovem',
      instrumentName: 'Canto',
      responsibleName: 'Camila Souza',
      weekday: Weekday.THURSDAY,
      startTime: '16:00',
      endTime: '17:30',
      room: 'Auditório',
      capacity: 20,
      startDate: new Date('2024-02-08'),
    },
    {
      name: 'Bateria Avançado',
      instrumentName: 'Bateria',
      responsibleName: 'Pedro Lima',
      weekday: Weekday.SATURDAY,
      startTime: '10:00',
      endTime: '11:00',
      room: 'Sala 3',
      capacity: 6,
      startDate: new Date('2024-02-10'),
    },
  ];

  const classGroups = [];
  for (const c of classGroupsData) {
    let classGroup = await prisma.classGroup.findFirst({
      where: { projectId: project.id, name: c.name },
    });
    if (!classGroup) {
      classGroup = await prisma.classGroup.create({
        data: {
          name: c.name,
          projectId: project.id,
          instrumentId: byInstrument(c.instrumentName).id,
          weekday: c.weekday,
          startTime: c.startTime,
          endTime: c.endTime,
          room: c.room,
          capacity: c.capacity,
          status: ClassGroupStatus.ACTIVE,
          startDate: c.startDate,
          teachers: {
            create: { teacherId: byTeacher(c.responsibleName).id, role: ClassTeacherRole.RESPONSIBLE },
          },
        },
      });
    }
    classGroups.push(classGroup);
  }
  return classGroups;
}

async function seedEnrollments(
  classGroups: Awaited<ReturnType<typeof seedClassGroups>>,
  students: Awaited<ReturnType<typeof seedStudents>>,
) {
  const byClassGroup = (n: string) => classGroups.find((c) => c.name === n)!;
  const byStudent = (n: string) => students.find((s) => s.fullName === n)!;

  const enrollmentsData = [
    { classGroupName: 'Violão Iniciante - Turma A', studentName: 'Ana Beatriz Ferreira' },
    { classGroupName: 'Violão Iniciante - Turma A', studentName: 'João Vitor Santos' },
    { classGroupName: 'Coral Jovem', studentName: 'Maria Clara Oliveira' },
  ];

  const enrollments = [];
  for (const e of enrollmentsData) {
    const classGroupId = byClassGroup(e.classGroupName).id;
    const studentId = byStudent(e.studentName).id;
    const enrollment = await prisma.enrollment.upsert({
      where: { classGroupId_studentId: { classGroupId, studentId } },
      update: { removedAt: null },
      create: { classGroupId, studentId },
    });
    enrollments.push(enrollment);
  }
  return enrollments;
}

async function seedAttendanceSession(
  classGroups: Awaited<ReturnType<typeof seedClassGroups>>,
  students: Awaited<ReturnType<typeof seedStudents>>,
  adminId: string,
) {
  const classGroup = classGroups.find((c) => c.name === 'Violão Iniciante - Turma A')!;
  const ana = students.find((s) => s.fullName === 'Ana Beatriz Ferreira')!;
  const joao = students.find((s) => s.fullName === 'João Vitor Santos')!;
  const date = new Date('2025-03-04');

  const existing = await prisma.attendanceSession.findUnique({
    where: { classGroupId_date: { classGroupId: classGroup.id, date } },
  });
  if (existing) return existing;

  return prisma.attendanceSession.create({
    data: {
      classGroupId: classGroup.id,
      date,
      generalNotes: 'Aula regular, revisão de acordes básicos.',
      createdById: adminId,
      records: {
        create: [
          { studentId: ana.id, status: AttendanceStatus.PRESENT },
          {
            studentId: joao.id,
            status: AttendanceStatus.ABSENT,
            note: 'Não compareceu, sem justificativa registrada.',
          },
        ],
      },
    },
  });
}

async function main() {
  console.log('Iniciando seed do banco de dados...');
  const admin = await seedAdmin();
  const instruments = await seedInstruments();
  const teachers = await seedTeachers(instruments);
  const students = await seedStudents(instruments, teachers);
  const project = await seedProject(instruments);
  const classGroups = await seedClassGroups(project, instruments, teachers);
  const enrollments = await seedEnrollments(classGroups, students);
  await seedAttendanceSession(classGroups, students, admin.id);
  console.log(`Matrículas: ${enrollments.length}`);
  console.log('Seed concluído com sucesso.');
}

main()
  .catch((err) => {
    console.error('Erro ao executar o seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
