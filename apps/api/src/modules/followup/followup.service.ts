import logger from '../../config/logger';
import * as followupRepository from './followup.repository';
import {
  CreateFollowUpInput,
  UpdateFollowUpInput,
} from './followup.validator';
import { ApiError } from '../../middlewares/errorHandler';

export const createNewFollowUp = async (data: CreateFollowUpInput, userId: string) => {
  try {
    const followUp = await followupRepository.createFollowUp(data);
    logger.info(`Follow-up created for patient ${data.patientId} by user ${userId}`);
    return {
      success: true,
      data: followUp,
    };
  } catch (error: any) {
    logger.error(`Service error creating follow-up: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create follow-up',
    };
  }
};

export const getFollowUp = async (id: string) => {
  try {
    const followUp = await followupRepository.getFollowUpById(id);
    if (!followUp) {
      throw new ApiError(404, 'FOLLOWUP_NOT_FOUND', 'Follow-up not found');
    }
    return {
      success: true,
      data: followUp,
    };
  } catch (error: any) {
    logger.error(`Service error fetching follow-up: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch follow-up',
    };
  }
};

export const getPatientFollowUpsService = async (patientId: string, limit?: number, offset?: number) => {
  try {
    const result = await followupRepository.getPatientFollowUps(patientId, limit, offset);
    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    logger.error(`Service error fetching patient follow-ups: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch patient follow-ups',
    };
  }
};

export const getDoctorFollowUpsService = async (doctorId: string, limit?: number, offset?: number) => {
  try {
    const result = await followupRepository.getDoctorFollowUps(doctorId, limit, offset);
    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    logger.error(`Service error fetching doctor follow-ups: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch doctor follow-ups',
    };
  }
};

export const getUpcomingFollowUpsService = async (days: number = 7, limit?: number, offset?: number) => {
  try {
    const result = await followupRepository.getUpcomingFollowUps(days, limit, offset);
    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    logger.error(`Service error fetching upcoming follow-ups: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch upcoming follow-ups',
    };
  }
};

export const updateFollowUpService = async (id: string, data: UpdateFollowUpInput, userId: string) => {
  try {
    const followUp = await followupRepository.updateFollowUp(id, data, userId);
    logger.info(`Follow-up ${id} updated by user ${userId}`);
    return {
      success: true,
      data: followUp,
    };
  } catch (error: any) {
    logger.error(`Service error updating follow-up: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update follow-up',
    };
  }
};

export const deleteFollowUpService = async (id: string, userId: string) => {
  try {
    await followupRepository.deleteFollowUp(id);
    logger.info(`Follow-up ${id} deleted by user ${userId}`);
    return {
      success: true,
      message: 'Follow-up deleted successfully',
    };
  } catch (error: any) {
    logger.error(`Service error deleting follow-up: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete follow-up',
    };
  }
};

export const getAllFollowUpsService = async (status?: string, limit?: number, offset?: number) => {
  try {
    const result = await followupRepository.getAllFollowUps(status, limit, offset);
    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    logger.error(`Service error listing follow-ups: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to list follow-ups',
    };
  }
};
