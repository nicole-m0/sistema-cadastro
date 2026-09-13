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
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
