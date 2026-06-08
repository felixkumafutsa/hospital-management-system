import { Request, Response, NextFunction } from 'express';
import {
  createNewStaff,
  getStaff,
  listAllStaff,
  searchStaffService,
  updateStaffService,
  deactivateStaffService,
  getStaffByRoleService,
} from './staff.service';
import { CreateStaffInput, UpdateStaffInput } from './staff.validator';

export const createStaffController = async (
  req: Request<{}, {}, CreateStaffInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createNewStaff(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getStaffController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getStaff(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllStaffController = async (
  req: Request<{}, {}, {}, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await listAllStaff(limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const searchStaffController = async (
  req: Request<{}, {}, {}, { q: string; role?: string; limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await searchStaffService(req.query.q, req.query.role, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateStaffController = async (
  req: Request<{ id: string }, {}, UpdateStaffInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await updateStaffService(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deactivateStaffController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await deactivateStaffService(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getStaffByRoleController = async (
  req: Request<{ roleId: string }, {}, {}, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await getStaffByRoleService(req.params.roleId, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
