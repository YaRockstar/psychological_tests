import { toUserDto, toUserEntity } from '../utils/Mapper.js';
import logger from '../utils/Logger.js';
import * as userRepository from '../repositories/mongoDB/UserRepositoryMongo.js';

/**
 * Создает нового пользователя
 * @param {Object} userDto - DTO пользователя
 * @returns {Promise<Object>} - Созданный пользователь
 */
export async function createUser(userDto) {
  logger.info(`Creating user with email: ${userDto.email}`);
  try {
    const userEntity = toUserEntity(userDto);
    const createdUser = await userRepository.createUser(userEntity);
    logger.info(`User created with id: ${createdUser._id}`);
    return toUserDto(createdUser);
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Получает пользователя по email
 * @param {string} email - Email пользователя
 * @returns {Promise<Object|null>} - Найденный пользователь или null
 */
export async function getUserByEmail(email) {
  logger.info(`Getting user by email: ${email}`);
  try {
    const userEntity = await userRepository.findUserByEmail(email);
    if (userEntity) {
      logger.info(`User found by email: ${email}`);
    } else {
      logger.warn(`User not found by email: ${email}`);
    }
    return userEntity ? toUserDto(userEntity) : null;
  } catch (error) {
    logger.error(`Error getting user by email ${email}:`, error);
    throw error;
  }
}

/**
 * Получает пользователя по ID
 * @param {string} id - ID пользователя
 * @returns {Promise<Object|null>} - Найденный пользователь или null
 */
export async function getUserById(id) {
  logger.info(`Getting user by id: ${id}`);
  try {
    const userEntity = await userRepository.findUserById(id);
    if (userEntity) {
      logger.info(`User found by id: ${id}`);
    } else {
      logger.warn(`User not found by id: ${id}`);
    }
    return userEntity ? toUserDto(userEntity) : null;
  } catch (error) {
    logger.error(`Error getting user by id ${id}:`, error);
    throw error;
  }
}

/**
 * Обновляет пользователя
 * @param {string} id - ID пользователя
 * @param {Object} data - Данные для обновления
 * @returns {Promise<Object|null>} - Обновленный пользователь или null
 */
export async function updateUser(id, data) {
  logger.info(`Updating user with id: ${id}`);
  try {
    const userEntity = await userRepository.updateUser(id, toUserEntity(data));
    if (userEntity) {
      logger.info(`User updated with id: ${id}`);
    } else {
      logger.warn(`User with id ${id} not found for update`);
    }
    return userEntity ? toUserDto(userEntity) : null;
  } catch (error) {
    logger.error(`Error updating user with id ${id}:`, error);
    throw error;
  }
}

/**
 * Удаляет пользователя
 * @param {string} id - ID пользователя
 * @returns {Promise<boolean>} - Результат удаления
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
