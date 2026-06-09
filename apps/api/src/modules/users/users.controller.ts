import { Request, Response, NextFunction } from 'express';
import {
  createNewUser,
  getUser,
  listAllUsers,
  searchUsersService,
  updateUserService,
  deactivateUserService,
  getUserByRoleService,
} from './users.service';
import { CreateUserInput, UpdateUserInput } from './users.validator';

export const createUserController = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await createNewUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getUser(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllUsersController = async (
  req: Request<{}, {}, {}, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await listAllUsers(limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const searchUsersController = async (
  req: Request<{}, {}, {}, { q: string; role?: string; limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await searchUsersService(req.query.q, req.query.role, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateUserController = async (
  req: Request<{ id: string }, {}, UpdateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await updateUserService(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deactivateUserController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await deactivateUserService(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserByRoleController = async (
  req: Request<{ roleId: string }, {}, {}, { limit?: string; offset?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const result = await getUserByRoleService(req.params.roleId, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};