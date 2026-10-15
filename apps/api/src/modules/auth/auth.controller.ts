import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import logger from '../../config/logger';

// Login controller
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    // Set refresh token as HTTP-only cookie for additional security
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction || req.secure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth',
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
    });
  } catch (error: unknown) {
    logger.error(`Login failed for ${req.body.email}: ${(error as Error).message}`);
    return next(error); // Pass error to Express error handler
  }
};

// Refresh token controller
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Try to get refresh token from cookie first, then from request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token is required',
        },
      });
    }

    const result = await authService.refreshToken(refreshToken);
    
    // Update the refresh token cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction || req.secure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
    });
  } catch (error: unknown) {
    logger.error(`Token refresh failed: ${(error as Error).message}`);
    return next(error);
  }
};

// Logout controller
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear the refresh token cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction || req.secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error: unknown) {
    logger.error(`Logout failed: ${(error as Error).message}`);
    return next(error);
  }
};

// Change password controller
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
    }
    
    const result = await authService.changePassword(userId, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    logger.error(`Password change failed for user ${req.user?.userId}: ${(error as Error).message}`);
    return next(error);
  }
};

// Get current user controller
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
    }
    
    const user = await authService.getCurrentUser(userId);
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: unknown) {
    logger.error(`Failed to get current user: ${(error as Error).message}`);
    return next(error);
  }
};