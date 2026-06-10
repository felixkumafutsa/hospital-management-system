import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import logger from '../../config/logger';

// Login controller
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    // Set refresh token as HTTP-only cookie for additional security
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true, // Always secure in production for cross-site
      sameSite: 'none', // Required for cross-site requests between different domains
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
  } catch (error: any) {
    logger.error(`Login failed for ${req.body.email}: ${error.message}`);
    next(error); // Pass error to Express error handler
  }
};

// Refresh token controller
export const refresh = async (req: Request, res: Response) => {
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
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
    });
  } catch (error: any) {
    logger.error(`Token refresh failed: ${error.message}`);
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired refresh token',
      },
    });
  }
};

// Logout controller
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/api/v1/auth',
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error: any) {
    logger.error(`Logout failed: ${error.message}`);
    throw error;
  }
};

// Change password controller
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.userId; // Set by auth middleware
    
    const result = await authService.changePassword(userId, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error(`Password change failed for user ${(req as any).user?.userId}: ${error.message}`);
    throw error;
  }
};

// Get current user controller
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await authService.getCurrentUser(userId);
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    logger.error(`Failed to get current user: ${error.message}`);
    throw error;
  }
};