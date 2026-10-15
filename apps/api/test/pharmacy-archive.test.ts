jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    PrismaClient: jest.fn().mockImplementation(() => ({
      medicine: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    })),
  };
});

import { PrismaClient } from '@prisma/client';
import { archiveMedicine, getArchivedMedicines } from '../src/modules/pharmacy/pharmacy.repository';

const medicineModel = (PrismaClient as jest.Mock).mock.results[0].value.medicine as {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
};

describe('pharmacy inventory archive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('archives a medicine without deleting its historical record', async () => {
    medicineModel.findUnique.mockResolvedValue({ id: 'medicine-1', isActive: true });
    medicineModel.update.mockResolvedValue({ id: 'medicine-1', isActive: false });

    await expect(archiveMedicine('medicine-1')).resolves.toMatchObject({
      id: 'medicine-1',
      isActive: false,
    });
    expect(medicineModel.update).toHaveBeenCalledWith({
      where: { id: 'medicine-1' },
      data: { isActive: false },
    });
  });

  it('returns archived medicines for the administrator archive view', async () => {
    const archived = [{ id: 'medicine-1', isActive: false, batches: [] }];
    medicineModel.findMany.mockResolvedValue(archived);

    await expect(getArchivedMedicines()).resolves.toBe(archived);
    expect(medicineModel.findMany).toHaveBeenCalledWith({
      where: { isActive: false },
      include: {
        batches: {
          include: { supplier: true },
          orderBy: { expiresAt: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  });
});
