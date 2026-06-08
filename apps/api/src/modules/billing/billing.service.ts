import logger from '../../config/logger';
import * as billingRepository from './billing.repository';
import {
  CreateInvoiceInput,
  CreatePaymentInput,
} from './billing.validator';

export const createNewInvoice = async (data: CreateInvoiceInput) => {
  try {
    const invoice = await billingRepository.createInvoice(data);

    return {
      success: true,
      data: invoice,
    };
  } catch (error: any) {
    logger.error(`Service error creating invoice: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create invoice',
    };
  }
};

export const getInvoice = async (id: string) => {
  try {
    const invoice = await billingRepository.getInvoiceById(id);

    return {
      success: true,
      data: invoice,
    };
  } catch (error: any) {
    logger.error(`Service error fetching invoice: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch invoice',
    };
  }
};

export const getPatientInvoices = async (patientId: string, limit?: number, offset?: number) => {
  try {
    const result = await billingRepository.getInvoicesByPatient(patientId, limit, offset);

    return {
      success: true,
      data: result.data,
      pagination: {
        limit: result.limit,
        offset: result.offset,
        total: result.total,
      },
    };
  } catch (error: any) {
    logger.error(`Service error fetching patient invoices: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch patient invoices',
    };
  }
};

export const listAllInvoices = async (status?: string, limit?: number, offset?: number) => {
  try {
    const result = await billingRepository.getAllInvoices(status, limit, offset);

    return {
      success: true,
      data: result.data,
      pagination: {
        limit: result.limit,
        offset: result.offset,
        total: result.total,
      },
    };
  } catch (error: any) {
    logger.error(`Service error listing invoices: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to list invoices',
    };
  }
};

export const recordNewPayment = async (invoiceId: string, data: CreatePaymentInput) => {
  try {
    const payment = await billingRepository.recordPayment(invoiceId, data);

    return {
      success: true,
      data: payment,
    };
  } catch (error: any) {
    logger.error(`Service error recording payment: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to record payment',
    };
  }
};

export const getFinanceStats = async () => {
  try {
    const stats = await billingRepository.getFinancialStats();

    return {
      success: true,
      data: stats,
    };
  } catch (error: any) {
    logger.error(`Service error fetching finance stats: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch finance stats',
    };
  }
};

export const getMonthlyRevenue = async () => {
  try {
    const revenueData = await billingRepository.getRevenueData();

    return {
      success: true,
      data: revenueData,
    };
  } catch (error: any) {
    logger.error(`Service error fetching revenue data: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch revenue data',
    };
  }
};

export const getLatestInvoices = async (limit?: number) => {
  try {
    const invoices = await billingRepository.getRecentInvoices(limit || 10);

    return {
      success: true,
      invoices,
    };
  } catch (error: any) {
    logger.error(`Service error fetching recent invoices: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch recent invoices',
    };
  }
};
