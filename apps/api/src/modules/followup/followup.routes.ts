import { Router } from 'express';
import {
  createFollowUp,
  getFollowUpById,
  getPatientFollowUps,
  getDoctorFollowUps,
  getUpcomingFollowUps,
  updateFollowUp,
  deleteFollowUp,
  getAllFollowUps,
} from './followup.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create follow-up
router.post('/', authorize(['DOCTOR', 'ADMINISTRATOR', 'RECEPTIONIST']), createFollowUp);

// Get all follow-ups (with optional status filter)
router.get('/', authorize(['DOCTOR', 'ADMINISTRATOR', 'RECEPTIONIST']), getAllFollowUps);

// Get upcoming follow-ups — must be before /:id
router.get('/upcoming', authorize(['DOCTOR', 'ADMINISTRATOR', 'RECEPTIONIST']), getUpcomingFollowUps);

// Get patient follow-ups — must be before /:id
router.get('/patient/:patientId', authorize(['DOCTOR', 'ADMINISTRATOR', 'RECEPTIONIST']), getPatientFollowUps);

// Get doctor follow-ups — must be before /:id
router.get('/doctor/:doctorId', authorize(['DOCTOR', 'ADMINISTRATOR']), getDoctorFollowUps);

// Get follow-up by ID
router.get('/:id', authorize(['DOCTOR', 'ADMINISTRATOR', 'RECEPTIONIST']), getFollowUpById);

// Update follow-up
router.put('/:id', authorize(['DOCTOR', 'ADMINISTRATOR']), updateFollowUp);

// Delete follow-up
router.delete('/:id', authorize(['ADMINISTRATOR']), deleteFollowUp);

export default router;