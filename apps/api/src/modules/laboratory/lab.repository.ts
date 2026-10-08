import { Prisma, LabStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../../config/database';
import logger from '../../config/logger';
import { ApiError } from '../../middlewares/errorHandler';
import type {
  AddLabResultInput,
  CreateLabRequestInput,
  CreateLabTestInput,
  UpdateLabRequestStatusInput,
} from './lab.validator';

const logRepositoryError = (context: string, error: unknown) => {
  logger.error(`${context}: ${error instanceof Error ? error.message : String(error)}`);
};

export const createLabTest = async (data: CreateLabTestInput) => {
  try {
    const labTest = await prisma.labTest.create({
      data: {
        name: data.name,
        code: data.code,
        category: data.category,
        unit: data.unit,
        normalRange: data.normalRange,
        price: new Prisma.Decimal(data.price),
      },
    });

    logger.info(`Lab test created: ${labTest.id}`);
    return labTest;
  } catch (error: unknown) {
    logRepositoryError('Error creating lab test', error);
    throw error;
  }
};

export const updateLabTestPrice = async (id: string, price: number) => {
  return prisma.labTest.update({
    where: { id },
    data: { price: new Prisma.Decimal(price) },
  });
};

export const getLabTestById = async (id: string) => {
  try {
    const labTest = await prisma.labTest.findUnique({
      where: { id },
    });

    if (!labTest) {
      const error = new Error('Lab test not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return labTest;
  } catch (error: unknown) {
    logRepositoryError('Error fetching lab test', error);
    throw error;
  }
};

export const getAllLabTests = async (limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const [tests, total] = await Promise.all([
      prisma.labTest.findMany({
        where: { isActive: true },
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      prisma.labTest.count({ where: { isActive: true } }),
    ]);

    return {
      data: tests,
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: unknown) {
    logRepositoryError('Error fetching all lab tests', error);
    throw error;
  }
};

export const createLabRequest = async (
  data: CreateLabRequestInput & { requestedBy: string }
) => {
  try {
    const labRequest = await prisma.$transaction(async (transaction) => {
      const [visit, tests] = await Promise.all([
        transaction.visit.findUnique({
          where: { id: data.visitId },
          select: { patientId: true },
        }),
        transaction.labTest.findMany({
          where: { id: { in: data.testIds }, isActive: true },
        }),
      ]);

      if (!visit) {
        throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
      }

      if (tests.length !== new Set(data.testIds).size) {
        throw new ApiError(
          400,
          'LAB_TESTS_UNAVAILABLE',
          'One or more selected lab tests are unavailable'
        );
      }

      const request = await transaction.labRequest.create({
        data: {
          visitId: data.visitId,
          requestedBy: data.requestedBy,
          priority: data.priority || 'ROUTINE',
          status: 'PENDING',
          notes: data.notes,
          items: {
            create: tests.map((test) => ({ testId: test.id })),
          },
        },
        include: {
          items: {
            include: { test: true },
          },
          visit: {
            include: {
              patient: true,
            },
          },
        },
      });

      let invoice = await transaction.invoice.findUnique({
        where: { visitId: data.visitId },
      });

      if (!invoice) {
        invoice = await transaction.invoice.create({
          data: {
            invoiceNo: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID()}`,
            patientId: visit.patientId,
            visitId: data.visitId,
            subtotal: 0,
            discount: 0,
            total: 0,
            balance: 0,
            paidAmount: 0,
          },
        });
      }

      const labSubtotal = tests.reduce(
        (total, test) => total.add(test.price),
        new Prisma.Decimal(0)
      );
      await transaction.invoiceItem.createMany({
        data: tests.map((test) => ({
          invoiceId: invoice.id,
          description: test.name,
          category: 'LAB_TEST',
          quantity: 1,
          unitPrice: test.price,
          subtotal: test.price,
          reference: test.id,
        })),
      });

      const subtotal = invoice.subtotal.add(labSubtotal);
      const total = subtotal.minus(invoice.discount);
      const balance = total.minus(invoice.paidAmount);
      await transaction.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal,
          total,
          balance,
          status: balance.toNumber() <= 0
            ? 'PAID'
            : invoice.paidAmount.toNumber() > 0
              ? 'PARTIAL'
              : 'UNPAID',
        },
      });

      return request;
    });

    logger.info(`Lab request created: ${labRequest.id}`);
    return labRequest;
  } catch (error: unknown) {
    logRepositoryError('Error creating lab request', error);
    throw error;
  }
};

export const getLabRequestById = async (id: string) => {
  try {
    const labRequest = await prisma.labRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            test: true,
          },
        },
        results: {
          include: {
            test: true,
          },
        },
      },
    });

    if (!labRequest) {
      const error = new Error('Lab request not found');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return labRequest;
  } catch (error: unknown) {
    logRepositoryError('Error fetching lab request', error);
    throw error;
  }
};

export const getLabRequestsByPatient = async (patientId: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const [requests, total] = await Promise.all([
      prisma.labRequest.findMany({
        where: {
          visit: {
            patient: {
              id: patientId,
            },
          },
        },
        include: {
          items: {
            include: {
              test: true,
            },
          },
          results: true,
        },
        skip,
        take,
        orderBy: { requestedAt: 'desc' },
      }),
      prisma.labRequest.count({
        where: {
          visit: {
            patient: {
              id: patientId,
            },
          },
        },
      }),
    ]);

    return {
      data: requests,
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: unknown) {
    logRepositoryError('Error fetching patient lab requests', error);
    throw error;
  }
};

export const getLabRequestsByVisit = async (visitId: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const [requests, total] = await Promise.all([
      prisma.labRequest.findMany({
        where: { visitId },
        include: {
          items: {
            include: {
              test: true,
            },
          },
          results: { include: { test: true } },
          visit: {
            include: {
              patient: true,
            },
          },
        },
        skip,
        take,
        orderBy: { requestedAt: 'desc' },
      }),
      prisma.labRequest.count({ where: { visitId } }),
    ]);

    return {
      data: requests,
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: unknown) {
    logRepositoryError('Error fetching lab requests for visit', error);
    throw error;
  }
};

export const getAllLabRequests = async (status?: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const where: Prisma.LabRequestWhereInput = {};
    if (status) {
      if (!Object.values(LabStatus).includes(status as LabStatus)) {
        throw new Error(`Invalid laboratory request status: ${status}`);
      }
      where.status = status as LabStatus;
    }

    const [requests, total] = await Promise.all([
      prisma.labRequest.findMany({
        where,
        include: {
          items: {
            include: {
              test: true,
            },
          },
          results: { include: { test: true } },
          visit: {
            include: {
              patient: true,
            },
          },
        },
        skip,
        take,
        orderBy: { requestedAt: 'desc' },
      }),
      prisma.labRequest.count({ where }),
    ]);

    return {
      data: requests,
      total,
      limit: take,
      offset: skip,
    };

  } catch (error: unknown) {
    logRepositoryError('Error fetching all lab requests', error);
    throw error;
  }
};

export const getLabDashboardStats = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [pending, processing, completedToday, totalToday] = await Promise.all([
    prisma.labRequest.count({ where: { status: 'PENDING' } }),
    prisma.labRequest.count({ where: { status: 'PROCESSING' } }),
    prisma.labRequest.count({
      where: {
        status: { in: ['COMPLETED', 'REVIEWED'] },
        requestedAt: { gte: startOfToday },
      },
    }),
    prisma.labRequest.count({ where: { requestedAt: { gte: startOfToday } } }),
  ]);

  return {
    pending,
    processing,
    completedToday,
    totalToday,
    completionRate: totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100),
  };
};

export const updateLabRequestStatus = async (
  id: string,
  status: UpdateLabRequestStatusInput['status'],
  notes?: string
) => {
  try {
    const labRequest = await prisma.labRequest.update({
      where: { id },
      data: {
        status,
        notes: notes || undefined,
      },
      include: {
        items: {
          include: {
            test: true,
          },
        },
      },
    });

    logger.info(`Lab request ${id} status updated to ${status}`);
    return labRequest;
  } catch (error: unknown) {
    logRepositoryError('Error updating lab request status', error);
    throw error;
  }
};

export const addLabResult = async (
  requestId: string,
  testId: string,
  data: Omit<AddLabResultInput, 'testId'>
) => {
  try {
    const labResult = await prisma.labResult.create({
      data: {
        requestId,
        testId,
        processedBy: data.processedBy,
        value: data.value,
        unit: data.unit,
        interpretation: data.interpretation,
        isCritical: data.isCritical || false,
      },
      include: {
        test: true,
      },
    });

    logger.info(`Lab result added to request ${requestId}`);
    return labResult;
  } catch (error: unknown) {
    logRepositoryError('Error adding lab result', error);
    throw error;
  }
};
