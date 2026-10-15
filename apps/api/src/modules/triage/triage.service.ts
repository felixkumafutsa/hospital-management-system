import logger from '../../config/logger';
import { ApiError } from '../../middlewares/errorHandler';
import { findVisitById } from '../visit/visit.repository';
import {
  saveVitals,
  getVitalsByVisitId,
  getTriageQueueVisits,
  countTodayTriage,
} from './triage.repository';
import { RecordVitalsInput } from './triage.validator';

export const recordPatientVitals = async (nurseId: string, data: RecordVitalsInput) => {
  try {
    const visit = await findVisitById(data.visitId);
    if (!visit) {
      throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
    }

    const { vital, appointment } = await saveVitals(nurseId, data);
    return {
      success: true,
      vital,
      appointment,
      assignmentWarning: appointment.doctorId
        ? undefined
        : 'Vitals were recorded, but no on-duty doctor was available. Add an active DOCTOR to the duty roster and assign this consultation.',
    };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error recording patient vitals: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to record patient vitals',
    };
  }
};

export const fetchVitalsForVisit = async (visitId: string) => {
  try {
    const vitals = await getVitalsByVisitId(visitId);
    return { success: true, vitals };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching vitals for visit: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch vitals for visit',
    };
  }
};

export const fetchTriageQueue = async () => {
  try {
    const queue = await getTriageQueueVisits();
    return { success: true, queue };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching triage queue: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch triage queue',
    };
  }
};

export const fetchTriageCount = async (fromDate?: Date, toDate?: Date) => {
  try {
    const total = await countTodayTriage(fromDate, toDate);
    return { success: true, total };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching triage count: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch triage count',
    };
  }
};