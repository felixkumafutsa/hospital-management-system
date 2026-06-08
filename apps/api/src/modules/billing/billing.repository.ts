import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../../config/logger';

const prisma = new PrismaClient();

export const createInvoice = async (data: any) => {
  try {
    const subtotal = data.items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
    const total = subtotal - (data.discount || 0);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: `BL-INV-${new Date().getFullYear()}-${Math.random().toString().slice(2, 8).padStart(6, '0')}`,
        patientId: data.patientId,
        visitId: data.visitId,
        status: 'UNPAID',
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(data.discount || 0),
        total: new Prisma.Decimal(total),
        balance: new Prisma.Decimal(total),
        notes: data.notes,
        items: {
          create: data.items.map((item: any) => ({
            description: item.description,
            category: item.category,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            subtotal: new Prisma.Decimal(item.unitPrice * item.quantity),
            reference: item.reference,
          })),
        },
      },
      include: {
        items: true,
        patient: true,
      },
    });

    logger.info(`Invoice created: ${invoice.id}`);
    return invoice;
  } catch (error: any) {
    logger.error(`Error creating invoice: ${error.message}`);
    throw error;
  }
};

export const getInvoiceById = async (id: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        patient: true,
        payments: true,
      },
    });

    if (!invoice) {
      const error = new Error('Invoice not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return invoice;
  } catch (error: any) {
    logger.error(`Error fetching invoice: ${error.message}`);
    throw error;
  }
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
  } catch (error: any) {
    logger.error(`Error fetching patient invoices: ${error.message}`);
    throw error;
  }
};

export const getAllInvoices = async (status?: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          items: true,
          patient: true,
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
  } catch (error: any) {
    logger.error(`Error fetching all invoices: ${error.message}`);
    throw error;
  }
};

export const recordPayment = async (invoiceId: string, data: any) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      const error = new Error('Invoice not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: new Prisma.Decimal(data.amount),
        method: data.method,
        reference: data.reference,
        receivedBy: data.receivedBy,
        notes: data.notes,
      },
    });

    // Update invoice status and balance
    const newPaidAmount = invoice.paidAmount.add(data.amount);
    const newBalance = invoice.total.minus(newPaidAmount);
    let newStatus = 'UNPAID';

    if (newBalance.toNumber() <= 0) {
      newStatus = 'PAID';
    } else if (newPaidAmount.toNumber() > 0) {
      newStatus = 'PARTIAL';
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus as any,
      },
    });

    logger.info(`Payment recorded for invoice ${invoiceId}`);
    return payment;
  } catch (error: any) {
    logger.error(`Error recording payment: ${error.message}`);
    throw error;
  }
};

export const getFinancialStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [totalRevenue, monthlyRevenue, unpaidInvoices, overallStats] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          receivedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: { status: 'UNPAID' },
      }),
      prisma.invoice.aggregate({
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
  } catch (error: any) {
    logger.error(`Error fetching financial stats: ${error.message}`);
    throw error;
  }
};

export const getRevenueData = async () => {
  try {
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });

      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const result = await prisma.payment.aggregate({
        where: {
          receivedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
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
  } catch (error: any) {
    logger.error(`Error fetching revenue data: ${error.message}`);
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
  } catch (error: any) {
    logger.error(`Error fetching recent invoices: ${error.message}`);
    throw error;
  }
};
