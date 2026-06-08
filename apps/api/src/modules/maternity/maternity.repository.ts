import { prisma } from '../../config/database';
import type { CreateAncInput, CreateDeliveryInput, CreatePostnatalInput } from '@packages/types';

// ANC (Antenatal Care) operations
export const createAncRecord = async (data: CreateAncInput & { recordedBy: string }) => {
  return prisma.ancRecord.create({
    data: {
      ...data,
    },
    include: {
      patient: true
    }
  });
};

export const findAncRecordById = async (id: string) => {
  return prisma.ancRecord.findUnique({
    where: { id },
    include: {
      patient: true
    }
  });
};

export const findAncRecordsByPatient = async (patientId: string) => {
  return prisma.ancRecord.findMany({
    where: { patientId },
    orderBy: { visitDate: 'desc' },
    include: {
      patient: true
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
        patient: true
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
      patient: true
    }
  });
};

// Delivery Record operations
export const createDeliveryRecord = async (data: CreateDeliveryInput & { attendedBy: string }) => {
  return prisma.deliveryRecord.create({
    data: {
      ...data,
    },
    include: {
      patient: true,
      postnatalRecords: true
    }
  });
};

export const findDeliveryRecordById = async (id: string) => {
  return prisma.deliveryRecord.findUnique({
    where: { id },
    include: {
      patient: true,
      postnatalRecords: true
    }
  });
};

export const findDeliveryRecordsByPatient = async (patientId: string) => {
  return prisma.deliveryRecord.findMany({
    where: { patientId },
    orderBy: { deliveryDate: 'desc' },
    include: {
      patient: true,
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
        patient: true
      }
    }),
    prisma.deliveryRecord.count()
  ]);
  
  return { records, total };
};

// Postnatal Record operations
export const createPostnatalRecord = async (data: CreatePostnatalInput & { recordedBy: string }) => {
  return prisma.postnatalRecord.create({
    data: {
      ...data,
    },
    include: {
      patient: true,
      delivery: true
    }
  });
};

export const findPostnatalRecordById = async (id: string) => {
  return prisma.postnatalRecord.findUnique({
    where: { id },
    include: {
      patient: true,
      delivery: true
    }
  });
};

export const findPostnatalRecordsByPatient = async (patientId: string) => {
  return prisma.postnatalRecord.findMany({
    where: { patientId },
    orderBy: { visitDate: 'desc' },
    include: {
      patient: true,
      delivery: true
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
        patient: true
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
    // Count active pregnancies (patients who have ANC but no delivery yet)
    prisma.patient.count({
      where: {
        ancRecords: { some: {} },
        deliveryRecords: { none: {} }
      }
    })
  ]);

  return {
    ancThisMonth,
    deliveriesThisMonth,
    postnatalThisMonth,
    activePregnancies: totalActivePregnancies
  };
};
