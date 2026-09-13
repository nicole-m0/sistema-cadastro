import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createStudentSchema, idParamSchema, updateStudentSchema } from './students.schema';
import { getStudent, getStudents, postStudent, putStudent, removeStudent } from './students.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getStudents);
router.get('/:id', validate({ params: idParamSchema }), getStudent);
router.post('/', validate({ body: createStudentSchema }), postStudent);
router.put('/:id', validate({ params: idParamSchema, body: updateStudentSchema }), putStudent);
router.delete('/:id', validate({ params: idParamSchema }), removeStudent);

export default router;
