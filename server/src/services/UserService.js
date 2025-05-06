import bcrypt from 'bcrypt';
import { NotFoundError } from '../errors/NotFoundError.js';
import { NotValidError } from '../errors/NotValidError.js';
import * as UserRepository from '../repositories/UserRepository.js';
import { normalizeUserData, validateUser } from '../utils/UserUtils.js';

/**
 * Создание нового пользователя.
 * @param {Object} userData - Данные пользователя.
 * @returns {Promise<Object>} - Созданный пользователь.
 */
export async function createUser(userData) {
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
 * Обновление пароля пользователя
 * @param {string} id - ID пользователя
 * @param {string} newPassword - Новый пароль
 * @returns {Promise<Object>} - Обновленный объект пользователя
 * @throws {NotValidError} - Если не указан ID или пароль
 * @throws {NotFoundError} - Если пользователь не найден
 */
export async function updatePassword(id, newPassword) {
  if (!id) {
    throw new NotValidError('ID не указан');
  }

  if (!newPassword) {
    throw new NotValidError('Новый пароль не указан');
  }

  // Валидация нового пароля
  if (newPassword.length < 8) {
    throw new NotValidError('Пароль должен содержать не менее 8 символов');
  }

  // Хеширование нового пароля
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Обновление пароля
  const updatedUser = await UserRepository.updateUser(id, {
    password: hashedPassword,
  });

  if (!updatedUser) {
    throw new NotFoundError('Пользователь не найден');
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
