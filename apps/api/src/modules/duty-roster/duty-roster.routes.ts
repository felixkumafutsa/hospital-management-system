import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { createDutyRosterSchema, getDutyRosterSchema, updateDutyRosterSchema } from './duty-roster.validator';
import { createDutyRoster, getDutyRoster, getDutyRosters, updateDutyRoster, deleteDutyRoster } from './duty-roster.controller';

const router = Router();

router.post('/', validate(createDutyRosterSchema), asyncHandler(createDutyRoster));
router.get('/', asyncHandler(getDutyRosters));
router.get('/:id', validate(getDutyRosterSchema), asyncHandler(getDutyRoster));
router.put('/:id', validate(updateDutyRosterSchema), asyncHandler(updateDutyRoster));
router.delete('/:id', validate(getDutyRosterSchema), asyncHandler(deleteDutyRoster));

export default router;