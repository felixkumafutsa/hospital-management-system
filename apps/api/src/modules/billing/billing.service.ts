import logger from '../../config/logger';
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
  getDepartmentRevenueData,
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
  try {
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
      if (!invoiceWithItems) throw new ApiError(404, 'INVOICE_NOT_FOUND', 'Invoice not found');
      for (const item of pricedItems) {
        const alreadyBilled = invoiceWithItems.items.some(existingItem => {
          const isReferenceMatch = item.reference && existingItem.reference === item.reference;
          const isDetailMatch =
            existingItem.category === item.category &&
            existingItem.description === item.description &&
            existingItem.quantity === item.quantity &&
            existingItem.unitPrice.equals(item.unitPrice);
          return isReferenceMatch || isDetailMatch;
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
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error creating new invoice: ${err.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw {
      statusCode: 500,
      message: err.message || 'Failed to create new invoice',
    };
  }
};

export const getInvoice = async (id: string) => {
  try {
    return await getInvoiceById(id);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching invoice: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch invoice',
    };
  }
};

export const getPatientInvoices = async (patientId: string, limit?: number, offset?: number) => {
  try {
    return await getInvoicesByPatient(patientId, limit, offset);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching patient invoices: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch patient invoices',
    };
  }
};

export const getVisitInvoice = async (visitId: string) => {
  try {
    return await getInvoiceByVisitId(visitId);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching visit invoice: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch visit invoice',
    };
  }
};

export const listAllInvoices = async (status?: string, limit?: number, offset?: number) => {
  try {
    return await getAllInvoices(status, limit, offset);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error listing all invoices: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to list all invoices',
    };
  }
};

export const recordNewPayment = async (invoiceId: string, data: CreatePaymentInput) => {
  try {
    return await recordPayment(invoiceId, data);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error recording new payment: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to record new payment',
    };
  }
};

export const getFinanceStats = async () => {
  try {
    return await getFinancialStats();
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching finance stats: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch finance stats',
    };
  }
};

export const getMonthlyRevenue = async () => {
  try {
    return await getRevenueData();
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching monthly revenue: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch monthly revenue',
    };
  }
};

export const getDepartmentRevenue = async () => {
  try {
    return await getDepartmentRevenueData();
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching department revenue: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch department revenue',
    };
  }
};

export const getLatestInvoices = async () => {
  try {
    return await getRecentInvoices();
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error fetching latest invoices: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to fetch latest invoices',
    };
  }
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
  try {
    const itemSubtotal = new Prisma.Decimal(item.quantity * item.unitPrice);
    return await appendInvoiceItemToVisitRepo(visitId, { ...item, subtotal: itemSubtotal });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Service error appending visit invoice item: ${err.message}`);
    throw {
      statusCode: 500,
      message: err.message || 'Failed to append visit invoice item',
    };
  }
};