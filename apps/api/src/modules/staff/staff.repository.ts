import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import logger from '../../config/logger';

const prisma = new PrismaClient();

export const createStaff = async (data: any) => {
  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      const error = new Error('Email already in use');
      (error as any).statusCode = 400;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Generate staff ID
    const staffCount = await prisma.user.count();
    const staffId = `BL-STF-${String(staffCount + 1).padStart(3, '0')}`;

    const user = await prisma.user.create({
      data: {
        staffId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        passwordHash: hashedPassword,
        roleId: data.roleId,
      },
      include: {
        role: true,
      },
    });

    logger.info(`Staff member created: ${user.id}`);
    return {
      id: user.id,
      staffId: user.staffId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  } catch (error: any) {
    logger.error(`Error creating staff: ${error.message}`);
    throw error;
  }
};

export const getStaffById = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (!user) {
      const error = new Error('Staff member not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return {
      id: user.id,
      staffId: user.staffId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error: any) {
    logger.error(`Error fetching staff: ${error.message}`);
    throw error;
  }
};

export const getAllStaff = async (limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const [staff, total] = await Promise.all([
      prisma.user.findMany({
        include: {
          role: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return {
      data: staff.map((user) => ({
        id: user.id,
        staffId: user.staffId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: any) {
    logger.error(`Error fetching all staff: ${error.message}`);
    throw error;
  }
};

export const searchStaff = async (query: string, roleId?: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const where: any = {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { staffId: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (roleId) {
      where.roleId = roleId;
    }

    const [staff, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: true,
        },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: staff.map((user) => ({
        id: user.id,
        staffId: user.staffId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: any) {
    logger.error(`Error searching staff: ${error.message}`);
    throw error;
  }
};

export const updateStaff = async (id: string, data: any) => {
  try {
    // Check if trying to change email to one that already exists
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        const error = new Error('Email already in use');
        (error as any).statusCode = 400;
        throw error;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        email: data.email || undefined,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        phone: data.phone || undefined,
        roleId: data.roleId || undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
      include: {
        role: true,
      },
    });

    logger.info(`Staff member updated: ${user.id}`);
    return {
      id: user.id,
      staffId: user.staffId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      updatedAt: user.updatedAt,
    };
  } catch (error: any) {
    logger.error(`Error updating staff: ${error.message}`);
    throw error;
  }
};

export const deactivateStaff = async (id: string) => {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    logger.info(`Staff member deactivated: ${user.id}`);
    return {
      success: true,
      message: 'Staff member deactivated',
    };
  } catch (error: any) {
    logger.error(`Error deactivating staff: ${error.message}`);
    throw error;
  }
};

export const getStaffByRole = async (roleId: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const [staff, total] = await Promise.all([
      prisma.user.findMany({
        where: { roleId },
        include: {
          role: true,
        },
        skip,
        take,
      }),
      prisma.user.count({ where: { roleId } }),
    ]);

    return {
      data: staff.map((user) => ({
        id: user.id,
        staffId: user.staffId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
      total,
      limit: take,
      offset: skip,
    };
  } catch (error: any) {
    logger.error(`Error fetching staff by role: ${error.message}`);
    throw error;
  }
};
