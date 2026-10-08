import { Prisma, Invoice, VisitStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import logger from '../../config/logger';
import { CreatePaymentInput } from './billing.validator';

type InvoiceStatus = Invoice['status'];

export const createInvoice = async (data: Prisma.InvoiceCreateInput) => {
  try {
    const invoice = await prisma.invoice.create({
      data,
      include: {
        items: true,
        patient: true,
        visit: true,
        payments: true,
      },
    });

    logger.info(`Invoice created: ${invoice.id}`);
    return invoice;
  } catch (error: unknown) {
    logger.error(`Error creating invoice: ${(error as Error).message}`);
    throw error;
  }
};

export const getInvoiceById = async (invoiceId: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        patient: true,
        visit: true,
        payments: true,
      },
    });

    if (!invoice) {
      const error = new Error('Invoice not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    return invoice;
  } catch (error: unknown) {
    logger.error(`Error fetching invoice: ${(error as Error).message}`);
    throw error;
  }
};

export const getInvoiceByVisitId = async (visitId: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { visitId },
      include: {
        items: true,
        patient: true,
        visit: true,
        payments: true,
      },
    });

    if (!invoice) {
      const error = new Error('Invoice not found for visit') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    return invoice;
  } catch (error: unknown) {
    logger.error(`Error fetching invoice for visit: ${(error as Error).message}`);
    throw error;
  }
};

export const findInvoiceByVisitId = async (visitId: string) => {
  return prisma.invoice.findUnique({
    where: { visitId },
  });
};

export const getInvoicesByPatient = async (patientId: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { patientId },
        include: {
          items: true,
          patient: true,
          visit: true,
          payments: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where: { patientId } }),
    ]);

    return {
      data: invoices,
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: unknown) {
    logger.error(`Error fetching patient invoices: ${(error as Error).message}`);
    throw error;
  }
};

export const getAllInvoices = async (status?: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const where: Prisma.InvoiceWhereInput = {};
    if (status) {
      const validStatuses: InvoiceStatus[] = ['UNPAID', 'PAID', 'PARTIAL', 'VOID'];
      if (validStatuses.includes(status as InvoiceStatus)) {
        where.status = status as InvoiceStatus;
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          items: true,
          patient: true,
          visit: true,
          payments: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: unknown) {
    logger.error(`Error fetching all invoices: ${(error as Error).message}`);
    throw error;
  }
};

export const recordPayment = async (invoiceId: string, data: CreatePaymentInput) => {
  try {
    const payment = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      });
      if (!invoice) {
        const error = new Error('Invoice not found') as Error & { statusCode: number };
        error.statusCode = 404;
        throw error;
      }
      if (invoice.status === 'VOID') {
        const error = new Error('Payments cannot be recorded against a void invoice') as Error & { statusCode: number };
        error.statusCode = 409;
        throw error;
      }

      const paymentAmount = new Prisma.Decimal(data.amount);
      if (paymentAmount.greaterThan(invoice.balance)) {
        const error = new Error('Payment amount cannot exceed the invoice balance') as Error & { statusCode: number };
        error.statusCode = 400;
        throw error;
      }

      const recordedPayment = await tx.payment.create({
        data: {
          invoiceId,
          amount: paymentAmount,
          method: data.method,
          reference: data.reference,
          receivedBy: data.receivedBy,
          notes: data.notes,
        },
      });

      const paymentApplied = await tx.invoice.updateMany({
        where: {
          id: invoiceId,
          status: { not: 'VOID' },
          balance: { gte: paymentAmount },
        },
        data: {
          paidAmount: { increment: paymentAmount },
          balance: { decrement: paymentAmount },
        },
      });
      if (paymentApplied.count !== 1) {
        const error = new Error('Invoice balance changed; refresh and retry the payment') as Error & { statusCode: number };
        error.statusCode = 409;
        throw error;
      }

      const updatedInvoice = await tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
      });
      const newStatus: InvoiceStatus = updatedInvoice.balance.equals(0)
        ? 'PAID'
        : updatedInvoice.paidAmount.greaterThan(0)
          ? 'PARTIAL'
          : 'UNPAID';
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      });
      if (newStatus === 'PAID') {
        if (invoice.visitId) {
          await tx.visit.update({
            where: { id: invoice.visitId },
            data: { status: VisitStatus.AWAITING_PHARMACY },
          });
        }
      }
      return recordedPayment;
    });

    logger.info(`Payment recorded for invoice ${invoiceId}`);
    return payment;
  } catch (error: unknown) {
    logger.error(`Error recording payment: ${(error as Error).message}`);
    throw error;
  }
};

