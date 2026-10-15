import { Request, Response, NextFunction } from 'express';
import * as dutyRosterService from './duty-roster.service';

export const createDutyRoster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dutyRoster = await dutyRosterService.createDutyRoster(req.body);
    res.status(201).json(dutyRoster);
  } catch (error) {
    return next(error);
  }
};

export const getDutyRoster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const dutyRoster = await dutyRosterService.getDutyRosterById(id);
    if (!dutyRoster) {
      return res.status(404).json({ message: 'Duty roster not found' });
    }
    res.json(dutyRoster);
  } catch (error) {
    return next(error);
  }
};

export const getDutyRosters = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dutyRosters = await dutyRosterService.getAllDutyRosters();
    res.json(dutyRosters);
  } catch (error) {
    return next(error);
  }
};

export const updateDutyRoster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const dutyRoster = await dutyRosterService.updateDutyRosterById(id, req.body);
    if (!dutyRoster) {
      return res.status(404).json({ message: 'Duty roster not found' });
    }
    res.json(dutyRoster);
  } catch (error) {
    return next(error);
  }
};

export const deleteDutyRoster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const dutyRoster = await dutyRosterService.deleteDutyRosterById(id);
    if (!dutyRoster) {
      return res.status(404).json({ message: 'Duty roster not found' });
    }
    res.status(204).send();
  } catch (error) {
    return next(error);
  }
};