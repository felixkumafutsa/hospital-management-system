import logger from '../../config/logger';
import * as labRepository from './lab.repository';
import {
  CreateLabTestInput,
  CreateLabRequestInput,
  UpdateLabRequestStatusInput,
  AddLabResultInput,
} from './lab.validator';

export const createNewLabTest = async (data: CreateLabTestInput) => {
  try {
    const labTest = await labRepository.createLabTest(data);

    return {
      success: true,
      data: labTest,
    };
  } catch (error: any) {
    logger.error(`Service error creating lab test: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create lab test',
    };
  }
};

export const getLabTest = async (id: string) => {
  try {
    const labTest = await labRepository.getLabTestById(id);

    return {
      success: true,
      data: labTest,
    };
  } catch (error: any) {
    logger.error(`Service error fetching lab test: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch lab test',
    };
  }
};

export const listAllLabTests = async (limit?: number, offset?: number) => {
  try {
    const result = await labRepository.getAllLabTests(limit, offset);

    return {
      success: true,
      data: result.data,
      pagination: {
        limit: result.limit,
        offset: result.offset,
        total: result.total,
      },
    };
  } catch (error: any) {
    logger.error(`Service error listing lab tests: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to list lab tests',
    };
  }
};

export const createNewLabRequest = async (data: CreateLabRequestInput) => {
  try {
    const labRequest = await labRepository.createLabRequest(data);

    return {
      success: true,
      data: labRequest,
    };
  } catch (error: any) {
    logger.error(`Service error creating lab request: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create lab request',
    };
  }
};

export const getLabRequest = async (id: string) => {
  try {
    const labRequest = await labRepository.getLabRequestById(id);

    return {
      success: true,
      data: labRequest,
    };
  } catch (error: any) {
    logger.error(`Service error fetching lab request: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch lab request',
    };
  }
};

export const getPatientLabRequests = async (patientId: string, limit?: number, offset?: number) => {
  try {
    const result = await labRepository.getLabRequestsByPatient(patientId, limit, offset);

    return {
      success: true,
      data: result.data,
      pagination: {
        limit: result.limit,
        offset: result.offset,
        total: result.total,
      },
    };
  } catch (error: any) {
    logger.error(`Service error fetching patient lab requests: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch patient lab requests',
    };
  }
};

export const listAllLabRequests = async (status?: string, limit?: number, offset?: number) => {
  try {
    const result = await labRepository.getAllLabRequests(status, limit, offset);

    return {
      success: true,
      data: result.data,
      pagination: {
        limit: result.limit,
        offset: result.offset,
        total: result.total,
      },
    };
  } catch (error: any) {
    logger.error(`Service error listing lab requests: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to list lab requests',
    };
  }
};

export const updateLabRequestStatusService = async (id: string, data: UpdateLabRequestStatusInput) => {
  try {
    const labRequest = await labRepository.updateLabRequestStatus(id, data.status, data.notes);

    return {
      success: true,
      data: labRequest,
    };
  } catch (error: any) {
    logger.error(`Service error updating lab request: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update lab request',
    };
  }
};

export const addLabResultService = async (requestId: string, data: AddLabResultInput) => {
  try {
    const labResult = await labRepository.addLabResult(requestId, data.testId, data);

    return {
      success: true,
      data: labResult,
    };
  } catch (error: any) {
    logger.error(`Service error adding lab result: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to add lab result',
    };
  }
};
