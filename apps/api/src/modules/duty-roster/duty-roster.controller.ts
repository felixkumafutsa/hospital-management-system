import { Request, Response } from 'express';
import * as dutyRosterService from './duty-roster.service';

export const createDutyRoster = async (req: Request, res: Response): Promise<void> => {
  const dutyRoster = await dutyRosterService.createDutyRoster(req.body);
  res.status(201).json(dutyRoster);
};

export const getDutyRoster = async (req: Request, res: Response): Promise<Response> => {
  const id = req.params.id as string;
  const dutyRoster = await dutyRosterService.getDutyRosterById(id);
  if (!dutyRoster) {
    return res.status(404).json({ message: 'Duty roster not found' });
  }
  return res.json(dutyRoster);
};

export const getDutyRosters = async (_req: Request, res: Response): Promise<void> => {
  const dutyRosters = await dutyRosterService.getAllDutyRosters();
  res.json(dutyRosters);
};

export const updateDutyRoster = async (req: Request, res: Response): Promise<Response> => {
  const id = req.params.id as string;
  const dutyRoster = await dutyRosterService.updateDutyRosterById(id, req.body);
  if (!dutyRoster) {
    return res.status(404).json({ message: 'Duty roster not found' });
  }
  return res.json(dutyRoster);
};

export const deleteDutyRoster = async (req: Request, res: Response): Promise<Response> => {
  const id = req.params.id as string;
  const dutyRoster = await dutyRosterService.deleteDutyRosterById(id);
  if (!dutyRoster) {
    return res.status(404).json({ message: 'Duty roster not found' });
  }
  return res.status(204).send();
};