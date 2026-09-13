import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import studentsRoutes from '../modules/students/students.routes';
import teachersRoutes from '../modules/teachers/teachers.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import uploadRoutes from '../modules/upload/upload.routes';
import instrumentsRoutes from '../modules/instruments/instruments.routes';

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
 *   GET    /api/dashboard     -> totais e cadastros recentes
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
 *   GET    /api/instruments   -> lista
 *   POST   /api/instruments   -> cria (idempotente por nome)
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
router.use('/upload', uploadRoutes);

export default router;
