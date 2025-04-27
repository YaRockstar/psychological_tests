import * as UserRepository from '../repositories/UserRepository.js';
import { NotValidError } from '../errors/NotValidError.js';
import { normalizeUserData, validateUser } from '../utils/UserUtils.js';

/**
 * Создание нового пользователя.
 * @param {Object} userData - Данные пользователя.
 * @returns {Promise<Object>} - Созданный пользователь.
 */
export async function createUser(userData) {
  validateUser(userData, true);
  const normalizedUserData = normalizeUserData(userData);
  const createdUser = await UserRepository.createUser(normalizedUserData);
  return createdUser;
}

/**
 * Получение пользователя по email.
 * @param {string} email - Email пользователя.
 * @param {boolean} includePassword - Флаг включения пароля в результат.
 * @returns {Promise<Object|null>} - Найденный пользователь или null.
 */
export async function getUserByEmail(email, includePassword = false) {
  if (!email) {
    throw new NotValidError('Email не указан');
  }

  const user = await UserRepository.findUserByEmail(email);

  if (user && !includePassword) {
    delete user.password;
  }

  return user;
}

/**
 * Получение пользователя по ID.
 * @param {string} id - ID пользователя.
 * @param {boolean} includePassword - Флаг включения пароля в результат.
 * @returns {Promise<Object|null>} - Найденный пользователь или null.
 */
export async function getUserById(id, includePassword = false) {
  if (!id) {
    throw new NotValidError('ID не указан');
  }

  const user = await UserRepository.findUserById(id);

  if (user && !includePassword) {
    delete user.password;
  }

  return user;
}

/**
 * Обновление данных пользователя.
 * @param {string} id - ID пользователя.
 * @param {Object} userData - Данные для обновления.
 * @returns {Promise<Object|null>} - Обновленный пользователь или null.
 */
export async function updateUser(id, userData) {
  if (!id) {
    throw new NotValidError('ID не указан');
  }

  validateUser(userData, false);
  const normalizedUserData = normalizeUserData(userData);

  const updatedUser = await UserRepository.updateUser(id, normalizedUserData);

  if (updatedUser) {
    delete updatedUser.password;
  }

  return updatedUser;
}

/**
 * Удаление пользователя.
 * @param {string} id - ID пользователя.
 * @returns {Promise<boolean>} - Результат операции удаления.
 */
export async function deleteUser(id) {
  if (!id) {
    throw new NotValidError('ID не указан');
  }

  return await UserRepository.deleteUser(id);
}
