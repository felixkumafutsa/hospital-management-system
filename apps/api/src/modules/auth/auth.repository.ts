import { prisma } from '../../config/database';
import { User, RefreshToken } from '@prisma/client';

// Find user by email
export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });
};

// Find user by ID
export const findUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });
};

// Create refresh token
export const createRefreshToken = async (
  token: string,
  userId: string,
  expiresAt: Date
): Promise<RefreshToken> => {
  return prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
};

// Find refresh token
export const findRefreshToken = async (token: string): Promise<RefreshToken | null> => {
  return prisma.refreshToken.findUnique({
    where: { token },
  });
};

// Revoke refresh token
export const revokeRefreshToken = async (token: string): Promise<RefreshToken> => {
  return prisma.refreshToken.update({
    where: { token },
    data: { revoked: true },
  });
};

// Revoke all refresh tokens for a user
export const revokeAllUserRefreshTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revoked: true },
  });
};

// Update user's last login
export const updateLastLogin = async (userId: string): Promise<User> => {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
};

// Update user password
export const updateUserPassword = async (
  userId: string,
  newPasswordHash: string
): Promise<User> => {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });
};