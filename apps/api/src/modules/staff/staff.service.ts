import logger from '../../config/logger';
import * as staffRepository from './staff.repository';
import {
  CreateStaffInput,
  UpdateStaffInput,
} from './staff.validator';

export const createNewStaff = async (data: CreateStaffInput) => {
  try {
    const staff = await staffRepository.createStaff(data);

    return {
      success: true,
      data: staff,
    };
  } catch (error: any) {
    logger.error(`Service error creating staff: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create staff',
    };
  }
};

export const getStaff = async (id: string) => {
  try {
    const staff = await staffRepository.getStaffById(id);

    return {
      success: true,
      data: staff,
    };
  } catch (error: any) {
    logger.error(`Service error fetching staff: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch staff',
    };
  }
};

export const listAllStaff = async (limit?: number, offset?: number) => {
  try {
    const result = await staffRepository.getAllStaff(limit, offset);

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
    logger.error(`Service error listing staff: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to list staff',
    };
  }
};

export const searchStaffService = async (
  query: string,
  roleId?: string,
  limit?: number,
  offset?: number
) => {
  try {
    const result = await staffRepository.searchStaff(query, roleId, limit, offset);

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
    logger.error(`Service error searching staff: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to search staff',
    };
  }
};

export const updateStaffService = async (id: string, data: UpdateStaffInput) => {
  try {
    const staff = await staffRepository.updateStaff(id, data);

    return {
      success: true,
      data: staff,
    };
  } catch (error: any) {
    logger.error(`Service error updating staff: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update staff',
    };
  }
};

export const deactivateStaffService = async (id: string) => {
  try {
    await staffRepository.deactivateStaff(id);

    return {
      success: true,
      message: 'Staff member deactivated successfully',
    };
  } catch (error: any) {
    logger.error(`Service error deactivating staff: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to deactivate staff',
    };
  }
};

export const getStaffByRoleService = async (roleId: string, limit?: number, offset?: number) => {
  try {
    const result = await staffRepository.getStaffByRole(roleId, limit, offset);

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
    logger.error(`Service error fetching staff by role: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch staff by role',
    };
  }
};
