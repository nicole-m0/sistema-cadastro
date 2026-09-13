import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  classGroupIdParamSchema,
  createAttendanceSessionSchema,
  idParamSchema,
  projectIdParamSchema,
  studentIdParamSchema,
  updateAttendanceSessionSchema,
} from './attendance.schema';
import {
  getAttendanceSession,
  getAttendanceSessions,
  getClassGroupFrequencyReport,
  getProjectFrequencyReport,
  getStudentFrequencyReport,
  postAttendanceSession,
  putAttendanceSession,
} from './attendance.controller';

const router = Router();

router.use(requireAuth);

router.post('/sessions', validate({ body: createAttendanceSessionSchema }), postAttendanceSession);
router.put(
  '/sessions/:id',
  validate({ params: idParamSchema, body: updateAttendanceSessionSchema }),
  putAttendanceSession,
);
router.get('/sessions', getAttendanceSessions);
router.get('/sessions/:id', validate({ params: idParamSchema }), getAttendanceSession);

router.get(
  '/reports/student/:studentId',
  validate({ params: studentIdParamSchema }),
  getStudentFrequencyReport,
);
router.get(
  '/reports/class-group/:classGroupId',
  validate({ params: classGroupIdParamSchema }),
  getClassGroupFrequencyReport,
);
router.get(
  '/reports/project/:projectId',
  validate({ params: projectIdParamSchema }),
  getProjectFrequencyReport,
);

export default router;
