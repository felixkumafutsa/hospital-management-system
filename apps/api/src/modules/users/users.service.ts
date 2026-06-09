import logger from '../../config/logger';
import * as userRepository from './users.repository';
import {
  CreateUserInput,
  UpdateUserInput,
} from './users.validator';

export const createNewUser = async (data: CreateUserInput) => {
  try {
    const user = await userRepository.createUser(data);

    return {
      success: true,
      data: user,
    };
  } catch (error: any) {
    logger.error(`Service error creating user: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create user',
    };
  }
};

export const getUser = async (id: string) => {
  try {
    const user = await userRepository.getUserById(id);

    return {
      success: true,
      data: user,
    };
  } catch (error: any) {
    logger.error(`Service error fetching user: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch user',
    };
  }
};

export const listAllUsers = async (limit?: number, offset?: number) => {
  try {
    const result = await userRepository.getAllUsers(limit, offset);

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
    logger.error(`Service error listing users: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to list users',
    };
  }
};

export const searchUsersService = async (
  query: string,
  roleId?: string,
  limit?: number,
  offset?: number
) => {
  try {
    const result = await userRepository.searchUsers(query, roleId, limit, offset);

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
    logger.error(`Service error searching users: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to search users',
    };
  }
};

export const updateUserService = async (id: string, data: UpdateUserInput) => {
  try {
    const user = await userRepository.updateUser(id, data);

    return {
      success: true,
      data: user,
    };
  } catch (error: any) {
    logger.error(`Service error updating user: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update user',
    };
  }
};

export const deactivateUserService = async (id: string) => {
  try {
    await userRepository.deactivateUser(id);

    return {
      success: true,
      message: 'User deactivated successfully',
    };
  } catch (error: any) {
    logger.error(`Service error deactivating user: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to deactivate user',
    };
  }
};

export const getUserByRoleService = async (roleId: string, limit?: number, offset?: number) => {
  try {
    const result = await userRepository.getUserByRole(roleId, limit, offset);

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
    logger.error(`Service error fetching user by role: ${error.message}`);
    throw {
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch user by role',
    };
  }
};