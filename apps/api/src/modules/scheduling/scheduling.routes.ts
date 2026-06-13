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

// Get schedules for a specific user — must be before /:id
router.get('/user/:userId', getSchedulesByUserController);

// Get schedules for a specific department on a date — must be before /:id
router.get('/department/:department/date/:date', getSchedulesByDepartmentController);

// ==================== Time Off Request Routes ====================
// All /timeoff/* routes must be before /:id to avoid route shadowing
// Get all pending time off requests
router.get('/timeoff/pending', getPendingTimeOffController);

// Submit new time off request
router.post('/timeoff', createTimeOffController);

// Get time off requests for a specific user — must be before /timeoff/:id
router.get('/timeoff/user/:userId', getTimeOffByUserController);

// Get specific time off request
router.get('/timeoff/:id', getTimeOffController);

// Approve/reject time off request
router.post('/timeoff/:id/process', validate(ProcessTimeOffSchema), processTimeOffController);

// Create new schedule
router.post('/', validate(CreateScheduleSchema), createScheduleController);

// Get specific schedule
router.get('/:id', getScheduleController);

// Update schedule
router.put('/:id', validate(UpdateScheduleSchema), updateScheduleController);

// Delete schedule
router.delete('/:id', deleteScheduleController);

export default router;