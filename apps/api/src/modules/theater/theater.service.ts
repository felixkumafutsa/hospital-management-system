import { Prisma, PrismaClient, VisitStatus } from '@prisma/client';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { ApiError } from '../../middlewares/errorHandler';
import * as theaterValidator from './theater.validator';

const prisma = new PrismaClient();
type SurgicalRequestInput = z.infer<typeof theaterValidator.createSurgicalProcedure>;
type MaternitySurgicalRequestInput = z.infer<typeof theaterValidator.createMaternitySurgicalRequest>;
type CatalogInput = z.infer<typeof theaterValidator.createProcedureCatalog>;
type ProcedureUpdateInput = z.infer<typeof theaterValidator.updateSurgicalProcedure>;
type TheaterInput = z.infer<typeof theaterValidator.createTheater>;

export const createProcedureCatalog = async (data: CatalogInput) => {
  return prisma.procedureCatalog.create({ data });
};

export const getProcedureCatalog = async () => prisma.procedureCatalog.findMany({
  where: { isActive: true },
  orderBy: { name: 'asc' },
});

export const updateProcedureCatalog = async (id: string, data: Partial<CatalogInput>) => {
  return prisma.procedureCatalog.update({ where: { id }, data });
};

export const createTheater = async (data: TheaterInput) => prisma.theater.create({ data });

export const updateTheater = async (
  id: string,
  data: z.infer<typeof theaterValidator.updateTheater>,
) => prisma.theater.update({ where: { id }, data });

