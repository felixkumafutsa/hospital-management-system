jest.mock('../src/config/database', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
  },
}));

jest.mock('../src/modules/visit/visit.repository', () => ({
  findVisitById: jest.fn(),
  admitPatient: jest.fn(),
}));

jest.mock('../src/modules/patients/patient.repository', () => ({
  findPatientById: jest.fn(),
}));

jest.mock('../src/modules/notifications/notifications.service', () => ({
  notifyAdmission: jest.fn(),
}));

import { prisma } from '../src/config/database';
import { findVisitById, admitPatient } from '../src/modules/visit/visit.repository';
import { findPatientById } from '../src/modules/patients/patient.repository';
import { notifyAdmission } from '../src/modules/notifications/notifications.service';
import { admitExistingPatient } from '../src/modules/visit/visit.service';

describe('admitExistingPatient validation', () => {
  const visit = {
    id: 'visit-id',
    patientId: 'patient-id',
    status: 'WAITING_FOR_CONSULTATION',
    admissionDate: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (findVisitById as jest.Mock).mockResolvedValue(visit);
    (findPatientById as jest.Mock).mockResolvedValue({
      firstName: 'Amina',
      lastName: 'Otieno',
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      isActive: true,
      role: { name: 'DOCTOR' },
    });
    (admitPatient as jest.Mock).mockResolvedValue({
      ...visit,
      status: 'ADMITTED',
    });
    (notifyAdmission as jest.Mock).mockResolvedValue(undefined);
  });

  const admit = () =>
    admitExistingPatient(
      visit.id,
      'Surgical Ward',
      'Bed 4',
      'doctor-id',
      new Date('2026-10-20T12:00:00.000Z'),
      2400,
    );

  it('rejects a missing attending doctor explicitly', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(admit()).rejects.toMatchObject({
      code: 'ATTENDING_DOCTOR_NOT_FOUND',
      statusCode: 404,
    });
    expect(admitPatient).not.toHaveBeenCalled();
  });

  it('rejects an inactive attending doctor explicitly', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      isActive: false,
      role: { name: 'DOCTOR' },
    });

    await expect(admit()).rejects.toMatchObject({
      code: 'ATTENDING_DOCTOR_INACTIVE',
      statusCode: 409,
    });
    expect(admitPatient).not.toHaveBeenCalled();
  });

  it('rejects an active user who does not have the DOCTOR role', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      isActive: true,
      role: { name: 'NURSE' },
    });

    await expect(admit()).rejects.toMatchObject({
      code: 'INVALID_ATTENDING_DOCTOR',
      statusCode: 400,
    });
    expect(admitPatient).not.toHaveBeenCalled();
  });

  it('allows an active doctor and sends the admitted visit through the repository', async () => {
    await admit();

    expect(admitPatient).toHaveBeenCalledWith(
      visit.id,
      'Surgical Ward',
      'Bed 4',
      'doctor-id',
      new Date('2026-10-20T12:00:00.000Z'),
      2400,
    );
    expect(notifyAdmission).toHaveBeenCalledWith(
      'Amina Otieno',
      'Surgical Ward',
      'Bed 4',
      visit.id,
    );
  });
});
