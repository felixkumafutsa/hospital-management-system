import { prisma } from '../../config/database';
import { ApiError } from '../../middleware/errorHandler';
import { AddWardBedsInput, CreateWardInput } from './ward-management.validator';

const bedNumber = (number: number) => `Bed ${number.toString().padStart(2, '0')}`;

const orderedBeds = {
  orderBy: { bedNumber: 'asc' as const },
};

export const getManagedWards = async () => prisma.ward.findMany({
  include: { beds: orderedBeds },
  orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
});

export const createWardWithBeds = async (input: CreateWardInput) =>
  prisma.$transaction(async (transaction) => {
    const ward = await transaction.ward.create({
      data: {
        name: input.name,
        department: input.department,
        description: input.description,
        totalBeds: input.bedCount,
      },
    });

    await transaction.bed.createMany({
      data: Array.from({ length: input.bedCount }, (_, index) => ({
        wardId: ward.id,
        bedNumber: bedNumber(index + 1),
      })),
    });

    return transaction.ward.findUniqueOrThrow({
      where: { id: ward.id },
      include: { beds: orderedBeds },
    });
  });

export const addBedsToWard = async (wardId: string, input: AddWardBedsInput) =>
  prisma.$transaction(async (transaction) => {
    const ward = await transaction.ward.findUnique({
      where: { id: wardId },
      include: { beds: orderedBeds },
    });

    if (!ward) {
      throw new ApiError(404, 'WARD_NOT_FOUND', 'Ward not found');
    }

    const highestNumber = ward.beds.reduce((highest, bed) => {
      const match = /^Bed\s+(\d+)$/i.exec(bed.bedNumber.trim());
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);

    await transaction.bed.createMany({
      data: Array.from({ length: input.bedCount }, (_, index) => ({
        wardId,
        bedNumber: bedNumber(highestNumber + index + 1),
      })),
    });

    return transaction.ward.update({
      where: { id: wardId },
      data: { totalBeds: ward.beds.length + input.bedCount },
      include: { beds: orderedBeds },
    });
  });
