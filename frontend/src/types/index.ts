export type TeacherStatus = 'ACTIVE' | 'INACTIVE';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';
export type MusicLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Admin {
  id: string;
  name: string;
  email: string;
}

export interface Instrument {
  id: string;
  name: string;
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
  };
}
