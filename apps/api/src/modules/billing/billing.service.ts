import {
  addInvoiceItem,
  appendInvoiceItemToVisit as appendInvoiceItemToVisitRepo,
  createInvoice,
  getAllInvoices,
  getFinancialStats,
  getInvoiceById,
  getInvoiceByVisitId,
  findInvoiceByVisitId,
  getInvoicesByPatient,
  getRecentInvoices,
  getRevenueData,
  recordPayment,
} from './billing.repository';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { CreateInvoiceInput, CreatePaymentInput } from './billing.validator';
import { ApiError } from '../../middlewares/errorHandler';
import { findVisitById } from '../visit/visit.repository';
import { getConsultationFee } from '../settings/settings.repository';
import { findConsultationByVisitId } from '../consultations/consultation.repository';

export const createNewInvoice = async (data: CreateInvoiceInput) => {
  const { patientId, visitId, items, notes, discount } = data;

  const visit = await findVisitById(visitId);
  if (!visit) {
    throw new ApiError(404, 'VISIT_NOT_FOUND', 'Visit not found');
  }
  if (visit.patientId !== patientId) {
    throw new ApiError(400, 'VISIT_PATIENT_MISMATCH', 'The selected visit does not belong to this patient');
  }

  const consultation = await findConsultationByVisitId(visitId);
  const consultationFee = consultation?.consultationFee != null
    ? Number(consultation.consultationFee)
    : await getConsultationFee();
  const pricedItems = items.map((item) => {
    if (item.category !== 'CONSULTATION') return item;
    if (!consultationFee) {
      throw new ApiError(409, 'CONSULTATION_FEE_NOT_CONFIGURED', 'Set the consultation fee in system settings before billing consultations');
    }
    return { ...item, unitPrice: consultationFee };
  });

  const existingInvoice = await findInvoiceByVisitId(visitId);
  if (existingInvoice) {
    const invoiceWithItems = await getInvoiceById(existingInvoice.id);
    for (const item of pricedItems) {
      const alreadyBilled = invoiceWithItems.items.some((existingItem) => {
        if (item.reference) {
          return existingItem.category === item.category && existingItem.reference === item.reference;
        }

        return item.category === 'CONSULTATION'
          && existingItem.category === item.category
          && existingItem.description === item.description
          && existingItem.quantity === item.quantity
          && existingItem.unitPrice.equals(item.unitPrice);
      });
      if (alreadyBilled) continue;

      await appendVisitInvoiceItem(visitId, {
        ...item,
      });
    }
    return getInvoiceById(existingInvoice.id);
  }

  // Calculate initial subtotal from items
  const subtotal = pricedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountDecimal = discount || 0;
  const total = subtotal - discountDecimal;
  const balance = total;

  const invoice = await createInvoice({
    invoiceNo: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID()}`,
    patient: { connect: { id: patientId } },
    visit: { connect: { id: visitId } },
    subtotal: new Prisma.Decimal(subtotal),
    discount: new Prisma.Decimal(discountDecimal),
    total: new Prisma.Decimal(total),
    balance: new Prisma.Decimal(balance),
    paidAmount: new Prisma.Decimal(0),
    ...(notes && { notes }),
  });

  if (pricedItems.length > 0) {
    for (const item of pricedItems) {
      const subtotal = item.quantity * item.unitPrice;
      await addInvoiceItem(invoice.id, {
        ...item,
        subtotal,
      });
    }
  }

  return getInvoiceById(invoice.id);
};

export const getInvoice = async (id: string) => {
  return getInvoiceById(id);
};

export const getPatientInvoices = async (patientId: string, limit?: number, offset?: number) => {
  return getInvoicesByPatient(patientId, limit, offset);
};

export const getVisitInvoice = async (visitId: string) => {
  return getInvoiceByVisitId(visitId);
};

export const listAllInvoices = async (status?: string, limit?: number, offset?: number) => {
  return getAllInvoices(status, limit, offset);
};

export const recordNewPayment = async (invoiceId: string, data: CreatePaymentInput) => {
  return recordPayment(invoiceId, data);
};

export const getFinanceStats = async () => {
  return getFinancialStats();
};

export const getMonthlyRevenue = async () => {
  return getRevenueData();
};

export const getLatestInvoices = async () => {
  return getRecentInvoices();
};

export const appendVisitInvoiceItem = async (
  visitId: string,
  item: {
    description: string;
    category: 'CONSULTATION' | 'PROCEDURE' | 'LAB_TEST' | 'MEDICATION' | 'OTHER';
    quantity: number;
    unitPrice: number;
    reference?: string;
  }
) => {
  const itemSubtotal = new Prisma.Decimal(item.quantity * item.unitPrice);
  return appendInvoiceItemToVisitRepo(visitId, { ...item, subtotal: itemSubtotal });
};