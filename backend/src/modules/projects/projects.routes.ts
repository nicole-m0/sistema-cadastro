import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  createProjectSchema,
  idParamSchema,
  linkInstrumentSchema,
  projectInstrumentParamSchema,
  updateProjectSchema,
} from './projects.schema';
import {
  getProject,
  getProjects,
  postProject,
  postProjectInstrument,
  putProject,
  removeProject,
  removeProjectInstrument,
} from './projects.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getProjects);
router.get('/:id', validate({ params: idParamSchema }), getProject);
router.post('/', validate({ body: createProjectSchema }), postProject);
router.put('/:id', validate({ params: idParamSchema, body: updateProjectSchema }), putProject);
router.delete('/:id', validate({ params: idParamSchema }), removeProject);

router.post(
  '/:id/instruments',
  validate({ params: idParamSchema, body: linkInstrumentSchema }),
  postProjectInstrument,
);
router.delete(
  '/:id/instruments/:instrumentId',
  validate({ params: projectInstrumentParamSchema }),
  removeProjectInstrument,
);

export default router;
