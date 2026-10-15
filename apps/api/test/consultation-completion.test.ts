jest.mock('../src/config/database', () => ({
  prisma: {
    appointment: { findFirst: jest.fn() },
  },
}));
jest.mock('../src/modules/visit/visit.repository', () => ({
  findVisitById: jest.fn(),
  updateVisitStatus: jest.fn(),
}));
jest.mock('../src/modules/duty-roster/duty-roster.repository', () => ({
  findOnDutyDoctors: jest.fn(),
  getDoctorQueueLoads: jest.fn(),
}));
jest.mock('../src/modules/appointments/appointments.repository', () => ({
  updateAppointmentStatus: jest.fn(),
}));
jest.mock('../src/modules/consultations/consultation.repository', () => ({
  upsertConsultation: jest.fn(),
  findConsultationById: jest.fn(),
  findConsultationByVisitId: jest.fn(),
  getAllConsultations: jest.fn(),
}));
jest.mock('../src/modules/settings/settings.repository', () => ({
  getConsultationFee: jest.fn(),
}));
jest.mock('../src/modules/billing/billing.service', () => ({
  appendVisitInvoiceItem: jest.fn(),
}));

import { AppointmentStatus, VisitStatus } from '@prisma/client';
import { prisma } from '../src/config/database';
import { updateAppointmentStatus } from '../src/modules/appointments/appointments.repository';
import { findVisitById, updateVisitStatus } from '../src/modules/visit/visit.repository';
import {
  findConsultationByVisitId,
  upsertConsultation,
} from '../src/modules/consultations/consultation.repository';
import { getConsultationFee } from '../src/modules/settings/settings.repository';
import { recordConsultation } from '../src/modules/consultations/consultation.service';

const visitId = '2a4b8a00-4055-4f8b-8903-1ca1121917f4';

describe('consultation completion workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (findVisitById as jest.Mock).mockResolvedValue({ id: visitId, status: VisitStatus.REGISTERED });
    (findConsultationByVisitId as jest.Mock).mockResolvedValue(null);
    (getConsultationFee as jest.Mock).mockResolvedValue(null);
    (upsertConsultation as jest.Mock).mockResolvedValue({ id: 'consultation-1' });
  });

  it('keeps an unfinished consultation in the consulting visit state', async () => {
    await recordConsultation('doctor-1', {
      visitId,
      chiefComplaint: 'Headache',
      diagnoses: [],
    });

    expect(updateVisitStatus).toHaveBeenCalledWith(visitId, VisitStatus.CONSULTING);
    expect(prisma.appointment.findFirst).not.toHaveBeenCalled();
    expect(updateAppointmentStatus).not.toHaveBeenCalled();
  });

  it('moves a completed consultation to payment and completes its linked appointment', async () => {
    (prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
      id: 'appointment-1',
      status: AppointmentStatus.IN_PROGRESS,
    });

    await recordConsultation('doctor-1', {
      visitId,
      chiefComplaint: 'Headache',
      diagnoses: [],
      status: 'COMPLETED',
    });

    expect(updateVisitStatus).toHaveBeenCalledWith(visitId, VisitStatus.AWAITING_PAYMENT);
    expect(prisma.appointment.findFirst).toHaveBeenCalledWith({
      where: { visitId },
      orderBy: { appointmentDate: 'desc' },
    });
    expect(updateAppointmentStatus).toHaveBeenCalledWith(
      'appointment-1',
      AppointmentStatus.COMPLETED,
      visitId,
    );
  });
});
