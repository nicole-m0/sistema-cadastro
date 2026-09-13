export type TeacherStatus = 'ACTIVE' | 'INACTIVE';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';
export type MusicLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type InstrumentStatus = 'ACTIVE' | 'INACTIVE';
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type Weekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';
export type ClassGroupStatus = 'ACTIVE' | 'CLOSED' | 'SUSPENDED';
export type ClassTeacherRole = 'RESPONSIBLE' | 'ASSISTANT';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'JUSTIFIED' | 'LATE';

export interface Admin {
  id: string;
  name: string;
  email: string;
}

export interface Instrument {
  id: string;
  name: string;
  description?: string | null;
  status: InstrumentStatus;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InstrumentUsage {
  studentsCount: number;
  teachersCount: number;
  projects: { id: string; name: string; status: ProjectStatus }[];
  classGroups: {
    id: string;
    name: string;
    status: ClassGroupStatus;
    project: { id: string; name: string };
  }[];
}

export interface InstrumentDetail extends Instrument {
  usage: InstrumentUsage;
}

export interface TeacherSummary {
  id: string;
  fullName: string;
  status: TeacherStatus;
}

export interface Teacher {
  id: string;
  fullName: string;
  socialName?: string | null;
  document?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  specialty?: string | null;
  hireDate?: string | null;
  status: TeacherStatus;
  photoUrl?: string | null;
  photoPublicId?: string | null;
  bio?: string | null;
  instruments: Instrument[];
  studentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  fullName: string;
  socialName?: string | null;
  birthDate?: string | null;
  document?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  level: MusicLevel;
  enrollmentDate?: string | null;
  status: StudentStatus;
  photoUrl?: string | null;
  photoPublicId?: string | null;
  notes?: string | null;
  instrumentId?: string | null;
  instrument?: Instrument | null;
  teacherId?: string | null;
  teacher?: TeacherSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  objective?: string | null;
  location?: string | null;
  responsible?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  instruments: Instrument[];
  classGroupsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectClassGroupSummary {
  id: string;
  name: string;
  status: ClassGroupStatus;
  weekday: Weekday;
  startTime: string;
  endTime?: string | null;
  instrument: Instrument;
  teachers: (TeacherSummary & { role: ClassTeacherRole })[];
  studentsCount: number;
}

export interface ProjectDetail extends Project {
  classGroups: ProjectClassGroupSummary[];
  summary: {
    classGroupsCount: number;
    studentsCount: number;
    teachersCount: number;
  };
}

export interface ClassGroup {
  id: string;
  name: string;
  projectId: string;
  instrumentId: string;
  weekday: Weekday;
  startTime: string;
  endTime?: string | null;
  room?: string | null;
  capacity?: number | null;
  status: ClassGroupStatus;
  notes?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  project: { id: string; name: string; status: ProjectStatus };
  instrument: Instrument;
  teachers: (TeacherSummary & { role: ClassTeacherRole })[];
  studentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  classGroupId: string;
  studentId: string;
  enrolledAt: string;
  removedAt?: string | null;
  student: {
    id: string;
    fullName: string;
    status: StudentStatus;
    photoUrl?: string | null;
  };
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  note?: string | null;
  student: { id: string; fullName: string; photoUrl?: string | null };
}

export interface AttendanceSessionListItem {
  id: string;
  classGroupId: string;
  date: string;
  generalNotes?: string | null;
  classGroup: { id: string; name: string; project: { id: string; name: string } };
  createdBy: { id: string; name: string } | null;
  updatedBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  summary: { total: number; present: number; absent: number; justified: number; late: number };
}

export interface AttendanceSession {
  id: string;
  classGroupId: string;
  date: string;
  generalNotes?: string | null;
  classGroup: { id: string; name: string; project: { id: string; name: string } };
  createdBy: { id: string; name: string } | null;
  updatedBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  records: AttendanceRecord[];
}

export interface AttendanceFrequencyRow {
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

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  items: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DashboardSummary {
  totals: {
    students: number;
    activeStudents: number;
    teachers: number;
    activeTeachers: number;
    activeInstruments: number;
    activeProjects: number;
    activeClassGroups: number;
    enrolledStudents: number;
    teachersInClasses: number;
  };
  recent: {
    students: Array<{
      id: string;
      fullName: string;
      status: StudentStatus;
      createdAt: string;
      photoUrl: string | null;
    }>;
    teachers: Array<{
      id: string;
      fullName: string;
      status: TeacherStatus;
      createdAt: string;
      photoUrl: string | null;
    }>;
    attendanceSessions: Array<{
      id: string;
      date: string;
      classGroup: { id: string; name: string };
      createdAt: string;
    }>;
  };
  pendingAttendance: Array<{
    id: string;
    name: string;
    project: { id: string; name: string };
  }>;
  lowAttendanceStudents: Array<{
    studentId: string;
    fullName: string;
    totalSessions: number;
    attendancePercentage: number;
  }>;
}
