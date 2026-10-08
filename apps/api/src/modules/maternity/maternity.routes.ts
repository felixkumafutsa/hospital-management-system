import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { 
  createAncController,
  getAncController,
  getAncByMaternityProfileController,
  listAncController,
  updateAncController,
  createDeliveryController,
  getDeliveryController,
  getDeliveryByMaternityProfileController,
  listDeliveryController,
  createPostnatalController,
  getPostnatalController,
  getPostnatalByMaternityProfileController,
  listPostnatalController,
  getStatsController,
  getPatientMaternityRecordsController,
  markAncAsDeliveredController
} from './maternity.controller';
import { 
  CreateAncSchema,
  UpdateAncSchema,
  CreateDeliverySchema,
  CreatePostnatalSchema,
  MarkAncAsDeliveredSchema
} from './maternity.validator';

const router = Router();

if (process.env.NODE_ENV !== 'production') {
  router.get('/test', (_req, res) => {
    res.status(200).json({ success: true, message: 'Maternity module test route works!' });
  });
}

// All routes require authentication
router.use(authenticate);

// Root route for maternity module
router.get('/', (_req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Maternity module API',
    availableEndpoints: ['/anc', '/deliveries', '/postnatal', '/stats']
  });
});

// ==================== ANC (Antenatal Care) Routes ====================
// Get all ANC records
router.get('/anc', listAncController);

// Get ANC dashboard statistics
router.get('/stats', getStatsController);

// Get all records for a patient
router.get('/patient/:patientId/records', getPatientMaternityRecordsController);

// Get all ANC records for a specific patient — must be before /anc/:id
router.get('/anc/patient/:patientId', getAncByMaternityProfileController);

// Create new ANC record
router.post('/anc', validate(CreateAncSchema), createAncController);

// Get specific ANC record
router.get('/anc/:id', getAncController);

// Mark ANC record as delivered (creates delivery record)
router.post('/anc/:id/deliver', validate(MarkAncAsDeliveredSchema), markAncAsDeliveredController);

// Update ANC record
router.put('/anc/:id', validate(UpdateAncSchema), updateAncController);

// ==================== Delivery Record Routes ====================
// Get all delivery records
router.get('/deliveries', listDeliveryController);

// Get all delivery records for a specific patient — must be before /deliveries/:id
router.get('/deliveries/patient/:patientId', getDeliveryByMaternityProfileController);

// Create new delivery record
router.post('/deliveries', validate(CreateDeliverySchema), createDeliveryController);

// Get specific delivery record
router.get('/deliveries/:id', getDeliveryController);

// ==================== Postnatal Record Routes ====================
// Get all postnatal records
router.get('/postnatal', listPostnatalController);

// Get all postnatal records for a specific patient — must be before /postnatal/:id
router.get('/postnatal/patient/:patientId', getPostnatalByMaternityProfileController);

// Create new postnatal record
router.post('/postnatal', validate(CreatePostnatalSchema), createPostnatalController);

// Get specific postnatal record
router.get('/postnatal/:id', getPostnatalController);

export default router;
