import {
  addBedsToWard,
  createWardWithBeds,
  getManagedWards,
} from './ward-management.repository';
import { AddWardBedsInput, CreateWardInput } from './ward-management.validator';

export const listManagedWards = async () => ({
  success: true,
  wards: await getManagedWards(),
});

export const createWard = async (input: CreateWardInput) => ({
  success: true,
  ward: await createWardWithBeds(input),
});

export const addBeds = async (wardId: string, input: AddWardBedsInput) => ({
  success: true,
  ward: await addBedsToWard(wardId, input),
});
