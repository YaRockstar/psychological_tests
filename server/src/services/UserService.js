import { normalizeUserData, formatUserResponse } from '../utils/Mapper.js';
import { validateUser } from '../utils/Validator.js';
import logger from '../utils/Logger.js';
import * as userRepository from '../repositories/UserRepository.js';

/**
 * Создание нового пользователя.
 * @param {Object} userData - Данные пользователя.
 * @returns {Promise<Object>} - Созданный пользователь.
 */
export async function createUser(userData) {
  logger.info(`Creating user with email: ${userData.email}`);
  try {
    validateUser(userData, true);
    const normalizedData = normalizeUserData(userData);
    const createdUser = await userRepository.createUser(normalizedData);
    logger.info(`User created with id: ${createdUser._id}`);
    return formatUserResponse(createdUser);
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Получение пользователя по email.
 * @param {string} email - Email пользователя.
 * @returns {Promise<Object|null>} - Найденный пользователь или null.
 */
export async function getUserByEmail(email) {
  logger.info(`Getting user by email: ${email}`);
  try {
    const user = await userRepository.findUserByEmail(email);
    if (user) {
      logger.info(`User found by email: ${email}`);
      return formatUserResponse(user);
    } else {
      logger.warn(`User not found by email: ${email}`);
      return null;
    }
  } catch (error) {
    logger.error(`Error getting user by email ${email}:`, error);
    throw error;
  }
}

/**
 * Получение пользователя по ID.
 * @param {string} id - ID пользователя.
 * @returns {Promise<Object|null>} - Найденный пользователь или null.
 */
export async function getUserById(id) {
  logger.info(`Getting user by id: ${id}`);
  try {
    const user = await userRepository.findUserById(id);
    if (user) {
      logger.info(`User found by id: ${id}`);
      return formatUserResponse(user);
    } else {
      logger.warn(`User not found by id: ${id}`);
      return null;
    }
  } catch (error) {
    logger.error(`Error getting user by id ${id}:`, error);
    throw error;
  }
}

/**
 * Обновление пользователя.
 * @param {string} id - ID пользователя.
 * @param {Object} userData - Данные для обновления.
 * @returns {Promise<Object|null>} - Обновленный пользователь или null.
 */
export async function updateUser(id, userData) {
  logger.info(`Updating user with id: ${id}`);
  try {
    validateUser(userData);
    const normalizedData = normalizeUserData(userData);
    const updatedUser = await userRepository.updateUser(id, normalizedData);
    if (updatedUser) {
      logger.info(`User updated with id: ${id}`);
      return formatUserResponse(updatedUser);
    } else {
      logger.warn(`User with id ${id} not found for update`);
      return null;
    }
  } catch (error) {
    logger.error(`Error updating user with id ${id}:`, error);
    throw error;
  }
}

/**
 * Удаление пользователя.
 * @param {string} id - ID пользователя.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export async function deleteUser(id) {
  logger.info(`Deleting user with id: ${id}`);
  try {
    const result = await userRepository.deleteUser(id);
    if (result) {
      logger.info(`User deleted with id: ${id}`);
    } else {
      logger.warn(`User with id ${id} not found for deletion`);
    }
    return result;
  } catch (error) {
    logger.error(`Error deleting user with id ${id}:`, error);
    throw error;
  }
}
