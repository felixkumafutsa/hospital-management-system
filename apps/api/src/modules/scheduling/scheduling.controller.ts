import { Request, Response, NextFunction } from 'express';
import { 
  addStaffSchedule,
  getSchedule,
  getSchedulesForUser,
  getSchedulesForDepartment,
  listSchedules,
  updateStaffSchedule,
  removeSchedule,
  submitTimeOffRequest,
  getTimeOffRequest,
  getPendingRequests,
  getTimeOffForUser,
  processTimeOffRequest,
  getSchedulingDashboardStats
} from './scheduling.service';

// Schedule Controllers
export const createScheduleController = async (
  req: Request<{}, {}, any>,
  res: Response,
  next: NextFunction
) => {
  try {
    const schedule = await addStaffSchedule(req.body);
    res.status(201).json({
      success: true,
      data: schedule,
      message: 'Schedule created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getScheduleController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const schedule = await getSchedule(id);
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

export const getSchedulesByUserController = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    const schedules = await getSchedulesForUser(
      userId, 
      startDate as string, 
      endDate as string
    );
    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

export const getSchedulesByDepartmentController = async (
  req: Request<{ department: string; date: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { department, date } = req.params;
    const schedules = await getSchedulesForDepartment(department, date);
    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

export const listSchedulesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await listSchedules(req.query as any);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const updateScheduleController = async (
  req: Request<{ id: string }, {}, any>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const schedule = await updateStaffSchedule(id, req.body);
    res.json({
      success: true,
      data: schedule,
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteScheduleController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await removeSchedule(id);
    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Time Off Request Controllers
export const createTimeOffController = async (
  req: Request<{}, {}, any>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const request = await submitTimeOffRequest(req.body, userId);
    res.status(201).json({
      success: true,
      data: request,
      message: 'Time off request submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getTimeOffController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const request = await getTimeOffRequest(id);
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingTimeOffController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requests = await getPendingRequests();
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

export const getTimeOffByUserController = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const requests = await getTimeOffForUser(userId);
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

export const processTimeOffController = async (
  req: Request<{ id: string }, {}, any>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const approverId = req.user!.userId;
    const request = await processTimeOffRequest(id, action, approverId);
    res.json({
      success: true,
      data: request,
      message: `Time off request ${action.toLowerCase()}d successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard stats
export const getSchedulingStatsController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await getSchedulingDashboardStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};