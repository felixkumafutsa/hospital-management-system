import { Request, Response } from 'express';
import * as theaterService from './theater.service';
import { asyncHandler } from '../../utils/asyncHandler';

export const createSurgicalProcedure = asyncHandler(async (req: Request, res: Response) => {
  const surgicalProcedure = await theaterService.createSurgicalProcedure(req.body);
  res.status(201).json(surgicalProcedure);
});

export const createMaternitySurgicalRequest = asyncHandler(async (req: Request, res: Response) => {
  const procedure = await theaterService.createMaternitySurgicalRequest(
    req.body,
    req.user!.userId,
  );
  res.status(201).json(procedure);
});

export const createProcedureCatalog = asyncHandler(async (req: Request, res: Response) => {
  const catalogItem = await theaterService.createProcedureCatalog(req.body);
  res.status(201).json(catalogItem);
});

export const getProcedureCatalog = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(await theaterService.getProcedureCatalog());
});

export const updateProcedureCatalog = asyncHandler(async (req: Request, res: Response) => {
  const catalogItem = await theaterService.updateProcedureCatalog(req.params.id as string, req.body);
  res.status(200).json(catalogItem);
});

export const getTheaterResources = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(await theaterService.getTheaterResources());
});

export const createTheater = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await theaterService.createTheater(req.body));
});

export const updateTheater = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await theaterService.updateTheater(req.params.id as string, req.body));
});

export const getAllSurgicalProcedures = asyncHandler(async (_req: Request, res: Response) => {
  const surgicalProcedures = await theaterService.getAllSurgicalProcedures();
  res.status(200).json(surgicalProcedures);
});

export const getSurgicalProcedureById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const surgicalProcedure = await theaterService.getSurgicalProcedureById(id as string);
  res.status(200).json(surgicalProcedure);
});

export const updateSurgicalProcedure = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const surgicalProcedure = await theaterService.updateSurgicalProcedure(id as string, req.body);
  res.status(200).json(surgicalProcedure);
});