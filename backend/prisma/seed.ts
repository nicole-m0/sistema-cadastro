import { PrismaClient, MusicLevel, StudentStatus, TeacherStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
  const name = process.env.ADMIN_NAME ?? 'Administrador Asafe';
  const email = process.env.ADMIN_EMAIL ?? 'admin@asafe.org';
  const password = process.env.ADMIN_PASSWORD ?? 'TrocarEssaSenha123!';

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { name, email, passwordHash },
  });

  console.log(`Administrador pronto: ${admin.email}`);
}

async function seedInstruments() {
  const names = [
    'Violão',
    'Guitarra',
    'Piano/Teclado',
    'Bateria',
    'Canto',
    'Flauta Doce',
    'Violino',
    'Baixo',
  ];

  const instruments = [];
  for (const name of names) {
    const instrument = await prisma.instrument.upsert({
      where: { name },
      update: {},
      create: { name },
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
}

async function main() {
  console.log('Iniciando seed do banco de dados...');
  await seedAdmin();
  const instruments = await seedInstruments();
  const teachers = await seedTeachers(instruments);
  await seedStudents(instruments, teachers);
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
