import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../../config/logger';

const prisma = new PrismaClient();

export const createLabTest = async (data: any) => {
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
  } catch (error: any) {
    logger.error(`Error creating lab test: ${error.message}`);
    throw error;
  }
};

export const getLabTestById = async (id: string) => {
  try {
    const labTest = await prisma.labTest.findUnique({
      where: { id },
    });

    if (!labTest) {
      const error = new Error('Lab test not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return labTest;
  } catch (error: any) {
    logger.error(`Error fetching lab test: ${error.message}`);
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
  } catch (error: any) {
    logger.error(`Error fetching all lab tests: ${error.message}`);
    throw error;
  }
};

export const createLabRequest = async (data: any) => {
  try {
    const labRequest = await prisma.labRequest.create({
      data: {
        visitId: data.visitId,
        requestedBy: data.requestedBy,
        priority: data.priority || 'ROUTINE',
        status: 'PENDING',
        notes: data.notes,
        items: {
          create: data.testIds.map((testId: string) => ({
            testId,
          })),
        },
      },
      include: {
        items: {
          include: {
            test: true,
          },
        },
      },
    });

    logger.info(`Lab request created: ${labRequest.id}`);
    return labRequest;
  } catch (error: any) {
    logger.error(`Error creating lab request: ${error.message}`);
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
      (error as any).statusCode = 404;
      throw error;
    }

    return labRequest;
  } catch (error: any) {
    logger.error(`Error fetching lab request: ${error.message}`);
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
  } catch (error: any) {
    logger.error(`Error fetching patient lab requests: ${error.message}`);
    throw error;
  }
};

export const getAllLabRequests = async (status?: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const where: any = {};
    if (status) {
      where.status = status;
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
          results: true,
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
  } catch (error: any) {
    logger.error(`Error fetching all lab requests: ${error.message}`);
    throw error;
  }
};

export const updateLabRequestStatus = async (id: string, status: string, notes?: string) => {
  try {
    const labRequest = await prisma.labRequest.update({
      where: { id },
      data: {
        status: status as any,
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
  } catch (error: any) {
    logger.error(`Error updating lab request status: ${error.message}`);
    throw error;
  }
};

export const addLabResult = async (requestId: string, testId: string, data: any) => {
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
  } catch (error: any) {
    logger.error(`Error adding lab result: ${error.message}`);
    throw error;
  }
};
