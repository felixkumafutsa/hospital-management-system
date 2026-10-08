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
};

export const fetchVitalsForVisit = async (visitId: string) => {
  const vitals = await getVitalsByVisitId(visitId);
  return { success: true, vitals };
};

export const fetchTriageQueue = async () => {
  const queue = await getTriageQueueVisits();
  return { success: true, queue };
};

export const fetchTriageCount = async (fromDate?: Date, toDate?: Date) => {
  const total = await countTodayTriage(fromDate, toDate);
  return { success: true, total };
};