export const getFinancialStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [totalRevenue, monthlyRevenue, unpaidInvoices, overallStats] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          receivedAt: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: { status: 'UNPAID' },
      }),
      prisma.invoice.aggregate({
        where: { status: { not: 'VOID' } },
        _sum: {
          total: true,
          paidAmount: true,
          balance: true,
        },
        _count: true,
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || new Prisma.Decimal(0),
      monthlyRevenue: monthlyRevenue._sum.amount || new Prisma.Decimal(0),
      unpaidInvoicesCount: unpaidInvoices,
      totalInvoices: overallStats._count,
      totalBilled: overallStats._sum.total || new Prisma.Decimal(0),
      totalPaid: overallStats._sum.paidAmount || new Prisma.Decimal(0),
      totalOutstanding: overallStats._sum.balance || new Prisma.Decimal(0),
    };
  } catch (error: unknown) {
    logger.error(`Error fetching financial stats: ${(error as Error).message}`);
    throw error;
  }
};

export const getRevenueData = async () => {
  try {
    const last12Months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });

      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const result = await prisma.payment.aggregate({
        where: {
          receivedAt: {
            gte: startOfMonth,
            lt: startOfNextMonth,
          },
        },
        _sum: { amount: true },
      });

      last12Months.push({
        month,
        revenue: result._sum.amount?.toNumber() || 0,
      });
    }

    return last12Months;
  } catch (error: unknown) {
    logger.error(`Error fetching revenue data: ${(error as Error).message}`);
    throw error;
  }
};

export const getRecentInvoices = async (limit: number = 10) => {
  try {
    const invoices = await prisma.invoice.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        items: true,
      },
    });

    return invoices;
  } catch (error: unknown) {
    logger.error(`Error fetching recent invoices: ${(error as Error).message}`);
    throw error;
  }
};

export const addInvoiceItem = async (invoiceId: string, item: {
  description: string;
  category: 'CONSULTATION' | 'PROCEDURE' | 'LAB_TEST' | 'MEDICATION' | 'OTHER';
  quantity: number;
  unitPrice: number;
  subtotal: number;
}) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      const error = new Error('Invoice not found') as Error & { statusCode: number };
      error.statusCode = 404;
      throw error;
    }

    const invoiceItem = await prisma.invoiceItem.create({
      data: {
        invoiceId,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(item.unitPrice),
        subtotal: new Prisma.Decimal(item.subtotal),
      },
    });

    // Update invoice total
    const updatedItems = await prisma.invoiceItem.findMany({
      where: { invoiceId },
    });
    const newTotal = updatedItems.reduce((sum: Prisma.Decimal, i: { subtotal: Prisma.Decimal }) => sum.add(i.subtotal), new Prisma.Decimal(0));
    const newBalance = newTotal.minus(invoice.paidAmount);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        total: newTotal,
        balance: newBalance,
        subtotal: newTotal, // Update invoice subtotal as well
      },
    });

    logger.info(`Item added to invoice ${invoiceId}`);
    return invoiceItem;
  } catch (error: unknown) {
    logger.error(`Error adding invoice item: ${(error as Error).message}`);
    throw error;
  }
};

export const updateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
      include: {
        items: true,
        patient: true,
        payments: true,
      },
    });

    logger.info(`Invoice ${invoiceId} status updated to ${status}`);
    return invoice;
  } catch (error: unknown) {
    logger.error(`Error updating invoice status: ${(error as Error).message}`);
    throw error;
  }
};

export const deleteInvoice = async (invoiceId: string) => {
  try {
    // First delete all items and payments
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId },
    });
    await prisma.payment.deleteMany({
      where: { invoiceId },
    });

    // Then delete the invoice
    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    logger.info(`Invoice ${invoiceId} deleted`);
    return { success: true };
  } catch (error: unknown) {
    logger.error(`Error deleting invoice: ${(error as Error).message}`);
    throw error;
  }
};

export const appendInvoiceItemToVisit = async (
  visitId: string,
  item: {
    description: string;
    category: 'CONSULTATION' | 'PROCEDURE' | 'LAB_TEST' | 'MEDICATION' | 'OTHER';
    quantity: number;
    unitPrice: number;
    subtotal: Prisma.Decimal;
    reference?: string;
  }
) => {
  return prisma.$transaction(async (transaction) => {
    let invoice = await transaction.invoice.findUnique({ where: { visitId } });
    if (!invoice) {
      const visit = await transaction.visit.findUnique({
        where: { id: visitId },
        select: { patientId: true },
      });
      if (!visit) {
        const error = new Error('Visit not found') as Error & { statusCode: number };
        error.statusCode = 404;
        throw error;
      }

      invoice = await transaction.invoice.create({
        data: {
          invoiceNo: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID()}`,
          patientId: visit.patientId,
          visitId,
          subtotal: 0,
          discount: 0,
          total: 0,
          balance: 0,
          paidAmount: 0,
        },
      });
    }

    await transaction.invoiceItem.create({
      data: { ...item, invoiceId: invoice.id },
    });

    const subtotal = invoice.subtotal.add(item.subtotal);
    const total = subtotal.minus(invoice.discount);
    const balance = total.minus(invoice.paidAmount);
    const status: InvoiceStatus = balance.toNumber() <= 0
      ? 'PAID'
      : invoice.paidAmount.toNumber() > 0
        ? 'PARTIAL'
        : 'UNPAID';

    return transaction.invoice.update({
      where: { id: invoice.id },
      data: { subtotal, total, balance, status },
      include: { items: true, patient: true, payments: true },
    });
  });
};
