jest.mock('../src/config/database', () => ({
  prisma: {
    $transaction: jest.fn(),
    ward: { findMany: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../src/config/database';
import { authorizeExactRole } from '../src/middleware/auth';
import {
  addBedsToWard,
  createWardWithBeds,
  getManagedWards,
} from '../src/modules/visit/ward-management.repository';
import { createWardSchema } from '../src/modules/visit/ward-management.validator';

describe('ward management repository', () => {
  const transaction = {
    ward: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    bed: { createMany: jest.fn() },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    transaction.bed.createMany.mockResolvedValue({ count: 0 });
    (prisma.$transaction as jest.Mock).mockImplementation(
      (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    );
  });

  it('loads wards together with their bed inventory', async () => {
    const wards = [{ id: 'ward-1', beds: [] }];
    (prisma.ward.findMany as jest.Mock).mockResolvedValue(wards);

    await expect(getManagedWards()).resolves.toBe(wards);
    expect(prisma.ward.findMany).toHaveBeenCalledWith({
      include: { beds: { orderBy: { bedNumber: 'asc' } } },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  });

  it('creates a ward and its sequential available beds in one transaction', async () => {
    transaction.ward.create.mockResolvedValue({ id: 'ward-1' });
    transaction.ward.findUniqueOrThrow.mockResolvedValue({ id: 'ward-1', beds: [] });
    const input = {
      name: '  East Medical  ',
      department: 'Internal Medicine',
      description: 'Adult inpatient care',
      bedCount: 3,
    };

    await createWardWithBeds(input);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.ward.create).toHaveBeenCalledWith({
      data: {
        name: input.name,
        department: input.department,
        description: input.description,
        totalBeds: 3,
      },
    });
    expect(transaction.bed.createMany).toHaveBeenCalledWith({
      data: [
        { wardId: 'ward-1', bedNumber: 'Bed 01' },
        { wardId: 'ward-1', bedNumber: 'Bed 02' },
        { wardId: 'ward-1', bedNumber: 'Bed 03' },
      ],
    });
    expect(transaction.ward.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'ward-1' },
      include: { beds: { orderBy: { bedNumber: 'asc' } } },
    });
  });

  it('propagates bed creation failures so the transaction rolls back the ward', async () => {
    transaction.ward.create.mockResolvedValue({ id: 'ward-1' });
    transaction.bed.createMany.mockRejectedValue(new Error('duplicate bed'));

    await expect(createWardWithBeds({
      name: 'East Medical',
      department: 'Medicine',
      description: undefined,
      bedCount: 2,
    })).rejects.toThrow('duplicate bed');
    expect(transaction.ward.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('adds numbered beds after the highest existing number without changing existing beds', async () => {
    const existingWard = {
      id: 'ward-1',
      totalBeds: 3,
      beds: [
        { id: 'bed-1', bedNumber: 'Bed 01', status: 'AVAILABLE', isOccupied: false },
        { id: 'bed-2', bedNumber: 'Bed 03', status: 'OCCUPIED', isOccupied: true },
      ],
    };
    transaction.ward.findUnique.mockResolvedValue(existingWard);
    transaction.ward.update.mockResolvedValue({ ...existingWard, totalBeds: 4 });

    await addBedsToWard('ward-1', { bedCount: 2 });

    expect(transaction.bed.createMany).toHaveBeenCalledWith({
      data: [
        { wardId: 'ward-1', bedNumber: 'Bed 04' },
        { wardId: 'ward-1', bedNumber: 'Bed 05' },
      ],
    });
    expect(transaction.ward.update).toHaveBeenCalledWith({
      where: { id: 'ward-1' },
      data: { totalBeds: 4 },
      include: { beds: { orderBy: { bedNumber: 'asc' } } },
    });
    expect(existingWard.beds[1]).toMatchObject({ status: 'OCCUPIED', isOccupied: true });
  });

  it('rejects invalid create counts and normalizes ward text before mutation', () => {
    expect(createWardSchema.safeParse({
      body: { name: 'Ward', department: 'Medicine', bedCount: 0 },
    }).success).toBe(false);
    expect(createWardSchema.parse({
      body: { name: ' Ward ', department: ' Medicine ', description: ' ', bedCount: 1 },
    }).body).toEqual({
      name: 'Ward',
      department: 'Medicine',
      description: undefined,
      bedCount: 1,
    });
  });
});

describe('administrator-only ward access', () => {
  const runGuard = async (roleName: string) => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: { name: roleName },
    });
    const next = jest.fn();
    await authorizeExactRole('ADMINISTRATOR')(
      { user: { userId: 'user-1', roleId: 'role-1' } } as Request,
      {} as Response,
      next as NextFunction,
    );
    return next;
  };

  it('permits only the exact administrator role, not an MD alias', async () => {
    const next = await runGuard('ADMINISTRATOR');
    expect(next).toHaveBeenCalledWith();

    const mdNext = await runGuard('MD');
    expect(mdNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' }),
    );
  });
});