export const getTheaterResources = async () => {
  const [theaters, surgeons, anesthetists] = await Promise.all([
    prisma.theater.findMany({ where: { isAvailable: true }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: { isActive: true, role: { name: { in: ['DOCTOR', 'MD'] } } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: { select: { name: true } },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { name: 'ANESTHETIST' } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: { select: { name: true } },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
  ]);
  return { theaters, surgeons, anesthetists };
};

export const createSurgicalProcedure = async (data: SurgicalRequestInput) => {
  const [visit, catalog] = await Promise.all([
    prisma.visit.findUnique({ where: { id: data.visitId } }),
    prisma.procedureCatalog.findFirst({ where: { id: data.catalogId, isActive: true } }),
  ]);
  if (!visit || ['COMPLETED', 'CANCELLED'].includes(visit.status)) {
    throw new ApiError(404, 'An active visit is required for a theater request', 'VISIT_NOT_FOUND');
  }
  if (!catalog) {
    throw new ApiError(404, 'Active procedure catalog item not found', 'PROCEDURE_NOT_FOUND');
  }
  if (data.maternityProfileId) {
    const profile = await prisma.maternityProfile.findUnique({
      where: { id: data.maternityProfileId },
    });
    if (!profile || profile.patientId !== visit.patientId) {
      throw new ApiError(400, 'Maternity profile does not belong to this visit patient', 'INVALID_MATERNITY_PROFILE');
    }
  }
  const existing = await prisma.surgicalProcedure.findUnique({ where: { visitId: data.visitId } });
  if (existing) {
    throw new ApiError(409, 'This visit already has a theater case', 'THEATER_CASE_EXISTS');
  }

  const procedure = await prisma.surgicalProcedure.create({
    data: {
      visitId: data.visitId,
      catalogId: catalog.id,
      maternityProfileId: data.maternityProfileId,
      procedureName: catalog.name,
      procedureDate: new Date(data.procedureDate),
      notes: data.notes,
      status: 'REQUESTED',
    },
    include: {
      catalog: true,
      surgeon: { select: { firstName: true, lastName: true } },
      anesthetist: { select: { firstName: true, lastName: true } },
      visit: { include: { patient: true } },
    },
  });
  await prisma.visit.update({
    where: { id: visit.id },
    data: { status: VisitStatus.AWAITING_SURGERY },
  });
  return procedure;
};

export const createMaternitySurgicalRequest = async (
  data: MaternitySurgicalRequestInput,
  createdBy: string,
) => {
  return prisma.$transaction(async (transaction) => {
    const [profile, catalog] = await Promise.all([
      transaction.maternityProfile.findFirst({
        where: { id: data.maternityProfileId, status: 'ACTIVE' },
      }),
      transaction.procedureCatalog.findFirst({
        where: { id: data.catalogId, isActive: true },
      }),
    ]);
    if (!profile) throw new ApiError(404, 'Active pregnancy profile not found', 'MATERNITY_PROFILE_NOT_FOUND');
    if (!catalog) throw new ApiError(404, 'Active procedure catalog item not found', 'PROCEDURE_NOT_FOUND');
    if (!catalog.isMaternityDelivery) {
      throw new ApiError(400, 'Select a procedure catalog item marked for maternity delivery', 'INVALID_MATERNITY_PROCEDURE');
    }

    const visit = await transaction.visit.create({
      data: {
        patientId: profile.patientId,
        createdBy,
        visitType: 'DELIVERY',
        status: VisitStatus.AWAITING_SURGERY,
        reasonForVisit: `Planned ${catalog.name}`,
        invoice: {
          create: {
            invoiceNo: `MAT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID()}`,
            patientId: profile.patientId,
            subtotal: 0,
            discount: 0,
            total: 0,
            balance: 0,
            paidAmount: 0,
          },
        },
      },
    });
    return transaction.surgicalProcedure.create({
      data: {
        visitId: visit.id,
        catalogId: catalog.id,
        maternityProfileId: profile.id,
        procedureName: catalog.name,
        procedureDate: new Date(data.procedureDate),
        notes: data.notes,
        status: 'REQUESTED',
      },
      include: { catalog: true, visit: { include: { patient: true } } },
    });
  });
};

export const getAllSurgicalProcedures = async () => prisma.surgicalProcedure.findMany({
  include: {
    catalog: true,
    theater: true,
    surgeon: { select: { firstName: true, lastName: true } },
    anesthetist: { select: { firstName: true, lastName: true } },
    visit: {
      include: {
        patient: {
          select: { firstName: true, lastName: true, patientNumber: true },
        },
      },
    },
  },
  orderBy: { procedureDate: 'asc' },
});

export const getSurgicalProcedureById = async (id: string) => {
  const procedure = await prisma.surgicalProcedure.findUnique({
    where: { id },
    include: {
      catalog: true,
      theater: true,
      surgeon: { select: { firstName: true, lastName: true } },
      anesthetist: { select: { firstName: true, lastName: true } },
      visit: { include: { patient: true } },
    },
  });
  if (!procedure) throw new ApiError(404, 'Theater case not found', 'NOT_FOUND');
  return procedure;
};

const validateSchedule = async (
  procedureId: string,
  theaterId: string,
  surgeonId: string,
  anesthetistId: string,
  procedureDate: Date,
  durationMinutes: number,
) => {
  const [theater, team] = await Promise.all([
    prisma.theater.findFirst({ where: { id: theaterId, isAvailable: true } }),
    prisma.user.findMany({
      where: {
        id: surgeonId,
        isActive: true,
        role: { name: { in: ['DOCTOR', 'MD'] } },
      },
      select: { id: true },
    }),
  ]);
  if (!theater) throw new ApiError(400, 'Selected theater is unavailable', 'THEATER_UNAVAILABLE');
  const anesthetist = await prisma.user.findFirst({
    where: { id: anesthetistId, isActive: true, role: { name: 'ANESTHETIST' } },
    select: { id: true },
  });
  if (team.length !== 1 || !anesthetist || surgeonId === anesthetistId) {
    throw new ApiError(400, 'Select an active doctor as surgeon and a different active anesthetist', 'INVALID_SURGICAL_TEAM');
  }

  const scheduledEnd = new Date(procedureDate.getTime() + durationMinutes * 60_000);
  const candidates = await prisma.surgicalProcedure.findMany({
    where: {
      id: { not: procedureId },
      theaterId,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      procedureDate: {
        gte: new Date(procedureDate.getTime() - 24 * 60 * 60_000),
        lt: scheduledEnd,
      },
    },
    include: { catalog: { select: { durationMinutes: true } } },
  });
  const overlaps = candidates.some((candidate) => {
    const candidateEnd = new Date(
      candidate.procedureDate.getTime() + (candidate.catalog?.durationMinutes ?? 60) * 60_000,
    );
    return procedureDate < candidateEnd && scheduledEnd > candidate.procedureDate;
  });
  if (overlaps) throw new ApiError(409, 'The selected theater already has a procedure in this time slot', 'THEATER_SLOT_CONFLICT');
};

const addProcedureInvoiceItem = async (
  transaction: Prisma.TransactionClient,
  visitId: string,
  patientId: string,
  procedureId: string,
  procedureName: string,
  fee: Prisma.Decimal,
) => {
  let invoice = await transaction.invoice.findUnique({ where: { visitId } });
  if (!invoice) {
    invoice = await transaction.invoice.create({
      data: {
        invoiceNo: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID()}`,
        patientId,
        visitId,
        subtotal: 0,
        discount: 0,
        total: 0,
        balance: 0,
        paidAmount: 0,
      },
    });
  }

  const billedItem = await transaction.invoiceItem.findFirst({
    where: { invoiceId: invoice.id, reference: procedureId, category: 'PROCEDURE' },
  });
  if (!billedItem) {
    await transaction.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: procedureName,
        category: 'PROCEDURE',
        quantity: 1,
        unitPrice: fee,
        subtotal: fee,
        reference: procedureId,
      },
    });
  }
  const items = await transaction.invoiceItem.findMany({ where: { invoiceId: invoice.id } });
  const subtotal = items.reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));
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
};

export const updateSurgicalProcedure = async (id: string, data: ProcedureUpdateInput) => {
  const existing = await prisma.surgicalProcedure.findUnique({
    where: { id },
    include: { catalog: true, visit: true },
  });
  if (!existing) throw new ApiError(404, 'Theater case not found', 'NOT_FOUND');

  const nextStatus = data.status ?? existing.status;
  const allowedTransitions: Record<string, string[]> = {
    REQUESTED: ['SCHEDULED', 'CANCELLED'],
    SCHEDULED: ['SCHEDULED', 'IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  };
  if (data.status && !allowedTransitions[existing.status]?.includes(data.status)) {
    throw new ApiError(409, `Cannot change a ${existing.status} case to ${data.status}`, 'INVALID_THEATER_TRANSITION');
  }

  if (nextStatus !== 'SCHEDULED') {
    const updated = await prisma.surgicalProcedure.update({
      where: { id },
      data: {
        status: nextStatus,
        procedureDate: data.procedureDate ? new Date(data.procedureDate) : undefined,
        theaterId: data.theaterId,
        surgeonId: data.surgeonId,
        anesthetistId: data.anesthetistId,
        notes: data.notes,
      },
      include: {
        catalog: true,
        theater: true,
        surgeon: { select: { firstName: true, lastName: true } },
        anesthetist: { select: { firstName: true, lastName: true } },
        visit: { include: { patient: true } },
      },
    });
    if (nextStatus === 'IN_PROGRESS') {
      await prisma.visit.update({ where: { id: existing.visitId }, data: { status: VisitStatus.AWAITING_SURGERY } });
    } else if (nextStatus === 'COMPLETED') {
      await prisma.visit.update({
        where: { id: existing.visitId },
        data: { status: existing.maternityProfileId ? VisitStatus.MATERNITY : VisitStatus.COMPLETED },
      });
    } else if (nextStatus === 'CANCELLED') {
      await prisma.visit.update({ where: { id: existing.visitId }, data: { status: VisitStatus.REGISTERED } });
    }
    return updated;
  }

  const theaterId = data.theaterId ?? existing.theaterId;
  const surgeonId = data.surgeonId ?? existing.surgeonId;
  const anesthetistId = data.anesthetistId ?? existing.anesthetistId;
  const procedureDate = data.procedureDate ? new Date(data.procedureDate) : existing.procedureDate;
  const catalogId = data.catalogId ?? existing.catalogId;
  if (!theaterId || !surgeonId || !anesthetistId || !catalogId) {
    throw new ApiError(400, 'A catalog item, date, theater, surgeon, and anesthetist are required to schedule', 'INCOMPLETE_SCHEDULE');
  }
  const catalog = await prisma.procedureCatalog.findFirst({
    where: { id: catalogId, isActive: true },
  });
  if (!catalog) throw new ApiError(404, 'Active procedure catalog item not found', 'PROCEDURE_NOT_FOUND');
  await validateSchedule(id, theaterId, surgeonId, anesthetistId, procedureDate, catalog.durationMinutes);

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.surgicalProcedure.update({
      where: { id },
      data: {
        catalogId: catalog.id,
        procedureName: catalog.name,
        procedureFee: catalog.price,
        procedureDate,
        theaterId,
        surgeonId,
        anesthetistId,
        notes: data.notes,
        status: 'SCHEDULED',
      },
      include: {
        catalog: true,
        theater: true,
        surgeon: { select: { firstName: true, lastName: true } },
        anesthetist: { select: { firstName: true, lastName: true } },
        visit: { include: { patient: true } },
      },
    });
    await addProcedureInvoiceItem(
      transaction,
      updated.visitId,
      existing.visit.patientId,
      updated.id,
      catalog.name,
      catalog.price,
    );
    await transaction.visit.update({
      where: { id: updated.visitId },
      data: { status: VisitStatus.AWAITING_SURGERY },
    });
    return updated;
  });
};
