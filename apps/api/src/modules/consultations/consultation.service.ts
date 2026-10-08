import { VisitStatus } from '@prisma/client';
import { ApiError } from '../../middlewares/errorHandler';
import { findVisitById, updateVisitStatus } from '../visit/visit.repository';
import * as dutyRosterRepository from '../duty-roster/duty-roster.repository';
import {
  upsertConsultation,
  findConsultationById,
  findConsultationByVisitId,
  getAllConsultations,
} from './consultation.repository';
import { CreateConsultationInput } from './consultation.validator';
import { getConsultationFee } from '../settings/settings.repository';
import { appendVisitInvoiceItem } from '../billing/billing.service';

export const recordConsultation = async (doctorId: string, data: CreateConsultationInput) => {
  const visit = await findVisitById(data.visitId);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }
  const existingConsultation = await findConsultationByVisitId(data.visitId);

  let assignedDoctorId = doctorId;

  if (!assignedDoctorId) {
    const onDutyStaff = await dutyRosterRepository.findAll();
    const now = new Date();

    const availableStaff = onDutyStaff.find(staff => {
      const startTime = new Date(staff.startTime);
      const endTime = new Date(staff.endTime);
      return now >= startTime && now <= endTime;
    });

    if (availableStaff) {
      assignedDoctorId = availableStaff.staffId;
      console.log(`✅ Automatically assigned staff ${availableStaff.staffId} to the consultation.`);
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

  if (['REGISTERED', 'WAITING_FOR_CONSULTATION', 'TRIAGED', 'CONSULTING'].includes(visit.status)) {
    await updateVisitStatus(data.visitId, VisitStatus.AWAITING_PAYMENT);
  }

  return { success: true, consultation };
};

export const getConsultation = async (id: string) => {
  const consultation = await findConsultationById(id);
  if (!consultation) {
    throw new ApiError(404, 'CONSULTATION_NOT_FOUND', 'Consultation not found');
  }
  return { success: true, consultation };
};

export const getConsultationForVisit = async (visitId: string) => {
  const consultation = await findConsultationByVisitId(visitId);
  return { success: true, consultation };
};

export const listConsultations = async (limit: number = 50, offset: number = 0) => {
  const result = await getAllConsultations(limit, offset);
  return { success: true, ...result };
};