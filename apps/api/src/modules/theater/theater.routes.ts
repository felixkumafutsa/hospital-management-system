
import { Router } from 'express';
import * as theaterController from './theater.controller';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import * as theaterValidator from './theater.validator';

const router = Router();

router.use(authenticate);

router.get('/catalog', theaterController.getProcedureCatalog);
router.post(
  '/catalog',
  authorize(['ADMINISTRATOR']),
  validate(theaterValidator.createProcedureCatalog),
  theaterController.createProcedureCatalog
);
router.put(
  '/catalog/:id',
  authorize(['ADMINISTRATOR']),
  validate(theaterValidator.updateProcedureCatalog),
  theaterController.updateProcedureCatalog
);
router.post(
  '/rooms',
  authorize(['ADMINISTRATOR']),
  validate(theaterValidator.createTheater),
  theaterController.createTheater
);
router.put(
  '/rooms/:id',
  authorize(['ADMINISTRATOR']),
  validate(theaterValidator.updateTheater),
  theaterController.updateTheater
);
router.get('/resources', theaterController.getTheaterResources);
router.post(
  '/requests/maternity',
  authorize(['ADMINISTRATOR', 'DOCTOR', 'NURSE']),
  validate(theaterValidator.createMaternitySurgicalRequest),
  theaterController.createMaternitySurgicalRequest
);

// Route to create a new surgical procedure
router.post(
  '/requests',
  validate(theaterValidator.createSurgicalProcedure),
  theaterController.createSurgicalProcedure
);

// Route to get all surgical procedures
router.get('/', theaterController.getAllSurgicalProcedures);

// Route to get a surgical procedure by ID
router.get('/:id', theaterController.getSurgicalProcedureById);

// Route to update a surgical procedure
router.put(
  '/:id',
  validate(theaterValidator.updateSurgicalProcedure),
  theaterController.updateSurgicalProcedure
);

export default router;