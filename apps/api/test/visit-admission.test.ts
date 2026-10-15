jest.mock('../src/config/database', () => ({
  prisma: {
    $transaction: jest.fn(),
    ward: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '../src/config/database';
import {
  admitPatient,
  getActiveWardsWithAvailableBeds,
} from '../src/modules/visit/visit.repository';

const transaction = {
  visit: {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  ward: {
    findFirst: jest.fn(),
  },
  bed: {
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
};

const admissionArgs = {
  id: 'visit-id',
  ward: 'Surgical Ward',
  bedNumber: 'Bed 4',
  attendingDoctorId: 'doctor-id',
  expectedDischargeDate: new Date('2026-10-20T12:00:00.000Z'),
  dailyRate: 2400,
};

describe('admitPatient repository transaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation(
      (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );
    transaction.visit.findUnique.mockResolvedValue({
      id: admissionArgs.id,
      status: 'WAITING_FOR_CONSULTATION',
      admissionDate: null,
    });
    transaction.ward.findFirst.mockResolvedValue({
      id: 'ward-id',
      name: admissionArgs.ward,
      isActive: true,
    });
    transaction.bed.findFirst.mockResolvedValue({
      id: 'bed-id',
      status: 'AVAILABLE',
      isOccupied: false,
    });
    transaction.bed.updateMany.mockResolvedValue({ count: 1 });
    transaction.visit.updateMany.mockResolvedValue({ count: 1 });
    transaction.visit.findUniqueOrThrow.mockResolvedValue({
      id: admissionArgs.id,
      status: 'ADMITTED',
    });
  });

  describe('getActiveWardsWithAvailableBeds', () => {
    it('returns only active wards and beds that are available and unoccupied', async () => {
      (prisma.ward.findMany as jest.Mock).mockResolvedValue([]);

      await getActiveWardsWithAvailableBeds();

      expect(prisma.ward.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          beds: {
            some: { status: 'AVAILABLE', isOccupied: false },
          },
        },
        select: {
          id: true,
          name: true,
          department: true,
          beds: {
            where: { status: 'AVAILABLE', isOccupied: false },
            select: { id: true, bedNumber: true },
            orderBy: { bedNumber: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
    });
  });

  it('claims an available bed and admits the visit within one transaction', async () => {
    await admitPatient(
      admissionArgs.id,
      admissionArgs.ward,
      admissionArgs.bedNumber,
      admissionArgs.attendingDoctorId,
      admissionArgs.expectedDischargeDate,
      admissionArgs.dailyRate,
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.ward.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ id: admissionArgs.ward }, { name: admissionArgs.ward }] },
    });
    expect(transaction.bed.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'bed-id',
        status: 'AVAILABLE',
        isOccupied: false,
        ward: { isActive: true },
      },
      data: { isOccupied: true, status: 'OCCUPIED' },
    });
    expect(transaction.visit.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: admissionArgs.id,
          admissionDate: null,
          status: { not: 'ADMITTED' },
        },
        data: expect.objectContaining({
          ward: admissionArgs.ward,
          bedNumber: admissionArgs.bedNumber,
          attendingDoctorId: admissionArgs.attendingDoctorId,
          expectedDischargeDate: admissionArgs.expectedDischargeDate,
          dailyRate: admissionArgs.dailyRate,
          status: 'ADMITTED',
          visitType: 'INPATIENT',
        }),
      }),
    );
  });

  it('rejects a missing ward without attempting to claim a bed', async () => {
    transaction.ward.findFirst.mockResolvedValue(null);

    await expect(
      admitPatient(
        admissionArgs.id,
        admissionArgs.ward,
        admissionArgs.bedNumber,
        admissionArgs.attendingDoctorId,
        admissionArgs.expectedDischargeDate,
        admissionArgs.dailyRate,
      ),
    ).rejects.toMatchObject({ code: 'WARD_NOT_FOUND', statusCode: 404 });

    expect(transaction.bed.updateMany).not.toHaveBeenCalled();
    expect(transaction.visit.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an occupied bed without updating the visit', async () => {
    transaction.bed.findFirst.mockResolvedValue({
      id: 'bed-id',
      status: 'OCCUPIED',
      isOccupied: true,
    });

    await expect(
      admitPatient(
        admissionArgs.id,
        admissionArgs.ward,
        admissionArgs.bedNumber,
        admissionArgs.attendingDoctorId,
        admissionArgs.expectedDischargeDate,
        admissionArgs.dailyRate,
      ),
    ).rejects.toMatchObject({ code: 'BED_NOT_AVAILABLE', statusCode: 409 });

    expect(transaction.bed.updateMany).not.toHaveBeenCalled();
    expect(transaction.visit.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a bed number that does not exist in the selected ward', async () => {
    transaction.bed.findFirst.mockResolvedValue(null);

    await expect(
      admitPatient(
        admissionArgs.id,
        admissionArgs.ward,
        admissionArgs.bedNumber,
        admissionArgs.attendingDoctorId,
        admissionArgs.expectedDischargeDate,
        admissionArgs.dailyRate,
      ),
    ).rejects.toMatchObject({ code: 'BED_NOT_FOUND', statusCode: 404 });

    expect(transaction.bed.updateMany).not.toHaveBeenCalled();
    expect(transaction.visit.updateMany).not.toHaveBeenCalled();
  });

  it('rejects beds belonging to an inactive ward', async () => {
    transaction.ward.findFirst.mockResolvedValue({
      id: 'ward-id',
      name: admissionArgs.ward,
      isActive: false,
    });

    await expect(
      admitPatient(
        admissionArgs.id,
        admissionArgs.ward,
        admissionArgs.bedNumber,
        admissionArgs.attendingDoctorId,
        admissionArgs.expectedDischargeDate,
        admissionArgs.dailyRate,
      ),
    ).rejects.toMatchObject({ code: 'WARD_INACTIVE', statusCode: 409 });

    expect(transaction.bed.findFirst).not.toHaveBeenCalled();
    expect(transaction.bed.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an admission if the conditional bed claim loses a race', async () => {
    transaction.bed.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      admitPatient(
        admissionArgs.id,
        admissionArgs.ward,
        admissionArgs.bedNumber,
        admissionArgs.attendingDoctorId,
        admissionArgs.expectedDischargeDate,
        admissionArgs.dailyRate,
      ),
    ).rejects.toMatchObject({ code: 'BED_NOT_AVAILABLE', statusCode: 409 });

    expect(transaction.visit.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an admission if another request admits the visit first', async () => {
    transaction.visit.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      admitPatient(
        admissionArgs.id,
        admissionArgs.ward,
        admissionArgs.bedNumber,
        admissionArgs.attendingDoctorId,
        admissionArgs.expectedDischargeDate,
        admissionArgs.dailyRate,
      ),
    ).rejects.toMatchObject({
      code: 'PATIENT_ALREADY_ADMITTED',
      statusCode: 409,
    });

    expect(transaction.bed.updateMany).toHaveBeenCalledTimes(1);
  });

  it('rejects an already admitted visit before claiming a bed', async () => {
    transaction.visit.findUnique.mockResolvedValue({
      id: admissionArgs.id,
      status: 'ADMITTED',
      admissionDate: new Date(),
    });

    await expect(
      admitPatient(
        admissionArgs.id,
        admissionArgs.ward,
        admissionArgs.bedNumber,
        admissionArgs.attendingDoctorId,
        admissionArgs.expectedDischargeDate,
        admissionArgs.dailyRate,
      ),
    ).rejects.toMatchObject({
      code: 'PATIENT_ALREADY_ADMITTED',
      statusCode: 409,
    });

    expect(transaction.bed.updateMany).not.toHaveBeenCalled();
  });
});
