import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createTeacherSchema, idParamSchema, updateTeacherSchema } from './teachers.schema';
import { getTeacher, getTeachers, postTeacher, putTeacher, removeTeacher } from './teachers.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getTeachers);
router.get('/:id', validate({ params: idParamSchema }), getTeacher);
router.post('/', validate({ body: createTeacherSchema }), postTeacher);
router.put('/:id', validate({ params: idParamSchema, body: updateTeacherSchema }), putTeacher);
router.delete('/:id', validate({ params: idParamSchema }), removeTeacher);

export default router;
