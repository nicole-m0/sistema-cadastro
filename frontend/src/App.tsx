import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { StudentsList } from './pages/students/StudentsList';
import { StudentForm } from './pages/students/StudentForm';
import { StudentDetail } from './pages/students/StudentDetail';
import { TeachersList } from './pages/teachers/TeachersList';
import { TeacherForm } from './pages/teachers/TeacherForm';
import { TeacherDetail } from './pages/teachers/TeacherDetail';
import { InstrumentsList } from './pages/instruments/InstrumentsList';
import { InstrumentForm } from './pages/instruments/InstrumentForm';
import { InstrumentDetail } from './pages/instruments/InstrumentDetail';
import { ProjectsList } from './pages/projects/ProjectsList';
import { ProjectForm } from './pages/projects/ProjectForm';
import { ProjectDetail } from './pages/projects/ProjectDetail';
import { ClassGroupsList } from './pages/class-groups/ClassGroupsList';
import { ClassGroupForm } from './pages/class-groups/ClassGroupForm';
import { ClassGroupDetail } from './pages/class-groups/ClassGroupDetail';
import { AttendanceForm } from './pages/attendance/AttendanceForm';
import { AttendanceHistory } from './pages/attendance/AttendanceHistory';
import { AttendanceReport } from './pages/attendance/AttendanceReport';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/" element={<Dashboard />} />

                <Route path="/alunos" element={<StudentsList />} />
                <Route path="/alunos/novo" element={<StudentForm />} />
                <Route path="/alunos/:id" element={<StudentDetail />} />
                <Route path="/alunos/:id/editar" element={<StudentForm />} />

                <Route path="/professores" element={<TeachersList />} />
                <Route path="/professores/novo" element={<TeacherForm />} />
                <Route path="/professores/:id" element={<TeacherDetail />} />
                <Route path="/professores/:id/editar" element={<TeacherForm />} />

                <Route path="/instrumentos" element={<InstrumentsList />} />
                <Route path="/instrumentos/novo" element={<InstrumentForm />} />
                <Route path="/instrumentos/:id" element={<InstrumentDetail />} />
                <Route path="/instrumentos/:id/editar" element={<InstrumentForm />} />

                <Route path="/projetos" element={<ProjectsList />} />
                <Route path="/projetos/novo" element={<ProjectForm />} />
                <Route path="/projetos/:id" element={<ProjectDetail />} />
                <Route path="/projetos/:id/editar" element={<ProjectForm />} />

                <Route path="/turmas" element={<ClassGroupsList />} />
                <Route path="/turmas/novo" element={<ClassGroupForm />} />
                <Route path="/turmas/:id" element={<ClassGroupDetail />} />
                <Route path="/turmas/:id/editar" element={<ClassGroupForm />} />

                <Route path="/chamadas" element={<AttendanceHistory />} />
                <Route path="/chamadas/relatorio" element={<AttendanceReport />} />
                <Route path="/chamadas/nova" element={<AttendanceForm />} />
                <Route path="/chamadas/:id/editar" element={<AttendanceForm />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
