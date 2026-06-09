import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { 
  createAncController,
  getAncController,
  getAncByPatientController,
  listAncController,
  updateAncController,
  createDeliveryController,
  getDeliveryController,
  getDeliveryByPatientController,
  listDeliveryController,
  createPostnatalController,
  getPostnatalController,
  getPostnatalByPatientController,
  listPostnatalController,
  getMaternityStatsController
} from './maternity.controller';
import { 
  CreateAncSchema,
  UpdateAncSchema,
  CreateDeliverySchema,
  CreatePostnatalSchema
} from './maternity.validator';

const router = Router();

// Test route in maternity module
router.get('/test', (_req, res) => {
  res.status(200).json({ success: true, message: 'Maternity module test route works!' });
});

// All routes require authentication
router.use(authenticate);

// ==================== ANC (Antenatal Care) Routes ====================
// Get all ANC records
router.get('/anc', listAncController);

// Get ANC dashboard statistics
router.get('/stats', getMaternityStatsController);

// Create new ANC record
router.post('/anc', validate(CreateAncSchema), createAncController);

// Get specific ANC record
router.get('/anc/:id', getAncController);

// Update ANC record
router.put('/anc/:id', validate(UpdateAncSchema), updateAncController);

// Get all ANC records for a specific patient
router.get('/anc/patient/:patientId', getAncByPatientController);

// ==================== Delivery Record Routes ====================
// Get all delivery records
router.get('/deliveries', listDeliveryController);

// Create new delivery record
router.post('/deliveries', validate(CreateDeliverySchema), createDeliveryController);

// Get specific delivery record
router.get('/deliveries/:id', getDeliveryController);

// Get all delivery records for a specific patient
router.get('/deliveries/patient/:patientId', getDeliveryByPatientController);

// ==================== Postnatal Record Routes ====================
// Get all postnatal records
router.get('/postnatal', listPostnatalController);

// Create new postnatal record
router.post('/postnatal', validate(CreatePostnatalSchema), createPostnatalController);

// Get specific postnatal record
router.get('/postnatal/:id', getPostnatalController);

// Get all postnatal records for a specific patient
router.get('/postnatal/patient/:patientId', getPostnatalByPatientController);

export default router;