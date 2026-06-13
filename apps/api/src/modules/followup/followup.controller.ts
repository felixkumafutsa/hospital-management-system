import { Request, Response, NextFunction } from 'express';
import * as followupService from './followup.service';
import { CreateFollowUpInput, UpdateFollowUpInput } from './followup.validator';

export const createFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const data: CreateFollowUpInput = req.body;
    const result = await followupService.createNewFollowUp(data, userId);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getFollowUpById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await followupService.getFollowUp(id as string);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getPatientFollowUps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const { limit, offset } = req.query as { limit?: string | string[]; offset?: string | string[] };
    const result = await followupService.getPatientFollowUpsService(patientId as string, 
      limit ? parseInt(Array.isArray(limit) ? limit[0] : limit) : undefined,
      offset ? parseInt(Array.isArray(offset) ? offset[0] : offset) : undefined
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getDoctorFollowUps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId } = req.params;
    const { limit, offset } = req.query as { limit?: string | string[]; offset?: string | string[] };
    const result = await followupService.getDoctorFollowUpsService(doctorId as string, 
      limit ? parseInt(Array.isArray(limit) ? limit[0] : limit) : undefined,
      offset ? parseInt(Array.isArray(offset) ? offset[0] : offset) : undefined
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getUpcomingFollowUps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days, limit, offset } = req.query as { days?: string | string[]; limit?: string | string[]; offset?: string | string[] };
    const result = await followupService.getUpcomingFollowUpsService(
      days ? parseInt(Array.isArray(days) ? days[0] : days) : 7,
      limit ? parseInt(Array.isArray(limit) ? limit[0] : limit) : undefined,
      offset ? parseInt(Array.isArray(offset) ? offset[0] : offset) : undefined
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const updateFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const data: UpdateFollowUpInput = req.body;
    const result = await followupService.updateFollowUpService(id as string, data, userId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const deleteFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const result = await followupService.deleteFollowUpService(id as string, userId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getAllFollowUps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, limit, offset } = req.query as { status?: string | string[]; limit?: string | string[]; offset?: string | string[] };
    const result = await followupService.getAllFollowUpsService(
      status as string | undefined,
      limit ? parseInt(Array.isArray(limit) ? limit[0] : limit) : undefined,
      offset ? parseInt(Array.isArray(offset) ? offset[0] : offset) : undefined
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};