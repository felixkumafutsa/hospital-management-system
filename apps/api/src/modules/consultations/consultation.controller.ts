import { Request, Response, NextFunction } from 'express';
import {
  recordConsultation,
  getConsultation,
  getConsultationForVisit,
  listConsultations,
} from './consultation.service';

export const recordConsultationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const doctorId = req.user?.userId;
    if (!doctorId) {
      return res.status(401).json({ success: false, message: 'Doctor must be logged in' });
    }

    const result = await recordConsultation(doctorId, req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getConsultationByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getConsultation(req.params.id as string);
    if (!result) {
      return res.status(404).json({ message: 'Consultation not found' });
    }
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getConsultationByVisitController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getConsultationForVisit(req.params.visitId as string);
    if (!result) {
      return res.status(404).json({ message: 'Consultation not found for this visit' });
    }
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const listConsultationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const result = await listConsultations(limit, offset);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};