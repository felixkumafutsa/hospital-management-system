import { Request, Response, NextFunction } from 'express';
import { addBeds, createWard, listManagedWards } from './ward-management.service';
import { AddWardBedsInput, CreateWardInput } from './ward-management.validator';

export const listManagedWardsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(200).json(await listManagedWards());
  } catch (error) {
    next(error);
  }
};

export const createWardController = async (
  req: Request<{}, {}, CreateWardInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(201).json(await createWard(req.body));
  } catch (error) {
    next(error);
  }
};

export const addBedsController = async (
  req: Request<{ wardId: string }, {}, AddWardBedsInput>,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.status(201).json(await addBeds(req.params.wardId, req.body));
  } catch (error) {
    next(error);
  }
};
