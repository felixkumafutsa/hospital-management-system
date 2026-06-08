import { Request, Response, NextFunction } from 'express';
import { 
  addAncRecord,
  getAncRecord,
  getAncRecordsForPatient,
  listAncRecords,
  updateAnc,
  addDeliveryRecord,
  getDeliveryRecord,
  getDeliveryRecordsForPatient,
  listDeliveryRecords,
  addPostnatalRecord,
  getPostnatalRecord,
  getPostnatalRecordsForPatient,
  listPostnatalRecords,
  getMaternityDashboardStats
} from './maternity.service';

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

export const getAncByPatientController = async (req: Request<{ patientId: string }>, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const records = await getAncRecordsForPatient(patientId);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

export const listAncController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await listAncRecords(req.query as any);
    
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

export const getDeliveryByPatientController = async (req: Request<{ patientId: string }>, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const records = await getDeliveryRecordsForPatient(patientId);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

export const listDeliveryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await listDeliveryRecords(req.query as any);
    
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

export const getPostnatalByPatientController = async (req: Request<{ patientId: string }>, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const records = await getPostnatalRecordsForPatient(patientId);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

export const listPostnatalController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await listPostnatalRecords(req.query as any);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard stats
export const getMaternityStatsController = async (_req: Request, res: Response, next: NextFunction) => {
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