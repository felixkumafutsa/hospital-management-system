import { Request, Response, NextFunction } from 'express';
import { getConsultationFee, setConsultationFee } from './settings.repository';

export const getPricingSettingsController = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const consultationFee = await getConsultationFee();
    return res.status(200).json({ success: true, settings: { consultationFee } });
  } catch (error) {
    return next(error);
  }
};

export const updateConsultationFeeController = async (
  req: Request<object, object, { consultationFee: number }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const setting = await setConsultationFee(req.body.consultationFee);
    return res.status(200).json({ success: true, consultationFee: Number(setting.value) });
  } catch (error) {
    return next(error);
  }
};