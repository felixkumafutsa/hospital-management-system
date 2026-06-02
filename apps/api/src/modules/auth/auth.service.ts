import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../../middlewares/errorHandler';
import * as authRepository from './auth.repository';
import { User } from '@prisma/client';

// JWT configuration
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || 'your_private_key';
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'your_public_key';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d';

// Generate access token
const generateAccessToken = (user: User): string => {
  const payload = {
    userId: user.id,
    roleId: user.roleId,
    jti: uuidv4(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt as any).sign(payload, JWT_PRIVATE_KEY, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'RS256',
  });
};

// Generate refresh token
const generateRefreshToken = (user: User): string => {
  const payload = {
    userId: user.id,
    jti: uuidv4(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt as any).sign(payload, JWT_PRIVATE_KEY, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: 'RS256',
  });
};

// Parse refresh token expiry
const getRefreshTokenExpiry = (): Date => {
  const expiryMap: { [key: string]: number } = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  
  const expiryMs = expiryMap[REFRESH_TOKEN_EXPIRY] || 7 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + expiryMs);
};

// Login service
export const login = async (email: string, password: string) => {
  // Find user by email
  const user = await authRepository.findUserByEmail(email);
  
  if (!user) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(401, 'ACCOUNT_INACTIVE', 'Your account is inactive. Please contact an administrator.');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token to database
  const expiresAt = getRefreshTokenExpiry();
  await authRepository.createRefreshToken(refreshToken, user.id, expiresAt);

  // Update last login
  await authRepository.updateLastLogin(user.id);

  // Return user data and tokens (exclude sensitive information)
  const { passwordHash, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
};

// Refresh token service
export const refreshToken = async (token: string) => {
  // Find refresh token in database
  const storedToken = await authRepository.findRefreshToken(token);
  
  if (!storedToken) {
    throw new ApiError(401, 'INVALID_TOKEN', 'Invalid refresh token');
  }

  // Check if token is revoked
  if (storedToken.revoked) {
    throw new ApiError(401, 'TOKEN_REVOKED', 'Refresh token has been revoked');
  }

  // Check if token is expired
  if (new Date() > storedToken.expiresAt) {
    throw new ApiError(401, 'TOKEN_EXPIRED', 'Refresh token has expired');
  }

  // Verify JWT
  try {
    jwt.verify(token, JWT_PUBLIC_KEY, { algorithms: ['RS256'] });
  } catch (error) {
    throw new ApiError(401, 'INVALID_TOKEN', 'Invalid refresh token');
  }

  // Get the user from the database
  const user = await authRepository.findUserById(storedToken.userId);
  if (!user) {
    throw new ApiError(401, 'USER_NOT_FOUND', 'User not found');
  }
  
  // Generate new tokens (rotating refresh token)
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Revoke old refresh token
  await authRepository.revokeRefreshToken(token);

  // Save new refresh token
  const expiresAt = getRefreshTokenExpiry();
  await authRepository.createRefreshToken(newRefreshToken, user.id, expiresAt);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 15 * 60,
  };
};

// Logout service
export const logout = async (refreshToken: string) => {
  try {
    await authRepository.revokeRefreshToken(refreshToken);
    return { success: true };
  } catch (error) {
    throw new ApiError(500, 'LOGOUT_FAILED', 'Failed to logout');
  }
};

// Change password service
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  // Find user
  const user = await authRepository.findUserById(userId);
  
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    throw new ApiError(401, 'INVALID_PASSWORD', 'Current password is incorrect');
  }

  // Hash new password
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await authRepository.updateUserPassword(userId, newPasswordHash);

  // Revoke all existing refresh tokens for security
  await authRepository.revokeAllUserRefreshTokens(userId);

  return { success: true, message: 'Password changed successfully' };
};

// Get current user service
export const getCurrentUser = async (userId: string) => {
  const user = await authRepository.findUserById(userId);
  
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};