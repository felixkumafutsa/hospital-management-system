import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { 
  createScheduleController,
  getScheduleController,
  getSchedulesByUserController,
  getSchedulesByDepartmentController,
  listSchedulesController,
  updateScheduleController,
  deleteScheduleController,
  createTimeOffController,
  getTimeOffController,
  getPendingTimeOffController,
  getTimeOffByUserController,
  processTimeOffController,
  getSchedulingStatsController
} from './scheduling.controller';
import { 
  CreateScheduleSchema,
  UpdateScheduleSchema,
  ProcessTimeOffSchema
} from './scheduling.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== Staff Schedule Routes ====================
// Get all schedules
router.get('/', listSchedulesController);

// Get scheduling dashboard statistics
router.get('/stats', getSchedulingStatsController);

// Get all pending time off requests
router.get('/timeoff/pending', getPendingTimeOffController);

// Create new schedule
router.post('/', validate(CreateScheduleSchema), createScheduleController);

// Get specific schedule
router.get('/:id', getScheduleController);

// Update schedule
router.put('/:id', validate(UpdateScheduleSchema), updateScheduleController);

// Delete schedule
router.delete('/:id', deleteScheduleController);

// Get schedules for a specific user
router.get('/user/:userId', getSchedulesByUserController);

// Get schedules for a specific department on a date
router.get('/department/:department/date/:date', getSchedulesByDepartmentController);

// ==================== Time Off Request Routes ====================
// Submit new time off request
router.post('/timeoff', createTimeOffController);

// Get specific time off request
router.get('/timeoff/:id', getTimeOffController);

// Get time off requests for a specific user
router.get('/timeoff/user/:userId', getTimeOffByUserController);

// Approve/reject time off request
router.post('/timeoff/:id/process', validate(ProcessTimeOffSchema), processTimeOffController);

export default router;