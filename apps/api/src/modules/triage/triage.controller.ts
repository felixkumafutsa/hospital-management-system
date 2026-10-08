import { Request, Response, NextFunction } from 'express';
import {
  recordPatientVitals,
  fetchVitalsForVisit,
  fetchTriageQueue,
  fetchTriageCount,
} from './triage.service';

export const recordVitalsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const nurseId = req.user?.userId;
    if (!nurseId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const result = await recordPatientVitals(
     nurseId ,
      req.body
    );
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getVitalsByVisitController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await fetchVitalsForVisit(req.params.visitId as string);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getTriageQueueController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await fetchTriageQueue();
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getTriageCountController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
    const result = await fetchTriageCount(fromDate, toDate);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};