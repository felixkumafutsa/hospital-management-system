import logger from '../../config/logger';
import * as prescriptionRepository from './prescription.repository';
import { CreatePrescriptionInput, UpdatePrescriptionStatusInput } from './prescription.validator';

export const createNewPrescription = async (data: CreatePrescriptionInput) => {
  try {
    const prescription = await prescriptionRepository.createPrescription(data);

    return {
      success: true,
      data: {
        id: prescription.id,
        status: prescription.status,
        items: prescription.items,
        createdAt: prescription.createdAt,
      },
    };
  } catch (error: any) {
    logger.error(`Service error creating prescription: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create prescription',
    };
  }
};

export const getPrescription = async (id: string) => {
  try {
    const prescription = await prescriptionRepository.getPrescriptionById(id);

    return {
      success: true,
      data: prescription,
    };
  } catch (error: any) {
    logger.error(`Service error fetching prescription: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch prescription',
    };
  }
};

export const getPatientPrescriptions = async (patientId: string, limit?: number, offset?: number) => {
  try {
    const result = await prescriptionRepository.getPrescriptionsByPatient(patientId, limit, offset);

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
    logger.error(`Service error fetching patient prescriptions: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch patient prescriptions',
    };
  }
};

export const listAllPrescriptions = async (status?: string, limit?: number, offset?: number) => {
  try {
    const result = await prescriptionRepository.getAllPrescriptions(status, limit, offset);

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
    logger.error(`Service error listing prescriptions: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to list prescriptions',
    };
  }
};

export const updatePrescriptionStatusService = async (id: string, data: UpdatePrescriptionStatusInput) => {
  try {
    const prescription = await prescriptionRepository.updatePrescriptionStatus(
      id,
      data.status,
      data.dispensedBy,
      data.notes
    );

    return {
      success: true,
      data: prescription,
    };
  } catch (error: any) {
    logger.error(`Service error updating prescription status: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update prescription status',
    };
  }
};

export const deletePrescriptionService = async (id: string) => {
  try {
    await prescriptionRepository.deletePrescription(id);

    return {
      success: true,
      message: 'Prescription deleted successfully',
    };
  } catch (error: any) {
    logger.error(`Service error deleting prescription: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete prescription',
    };
  }
};
