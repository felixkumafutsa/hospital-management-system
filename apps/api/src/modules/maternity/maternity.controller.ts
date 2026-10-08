import { Request, Response, NextFunction } from 'express';
import {
  addAncRecord,
  getAncRecord,
  getAncRecordsForMaternityProfile,
  listAncRecords,
  updateAnc,
  addDeliveryRecord,
  getDeliveryRecord,
  getDeliveryRecordsForMaternityProfile,
  listDeliveryRecords,
  addPostnatalRecord,
  getPostnatalRecord,
  getPostnatalRecordsForMaternityProfile,
  listPostnatalRecords,
  getMaternityDashboardStats,
  getPatientMaternityRecords,
  markAncAsDelivered
} from './maternity.service';
import { ListMaternityRecordsInput } from './maternity.validator';

// ANC Controllers
export const createAncController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const record = await addAncRecord(req.body, userId);

    res.status(201).json({
      success: true,
      data: record,
      message: 'ANC record created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getAncController = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const record = await getAncRecord(id);

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

export const getAncByMaternityProfileController = async (req: Request<{ patientId: string }>, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const records = await getAncRecordsForMaternityProfile(patientId);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

export const listAncController = async (req: Request<object, object, object, ListMaternityRecordsInput>, res: Response, next: NextFunction) => {
  try {
    const result = await listAncRecords(req.query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const updateAncController = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const record = await updateAnc(id, req.body);

    res.json({
      success: true,
      data: record,
      message: 'ANC record updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delivery Controllers
export const createDeliveryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const record = await addDeliveryRecord(req.body, userId);

    res.status(201).json({
      success: true,
      data: record,
      message: 'Delivery record created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryController = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const record = await getDeliveryRecord(id);

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryByMaternityProfileController = async (req: Request<{ patientId: string }>, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const records = await getDeliveryRecordsForMaternityProfile(patientId);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

export const listDeliveryController = async (req: Request<object, object, object, ListMaternityRecordsInput>, res: Response, next: NextFunction) => {
  try {
    const result = await listDeliveryRecords(req.query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Postnatal Controllers
export const createPostnatalController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const record = await addPostnatalRecord(req.body, userId);

    res.status(201).json({
      success: true,
      data: record,
      message: 'Postnatal record created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getPostnatalController = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const record = await getPostnatalRecord(id);

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

export const getPostnatalByMaternityProfileController = async (req: Request<{ patientId: string }>, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const records = await getPostnatalRecordsForMaternityProfile(patientId);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

export const listPostnatalController = async (req: Request<object, object, object, ListMaternityRecordsInput>, res: Response, next: NextFunction) => {
  try {
    const result = await listPostnatalRecords(req.query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Stats Controller
export const getStatsController = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getMaternityDashboardStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientMaternityRecordsController = async (req: Request<{ patientId: string }>, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const records = await getPatientMaternityRecords(patientId);
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

// New controller to mark ANC record as delivered
export const markAncAsDeliveredController = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id: ancId } = req.params;
    const userId = req.user!.userId;
    const result = await markAncAsDelivered(ancId, userId, req.body);

    res.json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};