import { prisma } from '../../config/database';
import { VisitType, VisitStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { CreateAncInput, CreateDeliveryInput, CreatePostnatalInput } from '@packages/types';

// Maternity Profile operations
export const createMaternityProfile = async (data: {
  patientId: string;
  lastMenstrualPeriod?: Date;
  estimatedDueDate?: Date;
  gravida?: number;
  parity?: number;
}) => {
  return prisma.maternityProfile.create({ data });
};

export const findMaternityProfileByPatientId = async (patientId: string) => {
  return prisma.maternityProfile.findFirst({
    where: { patientId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
};

export const findMaternityRecordsByPatientId = async (patientId: string) => {
  return prisma.maternityProfile.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      ancRecords: { orderBy: { visitDate: 'desc' } },
      deliveryRecords: { orderBy: { deliveryDate: 'desc' } },
      postnatalRecords: { orderBy: { visitDate: 'desc' } },
    },
  });
};

export const updateMaternityProfile = async (
  id: string,
  data: {
    lastMenstrualPeriod?: Date;
    estimatedDueDate?: Date;
    gravida?: number;
    parity?: number;
    status?: 'ACTIVE' | 'DELIVERED' | 'CLOSED';
  }
) => prisma.maternityProfile.update({ where: { id }, data });

export const createMaternityVisit = async (
  patientId: string,
  createdBy: string,
  visitType: VisitType,
  reasonForVisit: string
) => prisma.visit.create({
  data: {
    patientId,
    createdBy,
    visitType,
    reasonForVisit,
    status: VisitStatus.REGISTERED,
    invoice: {
      create: {
        invoiceNo: `MAT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID()}`,
        patientId,
        subtotal: 0,
        discount: 0,
        total: 0,
        balance: 0,
        paidAmount: 0,
      },
    },
  },
});

export const completeMaternityVisit = async (visitId: string) => prisma.visit.update({
  where: { id: visitId },
  data: { status: VisitStatus.COMPLETED },
});

export const findCompletedTheaterVisitForProfile = async (maternityProfileId: string) => {
  return prisma.surgicalProcedure.findFirst({
    where: { maternityProfileId, status: 'COMPLETED' },
    orderBy: { procedureDate: 'desc' },
    select: { visitId: true },
  });
};

// ANC (Antenatal Care) operations
export const createAncRecord = async (data: Omit<CreateAncInput, 'patientId'> & {
  recordedBy: string;
  maternityProfileId: string;
  visitId: string;
}) => {
  const { maternityProfileId, ...ancData } = data;
  return prisma.ancRecord.create({
    data: {
      ...ancData,
      maternityProfileId,
    },
    include: {
      maternityProfile: {
        include: {
          patient: true,
        },
      },
    }
  });
};

export const findAncRecordById = async (id: string) => {
  return prisma.ancRecord.findUnique({
    where: { id },
    include: {
      maternityProfile: {
        include: {
          patient: true,
        },
      },
    }
  });
};

export const findAncRecordsByMaternityProfile = async (maternityProfileId: string) => {
  return prisma.ancRecord.findMany({
    where: { maternityProfileId },
    orderBy: { visitDate: 'desc' },
    include: {
      maternityProfile: {
        include: {
          patient: true,
        },
      },
    }
  });
};

export const getAllAncRecords = async (skip: number, take: number) => {
  const [records, total] = await Promise.all([
    prisma.ancRecord.findMany({
      skip,
      take,
      orderBy: { visitDate: 'desc' },
      include: {
        maternityProfile: {
          include: {
            patient: true,
          },
        },
      }
    }),
    prisma.ancRecord.count()
  ]);
  
  return { records, total };
};

export const updateAncRecord = async (id: string, data: Partial<CreateAncInput>) => {
  return prisma.ancRecord.update({
    where: { id },
    data,
    include: {
      maternityProfile: {
        include: {
          patient: true,
        },
      },
    }
  });
};

// Delivery Record operations
export const createDeliveryRecord = async (data: Omit<CreateDeliveryInput, 'patientId'> & {
  attendedBy: string;
  maternityProfileId: string;
  visitId: string;
}) => {
  const { maternityProfileId, ...deliveryData } = data;
  return prisma.deliveryRecord.create({
    data: {
      ...deliveryData,
      maternityProfileId,
    },
    include: {
      maternityProfile: {
        include: {
          patient: true,
        },
      },
      postnatalRecords: true
    }
  });
};

export const findDeliveryRecordById = async (id: string) => {
  return prisma.deliveryRecord.findUnique({
    where: { id },
    include: {
      maternityProfile: {
        include: {
          patient: true,
        },
      },
      postnatalRecords: true
    }
  });
};

export const findDeliveryRecordsByMaternityProfile = async (maternityProfileId: string) => {
  return prisma.deliveryRecord.findMany({
    where: { maternityProfileId },
    orderBy: { deliveryDate: 'desc' },
    include: {
      maternityProfile: {
        include: {
          patient: true,
        },
      },
      postnatalRecords: true
    }
  });
};

export const getAllDeliveryRecords = async (skip: number, take: number) => {
  const [records, total] = await Promise.all([
    prisma.deliveryRecord.findMany({
      skip,
      take,
      orderBy: { deliveryDate: 'desc' },
      include: {
        maternityProfile: {
          include: {
            patient: true,
          },
        },
        postnatalRecords: true
      }
    }),
    prisma.deliveryRecord.count()
  ]);
  
  return { records, total };
};

// Postnatal Record operations
export const createPostnatalRecord = async (data: Omit<CreatePostnatalInput, 'patientId'> & {
  recordedBy: string;
  maternityProfileId: string;
  visitId: string;
}) => {
  const { maternityProfileId, deliveryId, ...postnatalData } = data;
  return prisma.postnatalRecord.create({
    data: {
      ...postnatalData,
      visitId: data.visitId,
      maternityProfileId,
      deliveryId,
    },
    include: {
      maternityProfile: {
        include: {
          patient: true,
        },
      },
      delivery: true,
    }
  });
};

export const findPostnatalRecordById = async (id: string) => {
  return prisma.postnatalRecord.findUnique({
    where: { id },
    include: {
      maternityProfile: {
        include: {
          patient: true,
        },
      },
      delivery: true,
    }
  });
};

export const findPostnatalRecordsByMaternityProfile = async (maternityProfileId: string) => {
  return prisma.postnatalRecord.findMany({
    where: { maternityProfileId },
    orderBy: { visitDate: 'desc' },
    include: {
      maternityProfile: {
        include: {
          patient: true,
        },
      },
      delivery: true,
    }
  });
};

export const getAllPostnatalRecords = async (skip: number, take: number) => {
  const [records, total] = await Promise.all([
    prisma.postnatalRecord.findMany({
      skip,
      take,
      orderBy: { visitDate: 'desc' },
      include: {
        maternityProfile: {
          include: {
            patient: true,
          },
        },
        delivery: true,
      }
    }),
    prisma.postnatalRecord.count()
  ]);
  
  return { records, total };
};

// Get maternity statistics for dashboard
export const getMaternityStats = async () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [ancThisMonth, deliveriesThisMonth, postnatalThisMonth, totalActivePregnancies] = await Promise.all([
    prisma.ancRecord.count({
      where: {
        visitDate: { gte: startOfMonth }
      }
    }),
    prisma.deliveryRecord.count({
      where: {
        deliveryDate: { gte: startOfMonth }
      }
    }),
    prisma.postnatalRecord.count({
      where: {
        visitDate: { gte: startOfMonth }
      }
    }),
    prisma.maternityProfile.count({
      where: { status: 'ACTIVE' },
    })
  ]);

  return {
    ancThisMonth,
    deliveriesThisMonth,
    postnatalThisMonth,
    activePregnancies: totalActivePregnancies
  };
};
