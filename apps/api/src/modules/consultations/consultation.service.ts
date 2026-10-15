import { AppointmentStatus, VisitStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../middlewares/errorHandler';
import { findVisitById, updateVisitStatus } from '../visit/visit.repository';
import * as dutyRosterRepository from '../duty-roster/duty-roster.repository';
import { updateAppointmentStatus } from '../appointments/appointments.repository';
import {
  upsertConsultation,
  findConsultationById,
  findConsultationByVisitId,
  getAllConsultations,
} from './consultation.repository';
import { CreateConsultationInput } from './consultation.validator';
import { getConsultationFee } from '../settings/settings.repository';
import { appendVisitInvoiceItem } from '../billing/billing.service';
import logger from '../../config/logger';

export const recordConsultation = async (doctorId: string, data: CreateConsultationInput) => {
  try {
    const visit = await findVisitById(data.visitId);
    if (!visit) {
      throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
    }
    const existingConsultation = await findConsultationByVisitId(data.visitId);

    let assignedDoctorId = doctorId;

    if (!assignedDoctorId) {
      const now = new Date();
      const onDutyDoctors = await dutyRosterRepository.findOnDutyDoctors(now);

      if (onDutyDoctors.length > 0) {
        const doctorLoads = await dutyRosterRepository.getDoctorQueueLoads(
          onDutyDoctors.map(d => d.staffId),
          new Date(now.setHours(0, 0, 0, 0)),
          new Date(now.setHours(23, 59, 59, 999))
        );

        let leastLoadedDoctorId = onDutyDoctors[0].staffId;
        let minLoad = doctorLoads.get(leastLoadedDoctorId) ?? Infinity;

        for (const doctor of onDutyDoctors) {
          const load = doctorLoads.get(doctor.staffId) ?? 0;
          if (load < minLoad) {
            minLoad = load;
            leastLoadedDoctorId = doctor.staffId;
          }
        }
        assignedDoctorId = leastLoadedDoctorId;
        console.log(`✅ Automatically assigned doctor ${assignedDoctorId} to the consultation.`);
      } else {
        throw new ApiError(400, 'NO_ON_DUTY_STAFF', 'No on-duty staff available to record the consultation.');
      }
    }

    const consultationFee = await getConsultationFee();
    const consultation = await upsertConsultation(assignedDoctorId, data, consultationFee ?? undefined);

    if (!existingConsultation && consultationFee != null) {
      await appendVisitInvoiceItem(data.visitId, {
        description: 'Consultation',
        category: 'CONSULTATION',
        quantity: 1,
        unitPrice: consultationFee,
        reference: consultation.id,
      });
    }

    if (data.status === 'COMPLETED') {
      await updateVisitStatus(data.visitId, VisitStatus.AWAITING_PAYMENT);
      const appointment = await prisma.appointment.findFirst({
        where: { visitId: data.visitId },
        orderBy: { appointmentDate: 'desc' },
      });
      if (appointment && appointment.status !== AppointmentStatus.COMPLETED) {
        await updateAppointmentStatus(appointment.id, AppointmentStatus.COMPLETED, data.visitId);
      }
    } else if (
      ['REGISTERED', 'WAITING_FOR_CONSULTATION', 'TRIAGED'].includes(visit.status)
    ) {
      await updateVisitStatus(data.visitId, VisitStatus.CONSULTING);
    }

    return { success: true, consultation };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error recording consultation: ${err.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw {
      statusCode: 500,
      message: err.message || 'Failed to record consultation',
    };
  }
};

export const getConsultation = async (id: string) => {
  try {
    const consultation = await findConsultationById(id);
    if (!consultation) {
      throw new ApiError(404, 'CONSULTATION_NOT_FOUND', 'Consultation not found');
    }
    return { success: true, consultation };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching consultation: ${err.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch consultation',
    };
  }
};

export const getConsultationForVisit = async (visitId: string) => {
  try {
    const consultation = await findConsultationByVisitId(visitId);
    return { success: true, consultation };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching consultation for visit: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch consultation for visit',
    };
  }
};

export const listConsultations = async (limit: number = 50, offset: number = 0) => {
  try {
    const result = await getAllConsultations(limit, offset);
    return { success: true, ...result };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error listing consultations: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to list consultations',
    };
  }
};