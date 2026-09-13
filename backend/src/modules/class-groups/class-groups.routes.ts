import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  classGroupStudentParamSchema,
  classGroupTeacherParamSchema,
  createClassGroupSchema,
  enrollStudentSchema,
  idParamSchema,
  linkTeacherSchema,
  updateClassGroupSchema,
} from './class-groups.schema';
import {
  getClassGroup,
  getClassGroupStudents,
  getClassGroups,
  postClassGroup,
  postClassGroupStudent,
  postClassGroupTeacher,
  putClassGroup,
  removeClassGroup,
  removeClassGroupStudent,
  removeClassGroupTeacher,
} from './class-groups.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getClassGroups);
router.get('/:id', validate({ params: idParamSchema }), getClassGroup);
router.post('/', validate({ body: createClassGroupSchema }), postClassGroup);
router.put('/:id', validate({ params: idParamSchema, body: updateClassGroupSchema }), putClassGroup);
router.delete('/:id', validate({ params: idParamSchema }), removeClassGroup);

router.get('/:id/students', validate({ params: idParamSchema }), getClassGroupStudents);
router.post(
  '/:id/students',
  validate({ params: idParamSchema, body: enrollStudentSchema }),
  postClassGroupStudent,
);
router.delete(
  '/:id/students/:studentId',
  validate({ params: classGroupStudentParamSchema }),
  removeClassGroupStudent,
);

router.post(
  '/:id/teachers',
  validate({ params: idParamSchema, body: linkTeacherSchema }),
  postClassGroupTeacher,
);
router.delete(
  '/:id/teachers/:teacherId',
  validate({ params: classGroupTeacherParamSchema }),
  removeClassGroupTeacher,
);

export default router;
