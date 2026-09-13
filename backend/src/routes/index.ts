import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import studentsRoutes from '../modules/students/students.routes';
import teachersRoutes from '../modules/teachers/teachers.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import uploadRoutes from '../modules/upload/upload.routes';
import instrumentsRoutes from '../modules/instruments/instruments.routes';
import projectsRoutes from '../modules/projects/projects.routes';
import classGroupsRoutes from '../modules/class-groups/class-groups.routes';
import attendanceRoutes from '../modules/attendance/attendance.routes';

const router = Router();

/**
 * Documentação básica dos endpoints:
 *
 * Auth
 *   POST   /api/auth/login    -> autentica administrador, seta cookie httpOnly
 *   POST   /api/auth/logout   -> encerra sessão
 *   GET    /api/auth/me       -> retorna administrador autenticado
 *
 * Dashboard
 *   GET    /api/dashboard     -> totais, recentes, chamadas pendentes e baixa frequência
 *
 * Alunos
 *   GET    /api/students      -> lista paginada (search, status, instrumentId, teacherId)
 *   GET    /api/students/:id  -> detalhe
 *   POST   /api/students      -> cria
 *   PUT    /api/students/:id  -> atualiza
 *   DELETE /api/students/:id  -> exclui (soft delete)
 *
 * Professores
 *   GET    /api/teachers      -> lista paginada (search, status, instrumentId)
 *   GET    /api/teachers/:id  -> detalhe
 *   POST   /api/teachers      -> cria
 *   PUT    /api/teachers/:id  -> atualiza
 *   DELETE /api/teachers/:id  -> exclui (soft delete)
 *
 * Instrumentos
 *   GET    /api/instruments      -> lista paginada (search, status)
 *   GET    /api/instruments/:id  -> detalhe + uso em projetos/turmas
 *   POST   /api/instruments      -> cria
 *   PUT    /api/instruments/:id  -> atualiza (inclui ativar/desativar)
 *   DELETE /api/instruments/:id  -> exclui fisicamente se não houver vínculos
 *
 * Projetos
 *   GET    /api/projects                          -> lista paginada (search, status)
 *   GET    /api/projects/:id                       -> detalhe + turmas + resumo
 *   POST   /api/projects                            -> cria
 *   PUT    /api/projects/:id                        -> atualiza
 *   DELETE /api/projects/:id                        -> exclui (soft delete)
 *   POST   /api/projects/:id/instruments            -> vincula instrumento ativo
 *   DELETE /api/projects/:id/instruments/:instrumentId -> desvincula instrumento
 *
 * Turmas
 *   GET    /api/class-groups                            -> lista paginada (search, status, projectId, instrumentId, teacherId)
 *   GET    /api/class-groups/:id                          -> detalhe
 *   POST   /api/class-groups                              -> cria
 *   PUT    /api/class-groups/:id                          -> atualiza
 *   DELETE /api/class-groups/:id                          -> exclui (soft delete)
 *   GET    /api/class-groups/:id/students                 -> lista matrículas
 *   POST   /api/class-groups/:id/students                 -> matricula aluno
 *   DELETE /api/class-groups/:id/students/:studentId      -> remove matrícula (preserva histórico)
 *   POST   /api/class-groups/:id/teachers                 -> vincula professor (responsável/auxiliar)
 *   DELETE /api/class-groups/:id/teachers/:teacherId      -> remove professor auxiliar
 *
 * Chamadas
 *   POST   /api/attendance/sessions                       -> cria chamada
 *   PUT    /api/attendance/sessions/:id                    -> edita chamada
 *   GET    /api/attendance/sessions                        -> histórico (filtros: classGroupId, projectId, from, to)
 *   GET    /api/attendance/sessions/:id                    -> detalhe da chamada
 *   GET    /api/attendance/reports/student/:studentId      -> frequência por aluno (?format=csv)
 *   GET    /api/attendance/reports/class-group/:classGroupId -> frequência por turma (?format=csv)
 *   GET    /api/attendance/reports/project/:projectId      -> frequência por projeto (?format=csv)
 *
 * Upload
 *   POST   /api/upload/:folder ("students" | "teachers") -> multipart/form-data (campo "photo")
 *   DELETE /api/upload          (body: { publicId })
 */

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/students', studentsRoutes);
router.use('/teachers', teachersRoutes);
router.use('/instruments', instrumentsRoutes);
router.use('/projects', projectsRoutes);
router.use('/class-groups', classGroupsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/upload', uploadRoutes);

export default router;
