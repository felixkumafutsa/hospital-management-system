import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import logger from '../../config/logger';

const prisma = new PrismaClient();

export const createUser = async (data: any) => {
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

    // Generate user ID
    const userCount = await prisma.user.count();
    const userId = `BL-USR-${String(userCount + 1).padStart(3, '0')}`;

    const user = await prisma.user.create({
      data: {
        staffId: userId,
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

    logger.info(`User created: ${user.id}`);
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
    logger.error(`Error creating user: ${error.message}`);
    throw error;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (!user) {
      const error = new Error('User not found');
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
    logger.error(`Error fetching user: ${error.message}`);
    throw error;
  }
};

export const getAllUsers = async (limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const [users, total] = await Promise.all([
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
      data: users.map((user) => ({
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
    logger.error(`Error fetching all users: ${error.message}`);
    throw error;
  }
};

export const searchUsers = async (query: string, roleId?: string, limit?: number, offset?: number) => {
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

    const [users, total] = await Promise.all([
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
      data: users.map((user) => ({
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
    logger.error(`Error searching users: ${error.message}`);
    throw error;
  }
};

export const updateUser = async (id: string, data: any) => {
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

    logger.info(`User updated: ${user.id}`);
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
    logger.error(`Error updating user: ${error.message}`);
    throw error;
  }
};

export const deactivateUser = async (id: string) => {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    logger.info(`User deactivated: ${user.id}`);
    return {
      success: true,
      message: 'User deactivated',
    };
  } catch (error: any) {
    logger.error(`Error deactivating user: ${error.message}`);
    throw error;
  }
};

export const getUserByRole = async (roleId: string, limit?: number, offset?: number) => {
  try {
    const skip = offset || 0;
    const take = limit || 10;

    const [users, total] = await Promise.all([
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
      data: users.map((user) => ({
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
    logger.error(`Error fetching users by role: ${error.message}`);
    throw error;
  }
};